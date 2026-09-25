package com.hiregenius.authservice.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hiregenius.authservice.auth.dto.request.ForgotPasswordRequest;
import com.hiregenius.authservice.auth.dto.request.GoogleLoginRequest;
import com.hiregenius.authservice.auth.dto.request.LoginRequest;
import com.hiregenius.authservice.auth.dto.request.RegisterRequest;
import com.hiregenius.authservice.auth.dto.request.ResetPasswordRequest;
import com.hiregenius.authservice.auth.entity.AuthProvider;
import com.hiregenius.authservice.auth.entity.PasswordResetToken;
import com.hiregenius.authservice.auth.entity.Role;
import com.hiregenius.authservice.auth.entity.User;
import com.hiregenius.authservice.auth.repository.PasswordResetTokenRepository;
import com.hiregenius.authservice.auth.repository.UserRepository;
import com.hiregenius.authservice.auth.service.DnsValidationService;
import com.hiregenius.authservice.auth.service.EmailService;
import com.hiregenius.authservice.auth.service.GoogleAuthService;
import com.hiregenius.authservice.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private GoogleAuthService googleAuthService;

    @MockBean
    private DnsValidationService dnsValidationService;

    @MockBean
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        passwordResetTokenRepository.deleteAll();
        userRepository.deleteAll();
        // Default to true for unit tests unless specifically mocked to test DNS failure
        when(dnsValidationService.hasValidMxRecord(anyString())).thenReturn(true);
    }

    @Test
    @DisplayName("1. Register RECRUITER locally succeeds (201)")
    void registerRecruiterSuccess() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Sarah Recruiter",
                "sarah@hiregenius.ai",
                "Password123!",
                "RECRUITER"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("RECRUITER"))
                .andExpect(jsonPath("$.user.email").value("sarah@hiregenius.ai"));

        User saved = userRepository.findByEmail("sarah@hiregenius.ai").orElseThrow();
        assertEquals(Role.RECRUITER, saved.getRole());
        assertEquals(AuthProvider.LOCAL, saved.getAuthProvider());
        assertNotNull(saved.getPassword());
        assertTrue(passwordEncoder.matches("Password123!", saved.getPassword()));
    }

    @Test
    @DisplayName("2. Register CANDIDATE locally succeeds (201)")
    void registerCandidateSuccess() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Alex Candidate",
                "alex@hiregenius.ai",
                "Candidate123!",
                "CANDIDATE"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("CANDIDATE"))
                .andExpect(jsonPath("$.user.email").value("alex@hiregenius.ai"));

        User saved = userRepository.findByEmail("alex@hiregenius.ai").orElseThrow();
        assertEquals(Role.CANDIDATE, saved.getRole());
        assertEquals(AuthProvider.LOCAL, saved.getAuthProvider());
        assertTrue(passwordEncoder.matches("Candidate123!", saved.getPassword()));
    }

    @Test
    @DisplayName("3. Attempting to register ADMIN role publicly rejected (400)")
    void registerAdminRejected() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Hacker",
                "hacker@hiregenius.ai",
                "Password123!",
                "ADMIN"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("ADMIN role cannot be self-assigned")));

        assertFalse(userRepository.findByEmail("hacker@hiregenius.ai").isPresent());
    }

    @Test
    @DisplayName("4. Duplicate email registration rejected (409)")
    void registerDuplicateEmailRejected() throws Exception {
        RegisterRequest first = new RegisterRequest("Duplicate User", "duplicate@hiregenius.ai", "Password123!", "CANDIDATE");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isCreated());

        RegisterRequest duplicate = new RegisterRequest("Duplicate User 2", "duplicate@hiregenius.ai", "OtherPass123!", "RECRUITER");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicate)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("already exists")));

        assertEquals(1, userRepository.count());
    }

    @Test
    @DisplayName("5. Local login success / failure paths")
    void localLoginSuccessAndFailure() throws Exception {
        // Register local user
        User user = new User("John Doe", "john@hiregenius.ai", passwordEncoder.encode("Secret123!"), Role.RECRUITER, AuthProvider.LOCAL);
        userRepository.save(user);

        // Valid login
        LoginRequest validLogin = new LoginRequest("john@hiregenius.ai", "Secret123!");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("RECRUITER"));

        // Invalid password
        LoginRequest invalidLogin = new LoginRequest("john@hiregenius.ai", "WrongPassword123!");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidLogin)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", containsString("Invalid email or password")));
    }

    @Test
    @DisplayName("6. Attempting local password login on a GOOGLE-provider account rejected (400)")
    void localLoginOnGoogleAccountRejected() throws Exception {
        // Create user with auth_provider = GOOGLE and NULL password
        User googleUser = new User("Google Only", "googleuser@hiregenius.ai", null, Role.CANDIDATE, AuthProvider.GOOGLE);
        userRepository.save(googleUser);

        LoginRequest loginAttempt = new LoginRequest("googleuser@hiregenius.ai", "AnyPassword123!");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginAttempt)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("This account uses Google Sign-In — please use the Google button")));
    }

    @Test
    @DisplayName("7. Google login brand-new user with role=CANDIDATE creates new user with password=null (200)")
    void googleLoginNewUserSuccess() throws Exception {
        when(googleAuthService.verifyIdToken("valid-firebase-id-token"))
                .thenReturn(new GoogleAuthService.FirebaseUserInfo("firebase-uid-1", "newgoogle@hiregenius.ai", "New Google User"));

        GoogleLoginRequest request = new GoogleLoginRequest("valid-firebase-id-token", "CANDIDATE");

        mockMvc.perform(post("/api/auth/google-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("CANDIDATE"));

        User created = userRepository.findByEmail("newgoogle@hiregenius.ai").orElseThrow();
        assertEquals(Role.CANDIDATE, created.getRole());
        assertEquals(AuthProvider.GOOGLE, created.getAuthProvider());
        assertNull(created.getPassword(), "Google-only users must have NULL password in DB");
    }

    @Test
    @DisplayName("8. Google login existing user logs in correctly without duplicate row")
    void googleLoginExistingUserSuccess() throws Exception {
        User existing = new User("Existing Google", "existing@hiregenius.ai", null, Role.RECRUITER, AuthProvider.GOOGLE);
        userRepository.save(existing);

        when(googleAuthService.verifyIdToken("existing-firebase-token"))
                .thenReturn(new GoogleAuthService.FirebaseUserInfo("uid-2", "existing@hiregenius.ai", "Existing Google"));

        GoogleLoginRequest request = new GoogleLoginRequest("existing-firebase-token");

        mockMvc.perform(post("/api/auth/google-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("RECRUITER"));

        assertEquals(1, userRepository.count());
    }

    @Test
    @DisplayName("9. Google login attempting role=ADMIN on first signup rejected (400)")
    void googleLoginAdminRoleRejected() throws Exception {
        when(googleAuthService.verifyIdToken("admin-firebase-token"))
                .thenReturn(new GoogleAuthService.FirebaseUserInfo("uid-3", "adminattempt@hiregenius.ai", "Admin Attempter"));

        GoogleLoginRequest request = new GoogleLoginRequest("admin-firebase-token", "ADMIN");

        mockMvc.perform(post("/api/auth/google-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("ADMIN role cannot be self-assigned")));
    }

    @Test
    @DisplayName("10. GET /api/auth/validate: unauthenticated -> 401, authenticated -> 200 + role")
    void validateTokenEndpoint() throws Exception {
        User user = new User("Val User", "val@hiregenius.ai", passwordEncoder.encode("Pass1234!"), Role.RECRUITER, AuthProvider.LOCAL);
        userRepository.save(user);

        String token = jwtService.generateToken(user);

        // No token -> 401
        mockMvc.perform(get("/api/auth/validate"))
                .andExpect(status().isUnauthorized());

        // Valid token -> 200
        mockMvc.perform(get("/api/auth/validate")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("val@hiregenius.ai"))
                .andExpect(jsonPath("$.role").value("RECRUITER"));

        // Tampered token -> 401
        mockMvc.perform(get("/api/auth/validate")
                        .header("Authorization", "Bearer " + token + "bad"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("11. Forgot password returns uniform generic message")
    void forgotPasswordUniformResponse() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest("anyemail@hiregenius.ai");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message", containsString("password reset instructions have been sent")));
    }

    // =========================================================================
    // PART 1 TESTS: Email Format & MX Record Validation
    // =========================================================================

    @Test
    @DisplayName("12. Registration rejected when email format is malformed (400)")
    void registerMalformedEmailRejected() throws Exception {
        RegisterRequest badFormat = new RegisterRequest(
                "Bad Email",
                "plainaddress-no-at-sign",
                "Password123!",
                "CANDIDATE"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badFormat)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("valid email address")));

        RegisterRequest missingTld = new RegisterRequest(
                "Bad TLD",
                "user@domain",
                "Password123!",
                "CANDIDATE"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(missingTld)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("13. Registration rejected when email domain has no valid MX records (400)")
    void registerInvalidMxDomainRejected() throws Exception {
        when(dnsValidationService.hasValidMxRecord("test@nonexistent-fake-domain.xyz")).thenReturn(false);

        RegisterRequest request = new RegisterRequest(
                "Fake Domain User",
                "test@nonexistent-fake-domain.xyz",
                "Password123!",
                "CANDIDATE"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("This email domain does not appear to be valid.")));

        assertFalse(userRepository.findByEmail("test@nonexistent-fake-domain.xyz").isPresent());
    }

    // =========================================================================
    // PART 2 TESTS: Real Password Reset via Email
    // =========================================================================

    @Test
    @DisplayName("14. Forgot password generates token and dispatches reset email")
    void forgotPasswordGeneratesTokenAndSendsEmail() throws Exception {
        User user = new User("Reset User", "resetuser@hiregenius.ai", passwordEncoder.encode("OldPassword123!"), Role.CANDIDATE, AuthProvider.LOCAL);
        userRepository.save(user);

        ForgotPasswordRequest request = new ForgotPasswordRequest("resetuser@hiregenius.ai");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Verify token saved in repository
        assertEquals(1, passwordResetTokenRepository.count());
        PasswordResetToken token = passwordResetTokenRepository.findAll().get(0);
        assertEquals(user.getId(), token.getUser().getId());
        assertFalse(token.isUsed());
        assertTrue(token.getExpiresAt().isAfter(LocalDateTime.now()));

        // Verify EmailService was called
        verify(emailService, times(1)).sendPasswordResetEmail(
                eq("resetuser@hiregenius.ai"),
                eq("Reset User"),
                org.mockito.ArgumentMatchers.contains("/reset-password?token=" + token.getToken())
        );
    }

    @Test
    @DisplayName("15. Password reset succeeds with valid token (200)")
    void resetPasswordSuccess() throws Exception {
        User user = new User("Alice Reset", "alice@hiregenius.ai", passwordEncoder.encode("OldPass123!"), Role.RECRUITER, AuthProvider.LOCAL);
        userRepository.save(user);

        PasswordResetToken token = new PasswordResetToken(user, "valid-token-123", LocalDateTime.now().plusMinutes(30));
        passwordResetTokenRepository.save(token);

        ResetPasswordRequest request = new ResetPasswordRequest("valid-token-123", "BrandNewPass123!");

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message", containsString("Password has been reset successfully")));

        // Verify token is now marked used
        PasswordResetToken updatedToken = passwordResetTokenRepository.findByToken("valid-token-123").orElseThrow();
        assertTrue(updatedToken.isUsed());

        // Verify user can log in with new password
        User updatedUser = userRepository.findByEmail("alice@hiregenius.ai").orElseThrow();
        assertTrue(passwordEncoder.matches("BrandNewPass123!", updatedUser.getPassword()));
    }

    @Test
    @DisplayName("16. Password reset fails when token is expired (400)")
    void resetPasswordExpiredTokenRejected() throws Exception {
        User user = new User("Expired User", "expired@hiregenius.ai", passwordEncoder.encode("OldPass123!"), Role.CANDIDATE, AuthProvider.LOCAL);
        userRepository.save(user);

        // Token expired 10 minutes ago
        PasswordResetToken expiredToken = new PasswordResetToken(user, "expired-token-123", LocalDateTime.now().minusMinutes(10));
        passwordResetTokenRepository.save(expiredToken);

        ResetPasswordRequest request = new ResetPasswordRequest("expired-token-123", "NewPassword123!");

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Invalid or expired password reset token")));
    }

    @Test
    @DisplayName("17. Password reset fails when token was already used (400)")
    void resetPasswordAlreadyUsedTokenRejected() throws Exception {
        User user = new User("Used Token User", "used@hiregenius.ai", passwordEncoder.encode("OldPass123!"), Role.CANDIDATE, AuthProvider.LOCAL);
        userRepository.save(user);

        PasswordResetToken usedToken = new PasswordResetToken(user, "used-token-123", LocalDateTime.now().plusMinutes(20));
        usedToken.setUsed(true);
        passwordResetTokenRepository.save(usedToken);

        ResetPasswordRequest request = new ResetPasswordRequest("used-token-123", "NewPassword123!");

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Invalid or expired password reset token")));
    }

    @Test
    @DisplayName("18. Password reset fails with non-existent token (400)")
    void resetPasswordInvalidTokenRejected() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest("does-not-exist", "NewPassword123!");

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Invalid or expired password reset token")));
    }

    @Test
    @DisplayName("19. Password reset rejected for Google-only account (400)")
    void resetPasswordGoogleOnlyAccountRejected() throws Exception {
        User googleUser = new User("Google Only User", "googleonly@hiregenius.ai", null, Role.CANDIDATE, AuthProvider.GOOGLE);
        userRepository.save(googleUser);

        PasswordResetToken token = new PasswordResetToken(googleUser, "google-reset-token", LocalDateTime.now().plusMinutes(30));
        passwordResetTokenRepository.save(token);

        ResetPasswordRequest request = new ResetPasswordRequest("google-reset-token", "NewPassword123!");

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("This account uses Google Sign-In and has no password to reset")));
    }

    @Test
    @DisplayName("20. POST /auth/google-login without /api prefix succeeds (200)")
    void googleLoginWithoutApiPrefixSucceeds() throws Exception {
        when(googleAuthService.verifyIdToken("valid-google-token"))
                .thenReturn(new GoogleAuthService.FirebaseUserInfo("uid-no-prefix", "noprefix@hiregenius.ai", "No Prefix Google"));

        GoogleLoginRequest request = new GoogleLoginRequest("valid-google-token", "CANDIDATE");

        mockMvc.perform(post("/auth/google-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("CANDIDATE"))
                .andExpect(jsonPath("$.user.email").value("noprefix@hiregenius.ai"));
    }

    @Test
    @DisplayName("21. POST /auth/signup without /api prefix succeeds (201)")
    void signupWithoutApiPrefixSucceeds() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Signup User",
                "signupuser@hiregenius.ai",
                "Password123!",
                "CANDIDATE"
        );

        mockMvc.perform(post("/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("CANDIDATE"))
                .andExpect(jsonPath("$.user.email").value("signupuser@hiregenius.ai"));
    }

    @Test
    @DisplayName("22. GET /auth/validate without token still returns 401 Unauthorized")
    void validateWithoutApiPrefixStillRequiresAuth() throws Exception {
        mockMvc.perform(get("/auth/validate"))
                .andExpect(status().isUnauthorized());
    }
}
