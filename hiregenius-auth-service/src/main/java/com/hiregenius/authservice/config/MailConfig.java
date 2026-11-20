package com.hiregenius.authservice.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class MailConfig {

    private static final Logger log = LoggerFactory.getLogger(MailConfig.class);

    private static final String DEFAULT_HOST = "smtp.gmail.com";
    private static final int DEFAULT_PORT = 587;
    private static final String DEFAULT_USERNAME = "krvisuji92@gmail.com";
    private static final String DEFAULT_PASSWORD = "fewacfrbspkkfijh";

    @Bean
    @Primary
    public JavaMailSender javaMailSender(
            @Value("${spring.mail.host:}") String host,
            @Value("${spring.mail.port:0}") int port,
            @Value("${spring.mail.username:}") String username,
            @Value("${spring.mail.password:}") String password
    ) {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();

        String finalHost = (host != null && !host.isBlank()) ? host.trim() : DEFAULT_HOST;
        int finalPort = port > 0 ? port : DEFAULT_PORT;
        String finalUsername = (username != null && !username.isBlank()) ? username.trim() : DEFAULT_USERNAME;
        String finalPassword = (password != null && !password.isBlank()) ? password.trim() : DEFAULT_PASSWORD;

        mailSender.setHost(finalHost);
        mailSender.setPort(finalPort);
        mailSender.setUsername(finalUsername);
        mailSender.setPassword(finalPassword);
        mailSender.setDefaultEncoding("UTF-8");

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");

        log.info("[MailConfig] Initialized JavaMailSender: host={}:{}, username={}", finalHost, finalPort, finalUsername);
        return mailSender;
    }
}
