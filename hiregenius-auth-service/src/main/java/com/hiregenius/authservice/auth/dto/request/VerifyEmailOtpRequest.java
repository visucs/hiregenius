package com.hiregenius.authservice.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class VerifyEmailOtpRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    @Schema(description = "Account email address", example = "candidate@hiregenius.ai")
    private String email;

    @NotBlank(message = "Verification code is required")
    @Pattern(regexp = "^[0-9]{6}$", message = "Verification code must be exactly 6 numeric digits")
    @Schema(description = "6-digit numeric verification OTP", example = "123456")
    private String otp;

    public VerifyEmailOtpRequest() {
    }

    public VerifyEmailOtpRequest(String email, String otp) {
        this.email = email;
        this.otp = otp;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }
}
