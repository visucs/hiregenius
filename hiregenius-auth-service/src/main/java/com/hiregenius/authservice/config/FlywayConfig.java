package com.hiregenius.authservice.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(prefix = "spring.flyway", name = "enabled", matchIfMissing = true)
public class FlywayConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            try {
                log.info("[Flyway] Running flyway.repair() to reconcile any migration checksum differences...");
                flyway.repair();
            } catch (Exception ex) {
                log.warn("[Flyway] Notice during repair: {}", ex.getMessage());
            }
            log.info("[Flyway] Running flyway.migrate()...");
            flyway.migrate();
        };
    }
}
