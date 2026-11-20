package com.hiregenius.authservice.auth.dto.request;

import com.hiregenius.authservice.util.ValidationPatterns;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class LoginRequest {

    @NotBlank(message = "Email is required")
    @Email(message = ValidationPatterns.EMAIL_MESSAGE)
    @Pattern(regexp = ValidationPatterns.EMAIL_REGEX, message = ValidationPatterns.EMAIL_MESSAGE)
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    // Optional desired role on login (e.g. RECRUITER or CANDIDATE)
    private String role;

    public LoginRequest() {
    }

    public LoginRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }

    public LoginRequest(String email, String password, String role) {
        this.email = email;
        this.password = password;
        this.role = role;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
