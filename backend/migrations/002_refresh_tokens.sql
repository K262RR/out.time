-- Migration 002: Refresh Tokens table
-- Создание таблицы для хранения refresh токенов

CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP NULL,
    device_info TEXT NULL,
    ip_address INET NULL,
    replaced_by_token_id INTEGER NULL REFERENCES refresh_tokens(id)
);

-- Индексы для оптимизации
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked);

-- Таблица для blacklist access токенов
CREATE TABLE token_blacklist (
    id SERIAL PRIMARY KEY,
    token_jti VARCHAR(255) NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT DEFAULT 'logout'
);

-- Индексы для blacklist
CREATE INDEX idx_token_blacklist_token_jti ON token_blacklist(token_jti);
CREATE INDEX idx_token_blacklist_expires_at ON token_blacklist(expires_at); 