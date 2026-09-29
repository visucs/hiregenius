-- ==========================================================
-- V4: Add email OTP table and admin approval / privilege columns
-- ==========================================================

CREATE TABLE IF NOT EXISTS email_otps (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(50) NOT NULL DEFAULT 'EMAIL_VERIFICATION',
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_email_otps_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_email_otps_user_id (user_id),
    INDEX idx_email_otps_purpose (purpose)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recruiter admin approval & granular role privilege columns
ALTER TABLE users ADD COLUMN admin_approved BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN can_post_jobs BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN can_apply_to_jobs BOOLEAN NOT NULL DEFAULT TRUE;

-- System admins are pre-approved
UPDATE users SET admin_approved = TRUE WHERE role = 'ADMIN';

-- Ensure all accounts have default privileges enabled
UPDATE users SET can_post_jobs = TRUE, can_apply_to_jobs = TRUE;
