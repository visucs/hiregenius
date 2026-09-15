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

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail("admin@hiregenius.ai")) {
            User admin = new User(
                    "System Admin",
                    "admin@hiregenius.ai",
                    passwordEncoder.encode("AdminPassword123!"),
                    Role.ADMIN,
                    AuthProvider.LOCAL
            );
            userRepository.save(admin);
            log.info("Default system admin user seeded: email=admin@hiregenius.ai");
        }
    }
}
