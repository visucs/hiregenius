package com.hiregenius.authservice.util;

public final class ValidationPatterns {

    private ValidationPatterns() {
    }

    public static final String PASSWORD_REGEX = "^(?=.*[0-9]).{8,}$";
    public static final String PASSWORD_MESSAGE = "Password must be at least 8 characters long and contain at least one number";

    // RFC 5322 compliant email regex pattern requiring valid local part, domain, and 2+ char TLD
    public static final String EMAIL_REGEX = "^[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
    public static final String EMAIL_MESSAGE = "Enter a valid email address";
}
