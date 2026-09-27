package com.hiregenius.authservice.auth.service;

import com.hiregenius.authservice.auth.dto.request.ForgotPasswordRequest;
import com.hiregenius.authservice.auth.dto.request.GoogleLoginRequest;
import com.hiregenius.authservice.auth.dto.request.LoginRequest;
import com.hiregenius.authservice.auth.dto.request.RegisterRequest;
import com.hiregenius.authservice.auth.dto.request.ResetPasswordRequest;
import com.hiregenius.authservice.auth.dto.response.AuthResponse;
import com.hiregenius.authservice.auth.dto.response.UserResponse;
import com.hiregenius.authservice.auth.entity.AuthProvider;
import com.hiregenius.authservice.auth.entity.EmailVerificationToken;
import com.hiregenius.authservice.auth.entity.PasswordResetToken;
import com.hiregenius.authservice.auth.entity.Role;
import com.hiregenius.authservice.auth.entity.User;
import com.hiregenius.authservice.auth.repository.EmailVerificationTokenRepository;
import com.hiregenius.authservice.auth.repository.PasswordResetTokenRepository;
import com.hiregenius.authservice.auth.repository.UserRepository;
import com.hiregenius.authservice.common.ApiResponse;
import com.hiregenius.authservice.exception.DuplicateEmailException;
import com.hiregenius.authservice.exception.InvalidCredentialsException;
import com.hiregenius.authservice.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final GoogleAuthService googleAuthService;
    private final DnsValidationService dnsValidationService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final EmailService emailService;

    @Value("${app.frontend.base-url:https://hiregenius-delta.vercel.app}")
    private String frontendBaseUrl;

    public AuthServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            GoogleAuthService googleAuthService,
            DnsValidationService dnsValidationService,
            PasswordResetTokenRepository passwordResetTokenRepository,
            EmailVerificationTokenRepository emailVerificationTokenRepository,
            EmailService emailService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.googleAuthService = googleAuthService;
        this.dnsValidationService = dnsValidationService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.emailService = emailService;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Validate and normalize role
        Role role = parseAndValidatePublicRole(request.getRole());

        String email = request.getEmail().toLowerCase().trim();

        // 1. Verify DNS MX record for email domain
        if (!dnsValidationService.hasValidMxRecord(email)) {
            log.warn("Registration rejected: Email domain has no valid MX records [{}]", email);
            throw new IllegalArgumentException("This email domain does not appear to be valid.");
        }

        // 2. Check for duplicate email
        if (userRepository.existsByEmail(email)) {
            log.warn("Registration rejected: Email already registered [{}]", email);
            throw new DuplicateEmailException("An account with this email address already exists");
        }

        // 3. Create new LOCAL user
        User user = new User(
                request.getName().trim(),
                email,
                passwordEncoder.encode(request.getPassword()),
                role,
                AuthProvider.LOCAL
        );

        User savedUser = userRepository.save(user);
        log.info("Registered new LOCAL user: id={}, email={}, role={}", savedUser.getId(), savedUser.getEmail(), savedUser.getRole());

        // Dispatch email verification link for candidate/recruiter accounts
        if (savedUser.getRole() != Role.ADMIN && savedUser.getAuthProvider() == AuthProvider.LOCAL) {
            String verificationToken = UUID.randomUUID().toString();
            EmailVerificationToken evt = new EmailVerificationToken(
                    savedUser,
                    verificationToken,
                    LocalDateTime.now().plusHours(24)
            );
            emailVerificationTokenRepository.save(evt);
            String verificationLink = frontendBaseUrl + "/verify-email?token=" + verificationToken;
            emailService.sendVerificationEmail(savedUser.getEmail(), savedUser.getName(), verificationLink);
            log.info("Dispatched verification email for newly registered user [{}]: token={}", savedUser.getEmail(), verificationToken);
        }

        String token = jwtService.generateToken(savedUser);
        return new AuthResponse(token, savedUser.getRole(), UserResponse.fromEntity(savedUser), "User registered successfully");
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        // Check if user exists and whether this is a Google-only account
        Optional<User> existingUserOpt = userRepository.findByEmail(email);
        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            if (existingUser.getAuthProvider() == AuthProvider.GOOGLE && existingUser.getPassword() == null) {
                log.info("Password login rejected for Google-only user [{}]", email);
                throw new IllegalArgumentException("This account uses Google Sign-In — please use the Google button");
            }
        }

        // Authenticate credentials
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );
        } catch (AuthenticationException ex) {
            log.warn("Login failed for email [{}]: {}", email, ex.getMessage());
            throw new InvalidCredentialsException("Invalid email or password");
        }

        User user = existingUserOpt.orElseGet(() ->
                userRepository.findByEmail(email).orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"))
        );

        String token = jwtService.generateToken(user);
        log.info("User logged in successfully: id={}, email={}, role={}", user.getId(), user.getEmail(), user.getRole());

        return new AuthResponse(token, user.getRole(), UserResponse.fromEntity(user), "Login successful");
    }

    @Override
    @Transactional
    public AuthResponse googleLogin(GoogleLoginRequest request) {
        // 1. Verify Firebase ID token and extract verified claims
        GoogleAuthService.FirebaseUserInfo userInfo = googleAuthService.verifyIdToken(request.getIdToken());
        String email = userInfo.email().toLowerCase().trim();

        Optional<User> existingUserOpt = userRepository.findByEmail(email);

        if (existingUserOpt.isEmpty()) {
            // New user registration via Google OAuth
            if (request.getRole() == null || request.getRole().trim().isEmpty()) {
                log.warn("Google registration rejected: Role is required for first-time sign-up [{}]", email);
                throw new IllegalArgumentException("Role is required for first-time Google sign up");
            }

            Role role = parseAndValidatePublicRole(request.getRole());

            String displayName = (userInfo.name() != null && !userInfo.name().trim().isEmpty())
                    ? userInfo.name().trim()
                    : "Google User";

            User newUser = new User(
                    displayName,
                    email,
                    null, // Nullable password for Google-registered users
                    role,
                    AuthProvider.GOOGLE
            );

            User savedUser = userRepository.save(newUser);
            log.info("Created new GOOGLE user: id={}, email={}, role={}", savedUser.getId(), savedUser.getEmail(), savedUser.getRole());

            String token = jwtService.generateToken(savedUser);
            return new AuthResponse(token, savedUser.getRole(), UserResponse.fromEntity(savedUser), "Google registration successful");
        } else {
            // Existing user login via Google OAuth
            User existingUser = existingUserOpt.get();

            // Account-linking policy:
            // If the account was previously registered locally, we preserve their credentials and stored role,
            // allowing seamless Google sign-in for the verified email.
            log.info("Existing user authenticated via Google OAuth: id={}, email={}, role={}, provider={}",
                    existingUser.getId(), existingUser.getEmail(), existingUser.getRole(), existingUser.getAuthProvider());

            String token = jwtService.generateToken(existingUser);
            return new AuthResponse(token, existingUser.getRole(), UserResponse.fromEntity(existingUser), "Google login successful");
        }
    }

    @Override
    @Transactional
    public ApiResponse<String> forgotPassword(ForgotPasswordRequest request) {
        long startTime = System.currentTimeMillis();
        String email = request.getEmail().toLowerCase().trim();
        log.info("[FORGOT-PASSWORD] Request started for email: {}", email);

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Only issue reset token if user has a password / is not purely Google OAuth
            if (user.getPassword() != null && user.getAuthProvider() != AuthProvider.GOOGLE) {
                String token = UUID.randomUUID().toString();
                LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(30);

                PasswordResetToken resetToken = new PasswordResetToken(user, token, expiresAt);
                passwordResetTokenRepository.save(resetToken);
                long tokenSavedDuration = System.currentTimeMillis() - startTime;
                log.info("[FORGOT-PASSWORD] Token generated and saved to DB in {}ms for user id={}", tokenSavedDuration, user.getId());

                String resetLink = frontendBaseUrl + "/reset-password?token=" + token;
                emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetLink);
                long emailDispatchedDuration = System.currentTimeMillis() - startTime;
                log.info("[FORGOT-PASSWORD] Async email dispatch invoked in {}ms for user id={}", emailDispatchedDuration, user.getId());
            } else {
                log.info("[FORGOT-PASSWORD] Skipping password reset email for Google-only user without password [{}]", email);
            }
        }

        long totalDuration = System.currentTimeMillis() - startTime;
        log.info("[FORGOT-PASSWORD] Returning HTTP response in {}ms (total endpoint duration)", totalDuration);

        // Constant generic message regardless of whether the account exists or provider type
        // Prevents account enumeration and email leakage
        return ApiResponse.ok("If an account exists with this email, password reset instructions have been sent.", null);
    }

    @Override
    @Transactional
    public ApiResponse<String> resetPassword(ResetPasswordRequest request) {
        String tokenStr = request.getToken() != null ? request.getToken().trim() : "";
        if (tokenStr.isEmpty()) {
            throw new IllegalArgumentException("Invalid or expired password reset token");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired password reset token"));

        if (resetToken.isUsed() || resetToken.isExpired()) {
            log.warn("Password reset rejected: token is used={} or expired={}", resetToken.isUsed(), resetToken.isExpired());
            throw new IllegalArgumentException("Invalid or expired password reset token");
        }

        User user = resetToken.getUser();
        if (user.getAuthProvider() == AuthProvider.GOOGLE && user.getPassword() == null) {
            log.warn("Password reset rejected: User is Google-only account [{}]", user.getEmail());
            throw new IllegalArgumentException("This account uses Google Sign-In and has no password to reset");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        log.info("Password successfully reset for user id={}, email={}", user.getId(), user.getEmail());
        return ApiResponse.ok("Password has been reset successfully. You can now log in with your new password.", null);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse validateToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new InvalidCredentialsException("Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7);
        if (!jwtService.validateToken(token)) {
            throw new InvalidCredentialsException("Invalid or expired JWT token");
        }

        String email = jwtService.extractEmail(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("User not found for token"));

        return UserResponse.fromEntity(user);
    }

    @Override
    @Transactional
    public ApiResponse<String> verifyEmail(String token) {
        if (token == null || token.trim().isEmpty()) {
            throw new IllegalArgumentException("Verification token is required");
        }

        EmailVerificationToken evt = emailVerificationTokenRepository.findByToken(token.trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid verification token"));

        if (evt.isUsed()) {
            throw new IllegalArgumentException("Verification token has already been used");
        }

        if (evt.isExpired()) {
            throw new IllegalArgumentException("Verification token has expired. Please request a new one.");
        }

        evt.setUsed(true);
        emailVerificationTokenRepository.save(evt);

        User user = evt.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        log.info("Email verified successfully for user id={}, email={}", user.getId(), user.getEmail());
        return ApiResponse.ok("Email verified successfully. You may now access all features.", null);
    }

    @Override
    @Transactional
    public ApiResponse<String> resendVerificationEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }

        String normalizedEmail = email.trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);

        if (userOpt.isEmpty() || userOpt.get().isEmailVerified()) {
            // Uniform generic response to prevent account enumeration
            return ApiResponse.ok("If an unverified account exists with this email, a verification link has been sent.", null);
        }

        User user = userOpt.get();

        // Enforce rate limiting: max 1 request per 2 minutes
        List<EmailVerificationToken> pastTokens = emailVerificationTokenRepository.findByUserOrderByCreatedAtDesc(user);
        if (!pastTokens.isEmpty()) {
            EmailVerificationToken latest = pastTokens.get(0);
            if (latest.getCreatedAt() != null && latest.getCreatedAt().isAfter(LocalDateTime.now().minusMinutes(2))) {
                throw new IllegalArgumentException("Please wait at least 2 minutes before requesting another verification email.");
            }
        }

        // Invalidate past unused tokens
        for (EmailVerificationToken t : pastTokens) {
            if (!t.isUsed()) {
                t.setUsed(true);
                emailVerificationTokenRepository.save(t);
            }
        }

        // Generate and dispatch new verification token
        String token = UUID.randomUUID().toString();
        EmailVerificationToken newToken = new EmailVerificationToken(
                user,
                token,
                LocalDateTime.now().plusHours(24)
        );
        emailVerificationTokenRepository.save(newToken);

        String verificationLink = frontendBaseUrl + "/verify-email?token=" + token;
        emailService.sendVerificationEmail(user.getEmail(), user.getName(), verificationLink);

        log.info("Resent verification email for user [{}]: token={}", user.getEmail(), token);
        return ApiResponse.ok("A new verification email has been sent. Please check your inbox.", null);
    }

    private Role parseAndValidatePublicRole(String roleStr) {
        if (roleStr == null || roleStr.trim().isEmpty()) {
            throw new IllegalArgumentException("Role is required");
        }

        try {
            Role role = Role.valueOf(roleStr.trim().toUpperCase());
            if (role == Role.ADMIN) {
                log.warn("Attempt to register with ADMIN role was rejected");
                throw new IllegalArgumentException("ADMIN role cannot be self-assigned");
            }
            return role;
        } catch (IllegalArgumentException e) {
            if (e.getMessage() != null && e.getMessage().contains("ADMIN")) {
                throw e;
            }
            throw new IllegalArgumentException("Role must be RECRUITER or CANDIDATE");
        }
    }
}
