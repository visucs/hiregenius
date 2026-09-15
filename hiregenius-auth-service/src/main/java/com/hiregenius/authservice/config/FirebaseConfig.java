package com.hiregenius.authservice.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Configuration
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${app.firebase.credentials-path:}")
    private String credentialsPath;

    @Value("${app.firebase.credentials-json:}")
    private String credentialsJson;

    @PostConstruct
    public void initializeFirebase() {
        if (!FirebaseApp.getApps().isEmpty()) {
            log.info("FirebaseApp already initialized.");
            return;
        }

        try {
            InputStream serviceAccountStream = null;

            if (credentialsJson != null && !credentialsJson.trim().isEmpty()) {
                log.info("Initializing Firebase from credentials JSON string.");
                serviceAccountStream = new ByteArrayInputStream(credentialsJson.trim().getBytes(StandardCharsets.UTF_8));
            } else if (credentialsPath != null && !credentialsPath.trim().isEmpty()) {
                log.info("Initializing Firebase from credentials file at: {}", credentialsPath);
                serviceAccountStream = new FileInputStream(credentialsPath.trim());
            }

            if (serviceAccountStream != null) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccountStream))
                        .build();
                FirebaseApp.initializeApp(options);
                log.info("FirebaseApp initialized successfully with provided service account credentials.");
            } else {
                log.warn("No Firebase credentials provided (app.firebase.credentials-path or app.firebase.credentials-json). " +
                        "Firebase Admin token verification will require credentials in production, or GoogleAuthService mock in tests.");
            }
        } catch (Exception e) {
            log.error("Failed to initialize FirebaseApp: {}", e.getMessage());
        }
    }
}
