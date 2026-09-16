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
}
