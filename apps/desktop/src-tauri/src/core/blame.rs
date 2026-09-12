use std::collections::HashMap;
use std::path::Path;

use git2::{BlameOptions, Oid, Repository};
use serde::Serialize;

use crate::error::{AppError, AppResult};

const MAX_BLAME_BYTES: usize = 5 * 1024 * 1024;

#[derive(Serialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct BlameHunk {
    pub oid: String,
    pub short_oid: String,
    pub summary: String,
    pub author_name: String,
    pub author_email: String,
    pub time: i64,
    pub start_line: usize,
    pub line_count: usize,
    pub committed: bool,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FileBlame {
    pub path: String,
    pub rev: Option<String>,
    pub lines: Vec<String>,
    pub hunks: Vec<BlameHunk>,
}

pub fn blame_file(path: &str, file: &str, rev: Option<&str>) -> AppResult<FileBlame> {
    let repo = super::repo::open(path)?;
    let newest = match rev {
        Some(rev) => Some(repo.revparse_single(rev)?.peel_to_commit()?.id()),
        None => None,
    };
    let content = file_content(&repo, file, newest)?;
    if content.len() > MAX_BLAME_BYTES {
        return Err(AppError::other(format!(
            "{file} is too large to blame ({} MB)",
            content.len() / (1024 * 1024)
        )));
    }
    if content.contains(&0) {
        return Err(AppError::other(format!("{file} is a binary file")));
    }

    let mut opts = BlameOptions::new();
    if let Some(oid) = newest {
        opts.newest_commit(oid);
    }
    let committed_blame = repo.blame_file(Path::new(file), Some(&mut opts))?;
    let blame = if newest.is_none() {
        committed_blame.blame_buffer(&content)?
    } else {
        committed_blame
    };

    let text = String::from_utf8_lossy(&content);
    let mut lines: Vec<String> = text.split('\n').map(str::to_string).collect();
    if lines.last().is_some_and(String::is_empty) {
        lines.pop();
    }

    let mut summaries: HashMap<Oid, String> = HashMap::new();
    let mut hunks: Vec<BlameHunk> = blame
        .iter()
        .map(|hunk| {
            let oid = hunk.final_commit_id();
            let committed = !oid.is_zero();
            let (author_name, author_email, time) = if committed {
                let signature = hunk.final_signature();
                (
                    signature.name().unwrap_or("").to_string(),
                    signature.email().unwrap_or("").to_string(),
                    signature.when().seconds(),
                )
            } else {
                (
                    "Not committed yet".to_string(),
                    String::new(),
                    std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .map(|d| d.as_secs() as i64)
                        .unwrap_or_default(),
                )
            };
            let summary = if committed {
                summaries
                    .entry(oid)
                    .or_insert_with(|| {
                        repo.find_commit(oid)
                            .ok()
                            .and_then(|commit| commit.summary().map(str::to_string))
                            .unwrap_or_default()
                    })
                    .clone()
            } else {
                "Uncommitted changes".to_string()
            };
            let oid_text = oid.to_string();
            BlameHunk {
                short_oid: oid_text[..7].to_string(),
                oid: oid_text,
                summary,
                author_name,
                author_email,
                time,
                start_line: hunk.final_start_line(),
                line_count: hunk.lines_in_hunk(),
                committed,
            }
        })
        .collect();
    hunks.sort_by_key(|hunk| hunk.start_line);

    Ok(FileBlame {
        path: file.to_string(),
        rev: newest.map(|oid| oid.to_string()),
        lines,
        hunks,
    })
}

fn file_content(repo: &Repository, file: &str, newest: Option<Oid>) -> AppResult<Vec<u8>> {
    match newest {
        Some(oid) => {
            let commit = repo.find_commit(oid)?;
            let entry = commit.tree()?.get_path(Path::new(file))?;
            let blob = repo.find_blob(entry.id())?;
            Ok(blob.content().to_vec())
        }
        None => {
            let workdir = repo.workdir().ok_or_else(|| {
                AppError::other("bare repositories have no working copy to blame")
            })?;
            Ok(std::fs::read(workdir.join(file))?)
        }
    }
}
