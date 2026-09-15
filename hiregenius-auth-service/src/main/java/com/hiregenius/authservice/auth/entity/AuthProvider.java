package com.hiregenius.authservice.auth.entity;

/**
 * Authentication provider enum.
 * LOCAL: standard email and password authentication.
 * GOOGLE: OAuth2 / Firebase Google authentication (nullable password).
 */
public enum AuthProvider {
    LOCAL,
    GOOGLE
}
