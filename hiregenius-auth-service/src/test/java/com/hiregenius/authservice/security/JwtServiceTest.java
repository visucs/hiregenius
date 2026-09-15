package com.hiregenius.authservice.security;

import com.hiregenius.authservice.auth.entity.Role;
import com.hiregenius.authservice.auth.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private final String testSecret = "my_super_secure_test_signing_key_that_is_at_least_256_bits_long!";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(testSecret, 3600000); // 1 hour expiration
    }

    @Test
    @DisplayName("Should generate token and extract valid claims")
    void shouldGenerateTokenAndExtractClaims() {
        User user = new User();
        user.setId(101L);
        user.setEmail("recruiter@hiregenius.ai");
        user.setName("Sarah Recruiter");
        user.setRole(Role.RECRUITER);

        String token = jwtService.generateToken(user);
        assertNotNull(token);
        assertFalse(token.isBlank());

        assertEquals("recruiter@hiregenius.ai", jwtService.extractEmail(token));
        assertEquals(101L, jwtService.extractUserId(token));
        assertEquals("RECRUITER", jwtService.extractRole(token));
        assertTrue(jwtService.validateToken(token));
    }

    @Test
    @DisplayName("Should reject tampered token")
    void shouldRejectTamperedToken() {
        String token = jwtService.generateToken(1L, "user@hiregenius.ai", Role.CANDIDATE);
        String tamperedToken = token.substring(0, token.length() - 5) + "abcde";

        assertFalse(jwtService.validateToken(tamperedToken));
    }

    @Test
    @DisplayName("Should reject expired token")
    void shouldRejectExpiredToken() {
        JwtService expiredJwtService = new JwtService(testSecret, -1000); // expired 1s ago
        String expiredToken = expiredJwtService.generateToken(1L, "expired@hiregenius.ai", Role.CANDIDATE);

        assertFalse(jwtService.validateToken(expiredToken));
    }
}
