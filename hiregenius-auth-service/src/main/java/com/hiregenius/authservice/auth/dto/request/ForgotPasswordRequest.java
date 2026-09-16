package com.hiregenius.authservice.auth.dto.request;

import com.hiregenius.authservice.util.ValidationPatterns;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class ForgotPasswordRequest {

    @NotBlank(message = "Email is required")
    @Email(message = ValidationPatterns.EMAIL_MESSAGE)
    @Pattern(regexp = ValidationPatterns.EMAIL_REGEX, message = ValidationPatterns.EMAIL_MESSAGE)
    private String email;

    public ForgotPasswordRequest() {
    }

    public ForgotPasswordRequest(String email) {
        this.email = email;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
