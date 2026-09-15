package com.hiregenius.authservice.auth.service;

import com.hiregenius.authservice.auth.dto.request.ForgotPasswordRequest;
import com.hiregenius.authservice.auth.dto.request.GoogleLoginRequest;
import com.hiregenius.authservice.auth.dto.request.LoginRequest;
import com.hiregenius.authservice.auth.dto.request.RegisterRequest;
import com.hiregenius.authservice.auth.dto.response.AuthResponse;
import com.hiregenius.authservice.auth.dto.response.UserResponse;
import com.hiregenius.authservice.auth.entity.AuthProvider;
import com.hiregenius.authservice.auth.entity.Role;
import com.hiregenius.authservice.auth.entity.User;
import com.hiregenius.authservice.auth.repository.UserRepository;
import com.hiregenius.authservice.common.ApiResponse;
import com.hiregenius.authservice.exception.DuplicateEmailException;
import com.hiregenius.authservice.exception.InvalidCredentialsException;
import com.hiregenius.authservice.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final GoogleAuthService googleAuthService;

    public AuthServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            GoogleAuthService googleAuthService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.googleAuthService = googleAuthService;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Validate and normalize role
        Role role = parseAndValidatePublicRole(request.getRole());

        String email = request.getEmail().toLowerCase().trim();

        // Check for duplicate email
        if (userRepository.existsByEmail(email)) {
            log.warn("Registration rejected: Email already registered [{}]", email);
            throw new DuplicateEmailException("An account with this email address already exists");
        }

        // Create new LOCAL user
        User user = new User(
                request.getName().trim(),
                email,
                passwordEncoder.encode(request.getPassword()),
                role,
                AuthProvider.LOCAL
        );

        User savedUser = userRepository.save(user);
        log.info("Registered new LOCAL user: id={}, email={}, role={}", savedUser.getId(), savedUser.getEmail(), savedUser.getRole());

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
    public ApiResponse<String> forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        log.info("Forgot password request received for email: {}", email);

        // Constant generic message regardless of whether the account exists or provider type
        // Prevents account enumeration and email leakage
        return ApiResponse.ok("If an account exists with this email, password reset instructions have been sent.", null);
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
