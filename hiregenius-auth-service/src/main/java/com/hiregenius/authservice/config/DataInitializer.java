package com.hiregenius.authservice.config;

import com.hiregenius.authservice.auth.entity.AuthProvider;
import com.hiregenius.authservice.auth.entity.Role;
import com.hiregenius.authservice.auth.entity.User;
import com.hiregenius.authservice.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Value("${app.admin.email:admin@hiregenius.ai}")
    private String adminEmail;

    @org.springframework.beans.factory.annotation.Value("${app.admin.password:}")
    private String adminPassword;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        String email = (adminEmail != null && !adminEmail.isBlank())
                ? adminEmail.trim().toLowerCase()
                : "admin@hiregenius.ai";

        if (adminPassword == null || adminPassword.isBlank()) {
            if (!userRepository.existsByEmail(email)) {
                log.warn("ADMIN_PASSWORD not set in environment. Skipping initial system admin seeding for [{}]", email);
            }
            return;
        }

        userRepository.findByEmail(email).ifPresentOrElse(
                existingAdmin -> {
                    // Sync password and verified status if explicitly provided in environment
                    existingAdmin.setPassword(passwordEncoder.encode(adminPassword));
                    existingAdmin.setEmailVerified(true);
                    existingAdmin.setRole(Role.ADMIN);
                    userRepository.save(existingAdmin);
                    log.info("System admin account synchronized with environment configuration: email={}", email);
                },
                () -> {
                    User admin = new User(
                            "System Admin",
                            email,
                            passwordEncoder.encode(adminPassword),
                            Role.ADMIN,
                            AuthProvider.LOCAL
                    );
                    admin.setEmailVerified(true);
                    userRepository.save(admin);
                    log.info("System admin account seeded successfully from environment variables: email={}", email);
                }
        );
    }
}
