package com.hiregenius.authservice.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "HireGenius AI — Auth Service API",
                version = "1.0.0",
                description = "Authentication, JWT issuance, Google OAuth integration, and user identity management service for HireGenius AI",
                contact = @Contact(name = "HireGenius Engineering", email = "engineering@hiregenius.ai")
        )
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Enter JWT Bearer token issued by this Auth Service"
)
public class OpenApiConfig {
}
