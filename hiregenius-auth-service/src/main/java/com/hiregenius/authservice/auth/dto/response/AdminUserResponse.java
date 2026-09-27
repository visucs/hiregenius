package com.hiregenius.authservice.auth.dto.response;

import com.hiregenius.authservice.auth.entity.AuthProvider;
import com.hiregenius.authservice.auth.entity.Role;
import com.hiregenius.authservice.auth.entity.User;

import java.time.LocalDateTime;

public class AdminUserResponse {

    private Long id;
    private String name;
    private String email;
    private Role role;
    private AuthProvider authProvider;
    private boolean active;
    private boolean emailVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AdminUserResponse() {
    }

    public AdminUserResponse(Long id, String name, String email, Role role, AuthProvider authProvider,
                             boolean active, boolean emailVerified, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.authProvider = authProvider;
        this.active = active;
        this.emailVerified = emailVerified;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static AdminUserResponse fromEntity(User user) {
        if (user == null) {
            return null;
        }
        return new AdminUserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getAuthProvider(),
                user.isActive(),
                user.isEmailVerified(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public AuthProvider getAuthProvider() {
        return authProvider;
    }

    public void setAuthProvider(AuthProvider authProvider) {
        this.authProvider = authProvider;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
