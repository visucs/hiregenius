package com.hiregenius.authservice.auth.entity;

/**
 * Role enum representing platform user permissions.
 * Only RECRUITER and CANDIDATE can be chosen during public registration.
 * ADMIN accounts can only be provisioned via database seed/migrations.
 */
public enum Role {
    RECRUITER,
    CANDIDATE,
    ADMIN
}
