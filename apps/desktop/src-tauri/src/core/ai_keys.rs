use crate::error::{AppError, AppResult};

const KEYRING_SERVICE: &str = "AngKorGit";

fn entry(provider: &str) -> AppResult<keyring::Entry> {
    let provider = provider.trim().to_lowercase();
    if provider.is_empty() {
        return Err(AppError::other("必须指定提供方"));
    }
    keyring::Entry::new(KEYRING_SERVICE, &format!("ai:{provider}"))
        .map_err(|e| AppError::other(format!("钥匙串不可用：{e}")))
}

pub fn get(provider: &str) -> AppResult<Option<String>> {
    match entry(provider)?.get_password() {
        Ok(key) => Ok(Some(key)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(AppError::other(format!("无法从系统钥匙串读取密钥：{e}"))),
    }
}

pub fn set(provider: &str, key: &str) -> AppResult<()> {
    let key = key.trim();
    if key.is_empty() {
        return delete(provider);
    }
    entry(provider)?
        .set_password(key)
        .map_err(|e| AppError::other(format!("无法将密钥存入钥匙串：{e}")))
}

pub fn delete(provider: &str) -> AppResult<()> {
    match entry(provider)?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(AppError::other(format!("无法从系统钥匙串删除密钥：{e}"))),
    }
}
