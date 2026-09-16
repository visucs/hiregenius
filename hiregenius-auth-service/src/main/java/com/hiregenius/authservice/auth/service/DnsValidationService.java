package com.hiregenius.authservice.auth.service;

public interface DnsValidationService {

    /**
     * Verifies that the domain of the given email address has at least one valid MX record.
     *
     * @param email the email address to validate
     * @return true if the email domain has valid MX records, false otherwise
     */
    boolean hasValidMxRecord(String email);
}
