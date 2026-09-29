package com.hiregenius.authservice.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hiregenius.authservice.auth.dto.request.LoginRequest;
import com.hiregenius.authservice.auth.dto.request.UpdateUserStatusRequest;
import com.hiregenius.authservice.auth.entity.AuthProvider;
import com.hiregenius.authservice.auth.entity.Role;
import com.hiregenius.authservice.auth.entity.User;
import com.hiregenius.authservice.auth.repository.EmailVerificationTokenRepository;
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

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:admin_testdb;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminUserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

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

    private User adminUser;
    private User otherAdminUser;
    private User recruiterUser;
    private User candidateUser;
    private String adminToken;
    private String recruiterToken;

    @BeforeEach
    void setUp() {
        emailVerificationTokenRepository.deleteAll();
        passwordResetTokenRepository.deleteAll();
        userRepository.deleteAll();

        adminUser = new User("Admin Primary", "admin@hiregenius.ai", passwordEncoder.encode("AdminPass123!"), Role.ADMIN, AuthProvider.LOCAL);
        otherAdminUser = new User("Admin Secondary", "admin2@hiregenius.ai", passwordEncoder.encode("AdminPass123!"), Role.ADMIN, AuthProvider.LOCAL);
        recruiterUser = new User("Recruiter Alice", "alice@hiregenius.ai", passwordEncoder.encode("RecruiterPass123!"), Role.RECRUITER, AuthProvider.LOCAL);
        candidateUser = new User("Candidate Bob", "bob@hiregenius.ai", passwordEncoder.encode("CandidatePass123!"), Role.CANDIDATE, AuthProvider.LOCAL);

        adminUser = userRepository.save(adminUser);
        otherAdminUser = userRepository.save(otherAdminUser);
        recruiterUser = userRepository.save(recruiterUser);
        candidateUser = userRepository.save(candidateUser);

        adminToken = jwtService.generateToken(adminUser);
        recruiterToken = jwtService.generateToken(recruiterUser);
    }

    @Test
    @DisplayName("1. GET /api/admin/users rejects unauthenticated requests (401)")
    void getUsersUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("2. GET /api/admin/users rejects non-admin users (403)")
    void getUsersForbiddenForRecruiter() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + recruiterToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("3. GET /api/admin/users succeeds for ADMIN and returns user page")
    void getUsersSuccessForAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(4)))
                .andExpect(jsonPath("$.data.totalElements").value(4));
    }

    @Test
    @DisplayName("4. GET /api/admin/users filters by role and search")
    void getUsersWithFilters() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("role", "RECRUITER")
                        .param("search", "alice"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].email").value("alice@hiregenius.ai"));
    }

    @Test
    @DisplayName("5. PATCH /api/admin/users/{id}/status toggles recruiter active status")
    void toggleUserStatusSuccess() throws Exception {
        UpdateUserStatusRequest request = new UpdateUserStatusRequest(false);

        mockMvc.perform(patch("/api/admin/users/" + recruiterUser.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.active").value(false));

        User updated = userRepository.findById(recruiterUser.getId()).orElseThrow();
        assertFalse(updated.isActive());
    }

    @Test
    @DisplayName("6. Admin cannot disable their own account (400)")
    void adminCannotDisableSelf() throws Exception {
        UpdateUserStatusRequest request = new UpdateUserStatusRequest(false);

        mockMvc.perform(patch("/api/admin/users/" + adminUser.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("cannot change the active status of their own account")));
    }

    @Test
    @DisplayName("7. Admin cannot disable another admin account (400)")
    void adminCannotDisableAnotherAdmin() throws Exception {
        UpdateUserStatusRequest request = new UpdateUserStatusRequest(false);

        mockMvc.perform(patch("/api/admin/users/" + otherAdminUser.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Cannot modify the active status of another administrator account")));
    }

    @Test
    @DisplayName("8. Deactivated user cannot log in (403)")
    void deactivatedUserCannotLogin() throws Exception {
        // Disable recruiter
        recruiterUser.setActive(false);
        userRepository.save(recruiterUser);

        LoginRequest loginRequest = new LoginRequest("alice@hiregenius.ai", "RecruiterPass123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("deactivated")));
    }

    @Test
    @DisplayName("9. GET /api/admin/users?pendingApproval=true returns email-verified unapproved recruiters")
    void getPendingApprovalUsers() throws Exception {
        // Recruiter Alice: verified email, not approved
        recruiterUser.setEmailVerified(true);
        recruiterUser.setAdminApproved(false);
        userRepository.save(recruiterUser);

        // Candidate Bob: verified email (should NOT appear in pending recruiter approvals)
        candidateUser.setEmailVerified(true);
        userRepository.save(candidateUser);

        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("pendingApproval", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].email").value("alice@hiregenius.ai"))
                .andExpect(jsonPath("$.data.content[0].adminApproved").value(false));
    }

    @Test
    @DisplayName("10. PATCH /api/admin/users/{id}/approve approves recruiter and dispatches notification email")
    void approveRecruiterSuccess() throws Exception {
        recruiterUser.setEmailVerified(true);
        recruiterUser.setAdminApproved(false);
        userRepository.save(recruiterUser);

        mockMvc.perform(patch("/api/admin/users/" + recruiterUser.getId() + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.adminApproved").value(true));

        User updated = userRepository.findById(recruiterUser.getId()).orElseThrow();
        assertTrue(updated.isAdminApproved());

        // Verify email was dispatched
        verify(emailService, times(1)).sendRecruiterApprovalEmail(
                eq("alice@hiregenius.ai"),
                eq("Recruiter Alice")
        );
    }

    @Test
    @DisplayName("11. PATCH /api/admin/users/{id}/privileges updates can_post_jobs and can_apply_to_jobs")
    void updatePrivilegesSuccess() throws Exception {
        // Toggle recruiter canPostJobs to false
        com.hiregenius.authservice.auth.dto.request.UpdateUserPrivilegesRequest recruiterPriv =
                new com.hiregenius.authservice.auth.dto.request.UpdateUserPrivilegesRequest(false, null);

        mockMvc.perform(patch("/api/admin/users/" + recruiterUser.getId() + "/privileges")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recruiterPriv)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.canPostJobs").value(false));

        User updatedRecruiter = userRepository.findById(recruiterUser.getId()).orElseThrow();
        assertFalse(updatedRecruiter.isCanPostJobs());

        // Toggle candidate canApplyToJobs to false
        com.hiregenius.authservice.auth.dto.request.UpdateUserPrivilegesRequest candidatePriv =
                new com.hiregenius.authservice.auth.dto.request.UpdateUserPrivilegesRequest(null, false);

        mockMvc.perform(patch("/api/admin/users/" + candidateUser.getId() + "/privileges")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(candidatePriv)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.canApplyToJobs").value(false));

        User updatedCandidate = userRepository.findById(candidateUser.getId()).orElseThrow();
        assertFalse(updatedCandidate.isCanApplyToJobs());
    }
}
