package com.hiregenius.authservice.auth.service;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Properties;

import static org.mockito.Mockito.*;

class EmailServiceTest {

    @Test
    @DisplayName("EmailService builds and dispatches HTML password reset email")
    void sendPasswordResetEmailDispatchesMessage() {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        EmailServiceImpl emailService = new EmailServiceImpl(mailSender);
        ReflectionTestUtils.setField(emailService, "mailFrom", "test@hiregenius.ai");

        emailService.sendPasswordResetEmail(
                "candidate@hiregenius.ai",
                "Alex Candidate",
                "https://hiregenius-delta.vercel.app/reset-password?token=test-token"
        );

        verify(mailSender, times(1)).createMimeMessage();
        verify(mailSender, times(1)).send(mimeMessage);
    }
}
