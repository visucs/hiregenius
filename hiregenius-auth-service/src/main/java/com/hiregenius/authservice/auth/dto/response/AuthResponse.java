package com.hiregenius.authservice.auth.dto.response;

import com.hiregenius.authservice.auth.entity.Role;

public class AuthResponse {

    private String token;
    private Role role;
    private UserResponse user;
    private String message;

    public AuthResponse() {
    }

    public AuthResponse(String token, Role role) {
        this.token = token;
        this.role = role;
    }

    public AuthResponse(String token, Role role, UserResponse user) {
        this.token = token;
        this.role = role;
        this.user = user;
    }

    public AuthResponse(String token, Role role, UserResponse user, String message) {
        this.token = token;
        this.role = role;
        this.user = user;
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public UserResponse getUser() {
        return user;
    }

    public void setUser(UserResponse user) {
        this.user = user;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
