package com.hiregenius.authservice.auth.service;

import com.hiregenius.authservice.auth.dto.request.ForgotPasswordRequest;
import com.hiregenius.authservice.auth.dto.request.GoogleLoginRequest;
import com.hiregenius.authservice.auth.dto.request.LoginRequest;
import com.hiregenius.authservice.auth.dto.request.RegisterRequest;
import com.hiregenius.authservice.auth.dto.request.ResetPasswordRequest;
import com.hiregenius.authservice.auth.dto.response.AuthResponse;
import com.hiregenius.authservice.auth.dto.response.UserResponse;
import com.hiregenius.authservice.common.ApiResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse googleLogin(GoogleLoginRequest request);

    ApiResponse<String> forgotPassword(ForgotPasswordRequest request);

    ApiResponse<String> resetPassword(ResetPasswordRequest request);

    ApiResponse<String> verifyEmailOtp(String email, String otp);

    ApiResponse<String> resendOtp(String email);
    
    ApiResponse<String> changePassword(Long userId, com.hiregenius.authservice.auth.dto.request.ChangePasswordRequest request);

    UserResponse validateToken(String authHeader);
}
