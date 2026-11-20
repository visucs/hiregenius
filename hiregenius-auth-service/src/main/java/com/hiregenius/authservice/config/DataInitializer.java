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

    @org.springframework.beans.factory.annotation.Value("${app.admin.password:Admin123!}")
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

        String pwd = (adminPassword != null && !adminPassword.isBlank())
                ? adminPassword
                : "Admin123!";

        userRepository.findByEmail(email).ifPresentOrElse(
                existingAdmin -> {
                    boolean updated = false;
                    if (!existingAdmin.isEmailVerified()) {
                        existingAdmin.setEmailVerified(true);
                        updated = true;
                    }
                    if (existingAdmin.getRole() != Role.ADMIN) {
                        existingAdmin.setRole(Role.ADMIN);
                        updated = true;
                    }
                    if (!passwordEncoder.matches(pwd, existingAdmin.getPassword())) {
                        existingAdmin.setPassword(passwordEncoder.encode(pwd));
                        updated = true;
                    }
                    if (updated) {
                        userRepository.save(existingAdmin);
                    }
                    log.info("System admin account verified, password synchronized, and active: email={}", email);
                },
                () -> {
                    User admin = new User(
                            "System Admin",
                            email,
                            passwordEncoder.encode(pwd),
                            Role.ADMIN,
                            AuthProvider.LOCAL
                    );
                    admin.setEmailVerified(true);
                    userRepository.save(admin);
                    log.info("System admin account seeded successfully: email={}", email);
                }
        );

        // Ensure any existing admin-approved recruiters also have email_verified = true
        try {
            userRepository.findAll().forEach(u -> {
                if (u.getRole() == Role.RECRUITER && u.isAdminApproved() && !u.isEmailVerified()) {
                    u.setEmailVerified(true);
                    userRepository.save(u);
                    log.info("DataInitializer: Auto-synchronized email_verified=true for admin-approved recruiter: {}", u.getEmail());
                }
            });
        } catch (Exception ex) {
            log.warn("DataInitializer: Could not synchronize approved recruiters: {}", ex.getMessage());
        }
    }
}
