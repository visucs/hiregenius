package com.hiregenius.authservice.auth.controller;

import com.hiregenius.authservice.auth.dto.request.ForgotPasswordRequest;
import com.hiregenius.authservice.auth.dto.request.GoogleLoginRequest;
import com.hiregenius.authservice.auth.dto.request.LoginRequest;
import com.hiregenius.authservice.auth.dto.request.RegisterRequest;
import com.hiregenius.authservice.auth.dto.request.ResetPasswordRequest;
import com.hiregenius.authservice.auth.dto.response.AuthResponse;
import com.hiregenius.authservice.auth.dto.response.UserResponse;
import com.hiregenius.authservice.auth.service.AuthService;
import com.hiregenius.authservice.common.ApiResponse;
import com.hiregenius.authservice.exception.ApiError;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/auth", "/auth"})
@Tag(name = "Authentication", description = "Endpoints for local & Google login, user registration, token validation, and password recovery")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping({"/register", "/signup"})
    @Operation(
            summary = "Register a new user",
            description = "Registers a RECRUITER or CANDIDATE. Public ADMIN registration is rejected."
    )
    @RequestBody(
            description = "Registration payload. Role must be RECRUITER or CANDIDATE.",
            required = true,
            content = @Content(
                    schema = @Schema(implementation = RegisterRequest.class),
                    examples = {
                            @ExampleObject(
                                    name = "Recruiter Registration",
                                    summary = "Register as RECRUITER",
                                    value = "{\n  \"name\": \"Sarah Recruiter\",\n  \"email\": \"sarah@hiregenius.ai\",\n  \"password\": \"Password123!\",\n  \"role\": \"RECRUITER\"\n}"
                            ),
                            @ExampleObject(
                                    name = "Candidate Registration",
                                    summary = "Register as CANDIDATE",
                                    value = "{\n  \"name\": \"Alex Candidate\",\n  \"email\": \"alex@hiregenius.ai\",\n  \"password\": \"Candidate123!\",\n  \"role\": \"CANDIDATE\"\n}"
                            )
                    }
            )
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "201",
                    description = "User registered successfully; JWT issued",
                    content = @Content(
                            schema = @Schema(implementation = AuthResponse.class),
                            examples = @ExampleObject(
                                    name = "Registration Success",
                                    value = "{\n  \"token\": \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzYXJhaEBoaXJlZ2VuaXVzLmFpIiwicm9sZSI6IlJFQ1JVSVRFUiIsImlhdCI6MTcyNjQ2ODAwMCwiZXhwIjoxNzI2NTU0NDAwfQ.example\",\n  \"role\": \"RECRUITER\",\n  \"user\": {\n    \"id\": 1,\n    \"name\": \"Sarah Recruiter\",\n    \"email\": \"sarah@hiregenius.ai\",\n    \"role\": \"RECRUITER\",\n    \"authProvider\": \"LOCAL\"\n  },\n  \"message\": \"User registered successfully\"\n}"
                            )
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Validation error or role=ADMIN attempt",
                    content = @Content(
                            schema = @Schema(implementation = ApiError.class),
                            examples = {
                                    @ExampleObject(
                                            name = "Admin Registration Blocked",
                                            summary = "Role=ADMIN attempt rejected",
                                            value = "{\n  \"status\": 400,\n  \"message\": \"Registration with ADMIN role is not allowed\",\n  \"timestamp\": \"2026-09-16T08:00:00\",\n  \"path\": \"/api/auth/register\"\n}"
                                    ),
                                    @ExampleObject(
                                            name = "Validation Error",
                                            summary = "Validation constraint failure",
                                            value = "{\n  \"status\": 400,\n  \"message\": \"Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character\",\n  \"timestamp\": \"2026-09-16T08:00:00\",\n  \"path\": \"/api/auth/register\"\n}"
                                    )
                            }
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "409",
                    description = "Duplicate email error",
                    content = @Content(
                            schema = @Schema(implementation = ApiError.class),
                            examples = @ExampleObject(
                                    name = "Duplicate Email",
                                    summary = "Email already in use",
                                    value = "{\n  \"status\": 409,\n  \"message\": \"An account with this email address already exists\",\n  \"timestamp\": \"2026-09-16T08:00:00\",\n  \"path\": \"/api/auth/register\"\n}"
                            )
                    )
            )
    })
    public ResponseEntity<AuthResponse> register(@Valid @org.springframework.web.bind.annotation.RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(
            summary = "Login with email and password",
            description = "Authenticates an existing user with email and password, checks account provider type, and issues a JWT."
    )
    @RequestBody(
            description = "User login credentials",
            required = true,
            content = @Content(
                    schema = @Schema(implementation = LoginRequest.class),
                    examples = {
                            @ExampleObject(
                                    name = "Recruiter / Candidate Login",
                                    summary = "Valid user credentials",
                                    value = "{\n  \"email\": \"sarah@hiregenius.ai\",\n  \"password\": \"Password123!\"\n}"
                            ),
                            @ExampleObject(
                                    name = "System Admin Login",
                                    summary = "Default admin credentials",
                                    value = "{\n  \"email\": \"admin@hiregenius.ai\",\n  \"password\": \"Admin123!\"\n}"
                            )
                    }
            )
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Authentication successful; JWT issued",
                    content = @Content(
                            schema = @Schema(implementation = AuthResponse.class),
                            examples = @ExampleObject(
                                    name = "Login Success",
                                    value = "{\n  \"token\": \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzYXJhaEBoaXJlZ2VuaXVzLmFpIiwicm9sZSI6IlJFQ1JVSVRFUiIsImlhdCI6MTcyNjQ2ODAwMCwiZXhwIjoxNzI2NTU0NDAwfQ.example\",\n  \"role\": \"RECRUITER\",\n  \"user\": {\n    \"id\": 1,\n    \"name\": \"Sarah Recruiter\",\n    \"email\": \"sarah@hiregenius.ai\",\n    \"role\": \"RECRUITER\",\n    \"authProvider\": \"LOCAL\"\n  },\n  \"message\": \"User logged in successfully\"\n}"
                            )
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Account is Google-only, use Google button (or validation failure)",
                    content = @Content(
                            schema = @Schema(implementation = ApiError.class),
                            examples = {
                                    @ExampleObject(
                                            name = "Google-Only Account",
                                            summary = "Attempted password login on Google OAuth account",
                                            value = "{\n  \"status\": 400,\n  \"message\": \"This account uses Google Sign-In — please use the Google button\",\n  \"timestamp\": \"2026-09-16T08:00:00\",\n  \"path\": \"/api/auth/login\"\n}"
                                    ),
                                    @ExampleObject(
                                            name = "Validation Error",
                                            summary = "Missing email or password",
                                            value = "{\n  \"status\": 400,\n  \"message\": \"Email is required, Password is required\",\n  \"timestamp\": \"2026-09-16T08:00:00\",\n  \"path\": \"/api/auth/login\"\n}"
                                    )
                            }
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Wrong password or non-existent email",
                    content = @Content(
                            schema = @Schema(implementation = ApiError.class),
                            examples = @ExampleObject(
                                    name = "Invalid Credentials",
                                    summary = "Wrong password or email not found",
                                    value = "{\n  \"status\": 401,\n  \"message\": \"Invalid email or password\",\n  \"timestamp\": \"2026-09-16T08:00:00\",\n  \"path\": \"/api/auth/login\"\n}"
                            )
                    )
            )
    })
    public ResponseEntity<AuthResponse> login(@Valid @org.springframework.web.bind.annotation.RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google-login")
    @Operation(
            summary = "Login or register via Google OAuth",
            description = "Accepts a Google ID token. Creates a new account if the email doesn't exist, or links/logs into an existing account."
    )
    @RequestBody(
            description = "Google OAuth payload. 'role' is required for first-time account registration (RECRUITER or CANDIDATE).",
            required = true,
            content = @Content(
                    schema = @Schema(implementation = GoogleLoginRequest.class),
                    examples = {
                            @ExampleObject(
                                    name = "Existing User Login",
                                    summary = "Login existing account (role optional)",
                                    value = "{\n  \"idToken\": \"eyJhbGciOiJSUzI1NiIsImtpZCI6IjA4ZDF...\"\n}"
                            ),
                            @ExampleObject(
                                    name = "New Candidate Registration",
                                    summary = "First-time sign-up as CANDIDATE",
                                    value = "{\n  \"idToken\": \"eyJhbGciOiJSUzI1NiIsImtpZCI6IjA4ZDF...\",\n  \"role\": \"CANDIDATE\"\n}"
                            ),
                            @ExampleObject(
                                    name = "New Recruiter Registration",
                                    summary = "First-time sign-up as RECRUITER",
                                    value = "{\n  \"idToken\": \"eyJhbGciOiJSUzI1NiIsImtpZCI6IjA4ZDF...\",\n  \"role\": \"RECRUITER\"\n}"
                            )
                    }
            )
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Existing user authenticated successfully via Google",
                    content = @Content(
                            schema = @Schema(implementation = AuthResponse.class),
                            examples = @ExampleObject(
                                    name = "Existing User Authenticated",
                                    value = "{\n  \"token\": \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJleGlzdGluZ0BoaXJlZ2VuaXVzLmFpIiwicm9sZSI6IlJFQ1JVSVRFUiIsImlhdCI6MTcyNjQ2ODAwMCwiZXhwIjoxNzI2NTU0NDAwfQ.example\",\n  \"role\": \"RECRUITER\",\n  \"user\": {\n    \"id\": 2,\n    \"name\": \"Existing Google User\",\n    \"email\": \"existing@hiregenius.ai\",\n    \"role\": \"RECRUITER\",\n    \"authProvider\": \"GOOGLE\"\n  },\n  \"message\": \"User logged in successfully via Google\"\n}"
                            )
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "201",
                    description = "New user account created and authenticated via Google",
                    content = @Content(
                            schema = @Schema(implementation = AuthResponse.class),
                            examples = @ExampleObject(
                                    name = "New User Created",
                                    value = "{\n  \"token\": \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJuZXdnaXJsQGhpcmVnZW5pdXMuYWkiLCJyb2xlIjoiQ0FORElEQVRFIiwiaWF0IjoxNzI2NDY4MDAwLCJleHAiOjE3MjY1NTQ0MDB9.example\",\n  \"role\": \"CANDIDATE\",\n  \"user\": {\n    \"id\": 3,\n    \"name\": \"New Google User\",\n    \"email\": \"newgoogle@hiregenius.ai\",\n    \"role\": \"CANDIDATE\",\n    \"authProvider\": \"GOOGLE\"\n  },\n  \"message\": \"User registered and logged in successfully via Google\"\n}"
                            )
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "role=ADMIN attempt, or invalid/tampered Google token",
                    content = @Content(
                            schema = @Schema(implementation = ApiError.class),
                            examples = {
                                    @ExampleObject(
                                            name = "Admin Role Attempt Rejected",
                                            summary = "ADMIN role cannot be self-assigned",
                                            value = "{\n  \"status\": 400,\n  \"message\": \"ADMIN role cannot be self-assigned\",\n  \"timestamp\": \"2026-09-16T08:00:00\",\n  \"path\": \"/api/auth/google-login\"\n}"
                                    ),
                                    @ExampleObject(
                                            name = "Invalid or Tampered Google Token",
                                            summary = "Invalid/expired Firebase ID token",
                                            value = "{\n  \"status\": 400,\n  \"message\": \"Invalid or expired Google token\",\n  \"timestamp\": \"2026-09-16T08:00:00\",\n  \"path\": \"/api/auth/google-login\"\n}"
                                    ),
                                    @ExampleObject(
                                            name = "Missing Role for New User",
                                            summary = "Role required on first sign-in",
                                            value = "{\n  \"status\": 400,\n  \"message\": \"Role is required for first-time Google sign-in. Allowed roles: RECRUITER, CANDIDATE\",\n  \"timestamp\": \"2026-09-16T08:00:00\",\n  \"path\": \"/api/auth/google-login\"\n}"
                                    )
                            }
                    )
            )
    })
    public ResponseEntity<AuthResponse> googleLogin(@Valid @org.springframework.web.bind.annotation.RequestBody GoogleLoginRequest request) {
        AuthResponse response = authService.googleLogin(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    @Operation(
            summary = "Request a password reset",
            description = "Always returns a generic 200 response regardless of whether the email exists, to avoid leaking account existence."
    )
    @RequestBody(
            description = "Email address for password recovery",
            required = true,
            content = @Content(
                    schema = @Schema(implementation = ForgotPasswordRequest.class),
                    examples = @ExampleObject(
                            name = "Password Reset Request",
                            summary = "Submit email for password reset",
                            value = "{\n  \"email\": \"sarah@hiregenius.ai\"\n}"
                    )
            )
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Uniform success response (generic acknowledgment returned regardless of email existence)",
                    content = @Content(
                            schema = @Schema(implementation = ApiResponse.class),
                            examples = @ExampleObject(
                                    name = "Uniform Success",
                                    value = "{\n  \"success\": true,\n  \"message\": \"If an account with that email exists, password reset instructions have been sent.\",\n  \"data\": null,\n  \"timestamp\": \"2026-09-16T08:00:00\"\n}"
                            )
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Validation error (invalid or missing email)",
                    content = @Content(
                            schema = @Schema(implementation = ApiError.class),
                            examples = @ExampleObject(
                                    name = "Invalid Email",
                                    value = "{\n  \"status\": 400,\n  \"message\": \"Enter a valid email address\",\n  \"timestamp\": \"2026-09-16T08:00:00\",\n  \"path\": \"/api/auth/forgot-password\"\n}"
                            )
                    )
            )
    })
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @org.springframework.web.bind.annotation.RequestBody ForgotPasswordRequest request) {
        ApiResponse<String> response = authService.forgotPassword(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    @Operation(
            summary = "Reset user password",
            description = "Resets user password using a valid, unexpired reset token. Tokens expire in 30 minutes and can only be used once."
    )
    @RequestBody(
            description = "Password reset payload containing token and new password",
            required = true,
            content = @Content(
                    schema = @Schema(implementation = ResetPasswordRequest.class),
                    examples = @ExampleObject(
                            name = "Reset Password Request",
                            summary = "Valid token and new password",
                            value = "{\n  \"token\": \"c5f1a238-7f99-4d6d-8547-9759e66cb4b1\",\n  \"newPassword\": \"NewPassword123!\"\n}"
                    )
            )
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Password reset successfully",
                    content = @Content(
                            schema = @Schema(implementation = ApiResponse.class),
                            examples = @ExampleObject(
                                    name = "Password Reset Success",
                                    value = "{\n  \"success\": true,\n  \"message\": \"Password has been reset successfully. You can now log in with your new password.\",\n  \"data\": null,\n  \"timestamp\": \"2026-09-16T08:00:00\"\n}"
                            )
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Invalid or expired token, Google-only account, or validation error",
                    content = @Content(
                            schema = @Schema(implementation = ApiError.class),
                            examples = {
                                    @ExampleObject(
                                            name = "Invalid or Expired Token",
                                            summary = "Token not found, expired, or already used",
                                            value = "{\n  \"status\": 400,\n  \"message\": \"Invalid or expired password reset token\",\n  \"timestamp\": \"2026-09-16T08:00:00\",\n  \"path\": \"/api/auth/reset-password\"\n}"
                                    ),
                                    @ExampleObject(
                                            name = "Google-Only Account",
                                            summary = "User authenticated via Google OAuth with no password",
                                            value = "{\n  \"status\": 400,\n  \"message\": \"This account uses Google Sign-In and has no password to reset\",\n  \"timestamp\": \"2026-09-16T08:00:00\",\n  \"path\": \"/api/auth/reset-password\"\n}"
                                    ),
                                    @ExampleObject(
                                            name = "Validation Error",
                                            summary = "Password does not meet complexity requirements",
                                            value = "{\n  \"status\": 400,\n  \"message\": \"Password must be at least 8 characters long and contain at least one number\",\n  \"timestamp\": \"2026-09-16T08:00:00\",\n  \"path\": \"/api/auth/reset-password\"\n}"
                                    )
                            }
                    )
            )
    })
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @org.springframework.web.bind.annotation.RequestBody ResetPasswordRequest request) {
        ApiResponse<String> response = authService.resetPassword(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/validate")
    @Operation(
            summary = "Validate a JWT token and return user info",
            description = "Validates the Bearer token in the Authorization header and returns user metadata.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Valid token; user data returned",
                    content = @Content(
                            schema = @Schema(implementation = UserResponse.class),
                            examples = @ExampleObject(
                                    name = "Valid Token Response",
                                    value = "{\n  \"id\": 1,\n  \"name\": \"Sarah Recruiter\",\n  \"email\": \"sarah@hiregenius.ai\",\n  \"role\": \"RECRUITER\",\n  \"authProvider\": \"LOCAL\"\n}"
                            )
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Missing, invalid, or tampered token",
                    content = @Content(
                            schema = @Schema(implementation = ApiError.class),
                            examples = {
                                    @ExampleObject(
                                            name = "Invalid or Expired Token",
                                            summary = "Invalid signature or expired",
                                            value = "{\n  \"status\": 401,\n  \"message\": \"Invalid or expired JWT token\",\n  \"timestamp\": \"2026-09-16T08:00:00\",\n  \"path\": \"/api/auth/validate\"\n}"
                                    ),
                                    @ExampleObject(
                                            name = "Missing Token",
                                            summary = "Authorization header missing or empty",
                                            value = "{\n  \"status\": 401,\n  \"message\": \"Authentication failed: Missing or invalid Authorization header\",\n  \"timestamp\": \"2026-09-16T08:00:00\",\n  \"path\": \"/api/auth/validate\"\n}"
                                    )
                            }
                    )
            )
    })
    public ResponseEntity<UserResponse> validate(
            @Parameter(
                    name = "Authorization",
                    description = "Bearer JWT token (format: 'Bearer <token>')",
                    required = true,
                    example = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            )
            @RequestHeader("Authorization") String authHeader
    ) {
        UserResponse response = authService.validateToken(authHeader);
        return ResponseEntity.ok(response);
    }
}
