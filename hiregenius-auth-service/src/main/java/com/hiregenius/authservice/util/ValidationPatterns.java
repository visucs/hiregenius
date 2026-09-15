package com.hiregenius.authservice.util;

public final class ValidationPatterns {

    private ValidationPatterns() {
    }

    public static final String PASSWORD_REGEX = "^(?=.*[0-9]).{8,}$";
    public static final String PASSWORD_MESSAGE = "Password must be at least 8 characters long and contain at least one number";
}
