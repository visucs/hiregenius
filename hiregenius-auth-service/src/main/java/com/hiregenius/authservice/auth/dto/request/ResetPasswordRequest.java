package com.hiregenius.authservice.auth.dto.request;

import com.hiregenius.authservice.util.ValidationPatterns;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class ResetPasswordRequest {

    @NotBlank(message = "Token is required")
    private String token;

    @NotBlank(message = "New password is required")
    @Pattern(regexp = ValidationPatterns.PASSWORD_REGEX, message = ValidationPatterns.PASSWORD_MESSAGE)
    private String newPassword;

    public ResetPasswordRequest() {
    }

    public ResetPasswordRequest(String token, String newPassword) {
        this.token = token;
        this.newPassword = newPassword;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
