-- ==========================================================
-- V1: Initialize Auth Service users schema
-- ==========================================================

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NULL, -- Nullable: Google OAuth users do not have a local password
    role VARCHAR(50) NOT NULL, -- RECRUITER, CANDIDATE, ADMIN
    auth_provider VARCHAR(50) NOT NULL DEFAULT 'LOCAL', -- LOCAL, GOOGLE
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed system ADMIN user (ADMIN accounts cannot be created via public register or Google endpoints)
-- Password: AdminPassword123! (BCrypt strength 12: $2a$12$NqBvhM.2XzD8V6.rK1wQyOSl6rK9Yy688g786Gg.B471L7uXwZkUe)
INSERT INTO users (name, email, password, role, auth_provider, is_active)
VALUES ('System Admin', 'admin@hiregenius.ai', '$2a$12$NqBvhM.2XzD8V6.rK1wQyOSl6rK9Yy688g786Gg.B471L7uXwZkUe', 'ADMIN', 'LOCAL', TRUE)
ON DUPLICATE KEY UPDATE id=id;
