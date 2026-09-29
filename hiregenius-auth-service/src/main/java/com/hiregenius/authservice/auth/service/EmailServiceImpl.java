package com.hiregenius.authservice.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:${MAIL_FROM:noreply@hiregenius.ai}}")
    private String mailFrom;

    @Value("${app.frontend.url:https://hiregenius-delta.vercel.app}")
    private String frontendBaseUrl;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async("mailTaskExecutor")
    @Override
    public void sendPasswordResetEmail(String toEmail, String userName, String resetLink) {
        long asyncStartTime = System.currentTimeMillis();
        log.info("[ASYNC-EMAIL] Starting background password reset email dispatch to {} on thread [{}]", toEmail, Thread.currentThread().getName());
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailFrom);
            helper.setTo(toEmail);
            helper.setSubject("Reset Your HireGenius AI Password");

            String htmlContent = buildResetPasswordEmailHtml(userName, resetLink);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            long duration = System.currentTimeMillis() - asyncStartTime;
            log.info("[ASYNC-EMAIL] Password reset email successfully sent to {} in {}ms on thread [{}]", toEmail, duration, Thread.currentThread().getName());
        } catch (MessagingException | RuntimeException e) {
            long duration = System.currentTimeMillis() - asyncStartTime;
            log.error("[ASYNC-EMAIL] Failed to send password reset email to {} after {}ms on thread [{}]: {}", toEmail, duration, Thread.currentThread().getName(), e.getMessage(), e);
        }
    }

    private String buildResetPasswordEmailHtml(String userName, String resetLink) {
        String displayName = (userName != null && !userName.isBlank()) ? userName : "there";
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "  <meta charset=\"UTF-8\">\n" +
                "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "  <title>Reset Your Password</title>\n" +
                "</head>\n" +
                "<body style=\"margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;\">\n" +
                "  <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"table-layout: fixed; background-color: #f3f4f6; padding: 40px 0;\">\n" +
                "    <tr>\n" +
                "      <td align=\"center\">\n" +
                "        <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"max-width: 580px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;\">\n" +
                "          <tr>\n" +
                "            <td style=\"background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 40px; text-align: center;\">\n" +
                "              <h1 style=\"color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;\">HireGenius AI</h1>\n" +
                "              <p style=\"color: #e0e7ff; margin: 6px 0 0 0; font-size: 14px;\">Next-Generation Talent Acquisition Platform</p>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "          <tr>\n" +
                "            <td style=\"padding: 40px 40px 32px 40px;\">\n" +
                "              <h2 style=\"color: #111827; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;\">Password Reset Request</h2>\n" +
                "              <p style=\"color: #4b5563; font-size: 15px; line-height: 24px; margin: 0 0 20px 0;\">\n" +
                "                Hello " + displayName + ",<br><br>\n" +
                "                We received a request to reset the password for your HireGenius AI account. Click the button below to choose a new password:\n" +
                "              </p>\n" +
                "              <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"margin: 28px 0;\">\n" +
                "                <tr>\n" +
                "                  <td align=\"center\">\n" +
                "                    <a href=\"" + resetLink + "\" target=\"_blank\" style=\"display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);\">\n" +
                "                      Reset Password\n" +
                "                    </a>\n" +
                "                  </td>\n" +
                "                </tr>\n" +
                "              </table>\n" +
                "              <div style=\"background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 24px 0;\">\n" +
                "                <p style=\"color: #92400e; font-size: 13px; line-height: 18px; margin: 0;\">\n" +
                "                  <strong>Note:</strong> This password reset link is valid for <strong>30 minutes</strong> and can only be used once.\n" +
                "                </p>\n" +
                "              </div>\n" +
                "              <p style=\"color: #6b7280; font-size: 13px; line-height: 20px; margin: 20px 0 0 0;\">\n" +
                "                If the button above does not work, copy and paste this link into your browser:<br>\n" +
                "                <a href=\"" + resetLink + "\" style=\"color: #4f46e5; word-break: break-all;\">" + resetLink + "</a>\n" +
                "              </p>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "          <tr>\n" +
                "            <td style=\"background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;\">\n" +
                "              <p style=\"color: #6b7280; font-size: 12px; line-height: 18px; margin: 0 0 8px 0;\">\n" +
                "                If you did not request a password reset, you can safely ignore this email — your account remains secure and your password will not be changed.\n" +
                "              </p>\n" +
                "              <p style=\"color: #9ca3af; font-size: 12px; margin: 0;\">\n" +
                "                © 2026 HireGenius AI. All rights reserved.\n" +
                "              </p>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "        </table>\n" +
                "      </td>\n" +
                "    </tr>\n" +
                "  </table>\n" +
                "</body>\n" +
                "</html>";
    }

    @Async("mailTaskExecutor")
    @Override
    public void sendVerificationOtpEmail(String toEmail, String userName, String otpCode) {
        long asyncStartTime = System.currentTimeMillis();
        log.info("[ASYNC-EMAIL] Starting verification OTP email dispatch to {} on thread [{}]", toEmail, Thread.currentThread().getName());
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailFrom);
            helper.setTo(toEmail);
            helper.setSubject("Your HireGenius AI Verification Code: " + otpCode);

            String htmlContent = buildVerificationOtpEmailHtml(userName, otpCode);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            long duration = System.currentTimeMillis() - asyncStartTime;
            log.info("[ASYNC-EMAIL] Verification OTP email successfully sent to {} in {}ms on thread [{}]", toEmail, duration, Thread.currentThread().getName());
        } catch (MessagingException | RuntimeException e) {
            long duration = System.currentTimeMillis() - asyncStartTime;
            log.error("[ASYNC-EMAIL] Failed to send verification OTP email to {} after {}ms on thread [{}]: {}", toEmail, duration, Thread.currentThread().getName(), e.getMessage(), e);
        }
    }

    private String buildVerificationOtpEmailHtml(String userName, String otpCode) {
        String displayName = (userName != null && !userName.isBlank()) ? userName : "there";
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "  <meta charset=\"UTF-8\">\n" +
                "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "  <title>Your Verification Code</title>\n" +
                "</head>\n" +
                "<body style=\"margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;\">\n" +
                "  <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"table-layout: fixed; background-color: #f3f4f6; padding: 40px 0;\">\n" +
                "    <tr>\n" +
                "      <td align=\"center\">\n" +
                "        <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"max-width: 580px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;\">\n" +
                "          <tr>\n" +
                "            <td style=\"background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 36px 40px; text-align: center;\">\n" +
                "              <h1 style=\"color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;\">HireGenius AI</h1>\n" +
                "              <p style=\"color: #e0e7ff; margin: 6px 0 0 0; font-size: 14px;\">Next-Generation Talent Acquisition Platform</p>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "          <tr>\n" +
                "            <td style=\"padding: 40px 40px 32px 40px;\">\n" +
                "              <h2 style=\"color: #111827; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;\">Verify your email address</h2>\n" +
                "              <p style=\"color: #4b5563; font-size: 15px; line-height: 24px; margin: 0 0 24px 0;\">\n" +
                "                Hello " + displayName + ",<br><br>\n" +
                "                Welcome to HireGenius AI! Use the 6-digit one-time code below to verify your email address and activate your account:\n" +
                "              </p>\n" +
                "              <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"margin: 28px 0;\">\n" +
                "                <tr>\n" +
                "                  <td align=\"center\">\n" +
                "                    <div style=\"display: inline-block; background-color: #f0fdf4; border: 2px dashed #22c55e; border-radius: 12px; padding: 18px 36px; text-align: center;\">\n" +
                "                      <span style=\"font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #15803d; display: block; margin-left: 12px;\">" + otpCode + "</span>\n" +
                "                    </div>\n" +
                "                  </td>\n" +
                "                </tr>\n" +
                "              </table>\n" +
                "              <div style=\"background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 4px; margin: 24px 0;\">\n" +
                "                <p style=\"color: #1e40af; font-size: 13px; line-height: 18px; margin: 0;\">\n" +
                "                  <strong>Note:</strong> This verification code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.\n" +
                "                </p>\n" +
                "              </div>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "          <tr>\n" +
                "            <td style=\"background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;\">\n" +
                "              <p style=\"color: #6b7280; font-size: 12px; line-height: 18px; margin: 0 0 8px 0;\">\n" +
                "                If you did not sign up for a HireGenius AI account, you can safely ignore this email.\n" +
                "              </p>\n" +
                "              <p style=\"color: #9ca3af; font-size: 12px; margin: 0;\">\n" +
                "                © 2026 HireGenius AI. All rights reserved.\n" +
                "              </p>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "        </table>\n" +
                "      </td>\n" +
                "    </tr>\n" +
                "  </table>\n" +
                "</body>\n" +
                "</html>";
    }

    @Async("mailTaskExecutor")
    @Override
    public void sendRecruiterApprovalEmail(String toEmail, String userName) {
        long asyncStartTime = System.currentTimeMillis();
        log.info("[ASYNC-EMAIL] Starting recruiter approval email dispatch to {} on thread [{}]", toEmail, Thread.currentThread().getName());
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailFrom);
            helper.setTo(toEmail);
            helper.setSubject("Your HireGenius AI Recruiter Account Has Been Approved!");

            String htmlContent = buildRecruiterApprovalEmailHtml(userName);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            long duration = System.currentTimeMillis() - asyncStartTime;
            log.info("[ASYNC-EMAIL] Recruiter approval email successfully sent to {} in {}ms on thread [{}]", toEmail, duration, Thread.currentThread().getName());
        } catch (MessagingException | RuntimeException e) {
            long duration = System.currentTimeMillis() - asyncStartTime;
            log.error("[ASYNC-EMAIL] Failed to send recruiter approval email to {} after {}ms on thread [{}]: {}", toEmail, duration, Thread.currentThread().getName(), e.getMessage(), e);
        }
    }

    private String buildRecruiterApprovalEmailHtml(String userName) {
        String displayName = (userName != null && !userName.isBlank()) ? userName : "there";
        String dashboardUrl = frontendBaseUrl + "/recruiter/dashboard";
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "  <meta charset=\"UTF-8\">\n" +
                "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "  <title>Account Approved</title>\n" +
                "</head>\n" +
                "<body style=\"margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;\">\n" +
                "  <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"table-layout: fixed; background-color: #f3f4f6; padding: 40px 0;\">\n" +
                "    <tr>\n" +
                "      <td align=\"center\">\n" +
                "        <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"max-width: 580px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;\">\n" +
                "          <tr>\n" +
                "            <td style=\"background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 36px 40px; text-align: center;\">\n" +
                "              <h1 style=\"color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;\">HireGenius AI</h1>\n" +
                "              <p style=\"color: #e0e7ff; margin: 6px 0 0 0; font-size: 14px;\">Next-Generation Talent Acquisition Platform</p>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "          <tr>\n" +
                "            <td style=\"padding: 40px 40px 32px 40px;\">\n" +
                "              <h2 style=\"color: #111827; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;\">Your recruiter account is approved!</h2>\n" +
                "              <p style=\"color: #4b5563; font-size: 15px; line-height: 24px; margin: 0 0 24px 0;\">\n" +
                "                Hello " + displayName + ",<br><br>\n" +
                "                Great news! An administrator has reviewed and approved your recruiter account. You are now authorized to post jobs, review candidates, and conduct interviews on HireGenius AI.\n" +
                "              </p>\n" +
                "              <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"margin: 28px 0;\">\n" +
                "                <tr>\n" +
                "                  <td align=\"center\">\n" +
                "                    <a href=\"" + dashboardUrl + "\" target=\"_blank\" style=\"display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);\">\n" +
                "                      Go to Recruiter Dashboard\n" +
                "                    </a>\n" +
                "                  </td>\n" +
                "                </tr>\n" +
                "              </table>\n" +
                "              <p style=\"color: #6b7280; font-size: 13px; line-height: 20px; margin: 20px 0 0 0;\">\n" +
                "                You can now start publishing your openings immediately.\n" +
                "              </p>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "          <tr>\n" +
                "            <td style=\"background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;\">\n" +
                "              <p style=\"color: #9ca3af; font-size: 12px; margin: 0;\">\n" +
                "                © 2026 HireGenius AI. All rights reserved.\n" +
                "              </p>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "        </table>\n" +
                "      </td>\n" +
                "    </tr>\n" +
                "  </table>\n" +
                "</body>\n" +
                "</html>";
    }
}
