use crate::config::AuthConfig;
use argon2::{
    password_hash::{PasswordHasher, PasswordVerifier, SaltString},
    Algorithm, Argon2, Params, Version,
};
use rand::{rngs::OsRng, RngCore};
use stash_types::{StashError, StashResult, TokenId};
use zeroize::Zeroize;

/// A newly minted bearer token: `sk_live_<TokenId>_<secret-b32>`.
///
/// Holds the plaintext; return from `mint` _once_ and drop. Never stored.
#[allow(dead_code)]
pub struct Token {
    pub id: TokenId,
    pub secret: Secret,
    bearer: String,
}

impl Drop for Token {
    fn drop(&mut self) {
        self.bearer.zeroize();
    }
}

impl std::fmt::Debug for Token {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Token")
            .field("id", &self.id)
            .field("secret", &self.secret)
            .field("bearer", &"[REDACTED]")
            .finish()
    }
}

#[allow(dead_code)]
impl Token {
    pub fn generate() -> (TokenId, Self) {
        // 8 random bytes → 16-char lowercase hex id body.
        let mut id_bytes = [0u8; 8];
        OsRng.fill_bytes(&mut id_bytes);
        let id_body = hex_lower(&id_bytes);
        let id =
            TokenId::parse(format!("tk_{id_body}")).expect("id format is valid by construction");

        // 32 random bytes → RFC4648 lowercase base32 without padding.
        let mut sec_bytes = [0u8; 32];
        OsRng.fill_bytes(&mut sec_bytes);
        let secret = Secret::from_bytes(&sec_bytes);
        sec_bytes.zeroize();

        let bearer = format!("sk_live_{id}_{}", secret.expose());
        (id.clone(), Self { id, secret, bearer })
    }

    pub fn parse(bearer: &str) -> StashResult<Self> {
        let rest = bearer
            .strip_prefix("sk_live_")
            .ok_or(StashError::Unauthorized)?;
        // rest = "tk_<16hex>_<secret>"
        // The id is "tk_" + 16 chars = 19 chars total, then underscore at byte 19
        let id_end = "tk_".len() + 16; // = 19
        if rest.len() < id_end + 2 || rest.as_bytes()[id_end] != b'_' {
            return Err(StashError::Unauthorized);
        }
        let id_raw = &rest[..id_end];
        let secret_raw = &rest[id_end + 1..];
        let id = TokenId::parse(id_raw).map_err(|_| StashError::Unauthorized)?;
        let secret = Secret::from_str(secret_raw).map_err(|_| StashError::Unauthorized)?;
        Ok(Self {
            id,
            secret,
            bearer: bearer.to_string(),
        })
    }

    pub fn expose(&self) -> &str {
        &self.bearer
    }

    pub fn secret_part(&self) -> &str {
        self.secret.expose()
    }
}

/// Opaque secret payload — the part of a bearer that goes through argon2.
#[allow(dead_code)]
#[derive(Clone)]
pub struct Secret(String);

impl std::fmt::Debug for Secret {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_tuple("Secret").field(&"<redacted>").finish()
    }
}

#[allow(dead_code)]
impl Secret {
    pub fn from_bytes(bytes: &[u8]) -> Self {
        let s = base32::encode(base32::Alphabet::Rfc4648Lower { padding: false }, bytes);
        Self(s)
    }

    pub fn from_str(s: &str) -> StashResult<Self> {
        if s.is_empty() || s.len() > 512 || !s.is_ascii() {
            return Err(StashError::Unauthorized);
        }
        Ok(Self(s.to_string()))
    }

    pub fn expose(&self) -> &str {
        &self.0
    }
}

impl Drop for Secret {
    fn drop(&mut self) {
        self.0.zeroize();
    }
}

/// Produce an argon2id PHC-encoded hash with the configured cost parameters.
#[allow(dead_code)]
pub fn hash_secret(secret: &Secret, cfg: &AuthConfig) -> StashResult<String> {
    let salt = SaltString::generate(&mut OsRng);
    let params = Params::new(
        cfg.argon2_m_cost_kib,
        cfg.argon2_t_cost,
        cfg.argon2_p_cost,
        None,
    )
    .map_err(|e| StashError::Internal {
        trace_id: format!("argon2-params:{e}"),
    })?;
    let argon = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    let hash = argon
        .hash_password(secret.expose().as_bytes(), &salt)
        .map_err(|e| StashError::Internal {
            trace_id: format!("argon2-hash:{e}"),
        })?;
    Ok(hash.to_string())
}

/// Verify `secret` against a PHC string produced by `hash_secret`.
#[allow(dead_code)]
pub fn verify_secret(secret: &Secret, phc: &str) -> StashResult<bool> {
    use argon2::password_hash::PasswordHash;
    let parsed = PasswordHash::new(phc).map_err(|e| StashError::Internal {
        trace_id: format!("argon2-parse:{e}"),
    })?;
    Ok(Argon2::default()
        .verify_password(secret.expose().as_bytes(), &parsed)
        .is_ok())
}

#[allow(dead_code)]
fn hex_lower(bytes: &[u8]) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut out = String::with_capacity(bytes.len() * 2);
    for &b in bytes {
        out.push(HEX[(b >> 4) as usize] as char);
        out.push(HEX[(b & 0xf) as usize] as char);
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::AuthConfig;

    #[test]
    fn generate_produces_parseable_bearer() {
        let (id, token) = Token::generate();
        let parsed = Token::parse(token.expose()).unwrap();
        assert_eq!(parsed.id, id);
        assert_eq!(parsed.secret.expose(), token.secret_part());
    }

    #[test]
    fn bearer_has_sk_live_prefix() {
        let (_, token) = Token::generate();
        assert!(token.expose().starts_with("sk_live_tk_"));
    }

    #[test]
    fn parse_rejects_missing_prefix() {
        assert!(Token::parse("tk_abc_whatever").is_err());
    }

    #[test]
    fn parse_rejects_missing_separator() {
        assert!(Token::parse("sk_live_tk_0123456789abcdef").is_err());
    }

    #[test]
    fn hash_and_verify_round_trip() {
        let cfg = AuthConfig {
            argon2_m_cost_kib: 8,
            argon2_t_cost: 1,
            argon2_p_cost: 1,
            ..AuthConfig::default()
        };
        let secret = Secret::from_str("supersecret-payload-0123456789").unwrap();
        let phc = hash_secret(&secret, &cfg).unwrap();
        assert!(verify_secret(&secret, &phc).unwrap());
    }

    #[test]
    fn verify_rejects_wrong_secret() {
        let cfg = AuthConfig {
            argon2_m_cost_kib: 8,
            argon2_t_cost: 1,
            argon2_p_cost: 1,
            ..AuthConfig::default()
        };
        let right = Secret::from_str("secret-alpha").unwrap();
        let wrong = Secret::from_str("secret-beta").unwrap();
        let phc = hash_secret(&right, &cfg).unwrap();
        assert!(!verify_secret(&wrong, &phc).unwrap());
    }

    #[test]
    fn two_generates_produce_distinct_tokens() {
        let (a, _) = Token::generate();
        let (b, _) = Token::generate();
        assert_ne!(a, b);
    }
}
