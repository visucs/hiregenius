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
     * Sends an HTML email verification message containing a 6-digit one-time code (OTP).
     *
     * @param toEmail the recipient's email address
     * @param userName the recipient's display name
     * @param otpCode the 6-digit verification code
     */
    void sendVerificationOtpEmail(String toEmail, String userName, String otpCode);

    /**
     * Sends an HTML notification to a recruiter when their account is approved by an administrator.
     *
     * @param toEmail the recipient's email address
     * @param userName the recruiter's display name
     */
    void sendRecruiterApprovalEmail(String toEmail, String userName);
}
