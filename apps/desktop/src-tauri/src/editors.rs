use std::path::Path;
use std::process::{Command, Stdio};

use serde::Serialize;

use crate::ai_cli::search_path;
use crate::error::{AppError, AppResult};
use crate::proc;

#[derive(Serialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct EditorInfo {
    pub id: String,
    pub label: String,
    pub path: String,
    pub launch: String,
}

struct EditorSpec {
    id: &'static str,
    label: &'static str,
    bin: &'static str,
    app: Option<&'static str>,
}

const EDITORS: &[EditorSpec] = &[
    EditorSpec {
        id: "vscode",
        label: "Visual Studio Code",
        bin: "code",
        app: Some("Visual Studio Code"),
    },
    EditorSpec {
        id: "vscode-insiders",
        label: "VS Code Insiders",
        bin: "code-insiders",
        app: Some("Visual Studio Code - Insiders"),
    },
    EditorSpec {
        id: "cursor",
        label: "Cursor",
        bin: "cursor",
        app: Some("Cursor"),
    },
    EditorSpec {
        id: "windsurf",
        label: "Windsurf",
        bin: "windsurf",
        app: Some("Windsurf"),
    },
    EditorSpec {
        id: "zed",
        label: "Zed",
        bin: "zed",
        app: Some("Zed"),
    },
    EditorSpec {
        id: "sublime",
        label: "Sublime Text",
        bin: "subl",
        app: Some("Sublime Text"),
    },
    EditorSpec {
        id: "idea",
        label: "IntelliJ IDEA",
        bin: "idea",
        app: Some("IntelliJ IDEA"),
    },
    EditorSpec {
        id: "webstorm",
        label: "WebStorm",
        bin: "webstorm",
        app: Some("WebStorm"),
    },
    EditorSpec {
        id: "pycharm",
        label: "PyCharm",
        bin: "pycharm",
        app: Some("PyCharm"),
    },
    EditorSpec {
        id: "rider",
        label: "Rider",
        bin: "rider",
        app: Some("Rider"),
    },
    EditorSpec {
        id: "fleet",
        label: "Fleet",
        bin: "fleet",
        app: Some("Fleet"),
    },
    EditorSpec {
        id: "nova",
        label: "Nova",
        bin: "nova",
        app: Some("Nova"),
    },
    EditorSpec {
        id: "xcode",
        label: "Xcode",
        bin: "xed",
        app: Some("Xcode"),
    },
    EditorSpec {
        id: "gnome-builder",
        label: "GNOME Builder",
        bin: "gnome-builder",
        app: None,
    },
    EditorSpec {
        id: "kate",
        label: "Kate",
        bin: "kate",
        app: None,
    },
];

const LAUNCH_BINARY: &str = "binary";
const LAUNCH_APP: &str = "app";

pub fn detect() -> Vec<EditorInfo> {
    let path_env = search_path(None);
    let cwd = std::env::current_dir().unwrap_or_else(|_| std::env::temp_dir());
    EDITORS
        .iter()
        .filter_map(|spec| locate(spec, &path_env, &cwd))
        .collect()
}

fn locate(spec: &EditorSpec, path_env: &std::ffi::OsStr, cwd: &Path) -> Option<EditorInfo> {
    if let Ok(path) = which::which_in(spec.bin, Some(path_env), cwd) {
        return Some(info(spec, &path, LAUNCH_BINARY));
    }
    #[cfg(target_os = "macos")]
    if let Some(app) = spec.app {
        for root in app_roots() {
            let bundle = root.join(format!("{app}.app"));
            if bundle.is_dir() {
                return Some(info(spec, &bundle, LAUNCH_APP));
            }
        }
    }
    #[cfg(not(target_os = "macos"))]
    let _ = spec.app;
    None
}

fn info(spec: &EditorSpec, path: &Path, launch: &str) -> EditorInfo {
    EditorInfo {
        id: spec.id.to_string(),
        label: spec.label.to_string(),
        path: path.to_string_lossy().into_owned(),
        launch: launch.to_string(),
    }
}

#[cfg(target_os = "macos")]
fn app_roots() -> Vec<std::path::PathBuf> {
    let mut roots = vec![std::path::PathBuf::from("/Applications")];
    if let Some(home) = crate::ai_cli::home_dir() {
        roots.push(home.join("Applications"));
    }
    roots
}

pub fn open(editor_id: &str, target: &str) -> AppResult<EditorInfo> {
    let editor = detect()
        .into_iter()
        .find(|editor| editor.id == editor_id)
        .ok_or_else(|| {
            AppError::other(format!(
                "{editor_id} is not installed on this machine any more — pick another editor in Settings → Git"
            ))
        })?;
    launch(&editor, Path::new(target))?;
    Ok(editor)
}

fn command_for(editor: &EditorInfo, target: &Path) -> Command {
    if editor.launch == LAUNCH_APP {
        let mut command = proc::hidden("open");
        command.arg("-a").arg(&editor.path).arg(target);
        command
    } else {
        let mut command = proc::hidden(&editor.path);
        command.arg(target);
        command
    }
}

fn launch(editor: &EditorInfo, target: &Path) -> AppResult<()> {
    let mut command = command_for(editor, target);
    command
        .env("PATH", search_path(Path::new(&editor.path).parent()))
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());
    command.spawn()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn editor(path: &str, launch: &str) -> EditorInfo {
        EditorInfo {
            id: "test".into(),
            label: "Test".into(),
            path: path.into(),
            launch: launch.into(),
        }
    }

    #[test]
    fn editor_ids_and_binaries_are_unique() {
        let mut ids: Vec<&str> = EDITORS.iter().map(|spec| spec.id).collect();
        let mut bins: Vec<&str> = EDITORS.iter().map(|spec| spec.bin).collect();
        ids.sort();
        bins.sort();
        ids.dedup();
        bins.dedup();
        assert_eq!(ids.len(), EDITORS.len());
        assert_eq!(bins.len(), EDITORS.len());
    }

    #[test]
    fn binary_editor_receives_the_target_as_its_only_argument() {
        let command = command_for(
            &editor("/usr/local/bin/code", LAUNCH_BINARY),
            Path::new("/repo"),
        );
        assert_eq!(command.get_program(), "/usr/local/bin/code");
        let args: Vec<_> = command.get_args().collect();
        assert_eq!(args, ["/repo"]);
    }

    #[cfg(target_os = "macos")]
    #[test]
    fn app_editor_goes_through_open() {
        let command = command_for(
            &editor("/Applications/Zed.app", LAUNCH_APP),
            Path::new("/repo"),
        );
        assert_eq!(command.get_program(), "open");
        let args: Vec<_> = command.get_args().collect();
        assert_eq!(args, ["-a", "/Applications/Zed.app", "/repo"]);
    }

    #[cfg(unix)]
    #[test]
    fn launch_runs_the_binary_with_the_target() {
        use std::os::unix::fs::PermissionsExt;
        let dir = std::env::temp_dir().join(format!("angkorgit-editor-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let log = dir.join("launched.log");
        let script = dir.join("fake-editor");
        std::fs::write(
            &script,
            format!("#!/bin/sh\necho \"$@\" > '{}'\n", log.display()),
        )
        .unwrap();
        std::fs::set_permissions(&script, std::fs::Permissions::from_mode(0o755)).unwrap();
        launch(
            &editor(script.to_str().unwrap(), LAUNCH_BINARY),
            Path::new("/some/repo"),
        )
        .unwrap();
        let mut waited = 0;
        while !log.exists() && waited < 60 {
            std::thread::sleep(std::time::Duration::from_millis(50));
            waited += 1;
        }
        assert_eq!(std::fs::read_to_string(&log).unwrap().trim(), "/some/repo");
        std::fs::remove_dir_all(&dir).unwrap();
    }
}
