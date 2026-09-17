package com.hiregenius.authservice.config;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

/**
 * ApplicationWarmupListener executes once the Spring Boot application context is
 * fully initialized and ready to service traffic (ApplicationReadyEvent).
 *
 * It warms up the database connection pool (HikariCP) and Firebase Admin SDK
 * proactively so that the first real user requests do not suffer cold-start delays.
 */
@Component
public class ApplicationWarmupListener {

    private static final Logger log = LoggerFactory.getLogger(ApplicationWarmupListener.class);

    private final DataSource dataSource;

    public ApplicationWarmupListener(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("Starting application warm-up routine...");

        // 1. Warm up HikariCP Database Connection Pool
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("SELECT 1");
            log.info("Database connection pool warmed up successfully (SELECT 1 executed).");
        } catch (Exception e) {
            log.warn("Database connection pool warm-up skipped or failed: {}", e.getMessage());
        }

        // 2. Warm up Firebase Admin SDK
        try {
            if (!FirebaseApp.getApps().isEmpty()) {
                FirebaseAuth.getInstance();
                log.info("Firebase Admin SDK warmed up successfully for default FirebaseApp.");
            } else {
                log.info("Firebase Admin SDK warm-up skipped: FirebaseApp is not configured in this environment.");
            }
        } catch (Exception e) {
            log.warn("Firebase Admin SDK warm-up skipped or failed: {}", e.getMessage());
        }

        log.info("Application warm-up routine completed.");
    }
}
