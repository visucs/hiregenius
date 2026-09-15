package com.hiregenius.authservice.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public class GoogleLoginRequest {

    @NotBlank(message = "Firebase ID token is required")
    private String idToken;

    // Optional on login, required on first-time registration (RECRUITER or CANDIDATE)
    private String role;

    public GoogleLoginRequest() {
    }

    public GoogleLoginRequest(String idToken) {
        this.idToken = idToken;
    }

    public GoogleLoginRequest(String idToken, String role) {
        this.idToken = idToken;
        this.role = role;
    }

    public String getIdToken() {
        return idToken;
    }

    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
