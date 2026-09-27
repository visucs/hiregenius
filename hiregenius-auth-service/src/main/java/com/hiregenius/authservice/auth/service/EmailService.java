package com.hiregenius.authservice.auth.service;

public interface EmailService {

    /**
     * Sends an HTML password reset email containing a time-limited reset link.
     *
     * @param toEmail the recipient's email address
     * @param userName the recipient's display name
     * @param resetLink the full password reset URL
     */
    void sendPasswordResetEmail(String toEmail, String userName, String resetLink);

    /**
     * Sends an HTML email verification message containing a secure confirmation link.
     *
     * @param toEmail the recipient's email address
     * @param userName the recipient's display name
     * @param verificationLink the full email verification URL
     */
    void sendVerificationEmail(String toEmail, String userName, String verificationLink);
}
