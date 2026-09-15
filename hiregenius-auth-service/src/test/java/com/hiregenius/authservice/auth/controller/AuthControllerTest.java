package com.hiregenius.authservice.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hiregenius.authservice.auth.dto.request.ForgotPasswordRequest;
import com.hiregenius.authservice.auth.dto.request.GoogleLoginRequest;
import com.hiregenius.authservice.auth.dto.request.LoginRequest;
import com.hiregenius.authservice.auth.dto.request.RegisterRequest;
import com.hiregenius.authservice.auth.entity.AuthProvider;
import com.hiregenius.authservice.auth.entity.Role;
import com.hiregenius.authservice.auth.entity.User;
import com.hiregenius.authservice.auth.repository.UserRepository;
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
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
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
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private GoogleAuthService googleAuthService;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
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
                .andExpect(jsonPath("$.user.name").value("Alex Candidate"));
    }

    @Test
    @DisplayName("3. Register with role=ADMIN rejected (400)")
    void registerAdminRejected() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Malicious User",
                "hacker@hiregenius.ai",
                "Password123!",
                "ADMIN"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("ADMIN role cannot be self-assigned")));
    }

    @Test
    @DisplayName("4. Duplicate email registration rejected (409)")
    void duplicateEmailRejected() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "First User",
                "duplicate@hiregenius.ai",
                "Password123!",
                "CANDIDATE"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("already exists")));
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
}
