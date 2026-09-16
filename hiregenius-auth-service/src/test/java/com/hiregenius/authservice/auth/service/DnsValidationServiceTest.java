package com.hiregenius.authservice.auth.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DnsValidationServiceTest {

    private DirContext mockDirContext;
    private DnsValidationServiceImpl dnsService;

    @BeforeEach
    void setUp() {
        mockDirContext = mock(DirContext.class);
        dnsService = new DnsValidationServiceImpl(env -> mockDirContext);
        ReflectionTestUtils.setField(dnsService, "mxCheckEnabled", true);
    }

    @Test
    @DisplayName("Null or empty email rejected without DNS lookup")
    void nullOrEmptyEmailRejected() {
        assertFalse(dnsService.hasValidMxRecord(null));
        assertFalse(dnsService.hasValidMxRecord(""));
        assertFalse(dnsService.hasValidMxRecord("   "));
        assertFalse(dnsService.hasValidMxRecord("no-at-sign"));
        assertFalse(dnsService.hasValidMxRecord("user@"));
        assertFalse(dnsService.hasValidMxRecord("user@   "));
    }

    @Test
    @DisplayName("When mxCheckEnabled is false, check is bypassed and returns true without DNS lookup")
    void checkBypassedWhenDisabled() {
        ReflectionTestUtils.setField(dnsService, "mxCheckEnabled", false);

        assertTrue(dnsService.hasValidMxRecord("any@anything.xyz"));
    }

    @Test
    @DisplayName("Valid MX record returns true (fully mocked offline)")
    void validMxRecordReturnsTrue() throws Exception {
        Attributes mockAttrs = mock(Attributes.class);
        Attribute mockMxAttr = mock(Attribute.class);

        when(mockDirContext.getAttributes(eq("hiregenius.ai"), eq(new String[]{"MX"}))).thenReturn(mockAttrs);
        when(mockAttrs.get("MX")).thenReturn(mockMxAttr);
        when(mockMxAttr.size()).thenReturn(2);

        assertTrue(dnsService.hasValidMxRecord("recruiter@hiregenius.ai"));
    }

    @Test
    @DisplayName("No MX record falls back to valid A record per RFC 5321 (fully mocked offline)")
    void fallbackToARecordReturnsTrue() throws Exception {
        Attributes mockMxAttrs = mock(Attributes.class);
        Attributes mockAAttrs = mock(Attributes.class);
        Attribute mockAAttr = mock(Attribute.class);

        when(mockDirContext.getAttributes(eq("fallbackdomain.com"), eq(new String[]{"MX"}))).thenReturn(mockMxAttrs);
        when(mockMxAttrs.get("MX")).thenReturn(null);

        when(mockDirContext.getAttributes(eq("fallbackdomain.com"), eq(new String[]{"A"}))).thenReturn(mockAAttrs);
        when(mockAAttrs.get("A")).thenReturn(mockAAttr);
        when(mockAAttr.size()).thenReturn(1);

        assertTrue(dnsService.hasValidMxRecord("user@fallbackdomain.com"));
    }

    @Test
    @DisplayName("Domain with neither MX nor A records fails validation (fully mocked offline)")
    void noMxAndNoARecordFails() throws Exception {
        Attributes mockMxAttrs = mock(Attributes.class);
        Attributes mockAAttrs = mock(Attributes.class);

        when(mockDirContext.getAttributes(eq("nomailserver.xyz"), eq(new String[]{"MX"}))).thenReturn(mockMxAttrs);
        when(mockMxAttrs.get("MX")).thenReturn(null);

        when(mockDirContext.getAttributes(eq("nomailserver.xyz"), eq(new String[]{"A"}))).thenReturn(mockAAttrs);
        when(mockAAttrs.get("A")).thenReturn(null);

        assertFalse(dnsService.hasValidMxRecord("user@nomailserver.xyz"));
    }

    @Test
    @DisplayName("NamingException or DNS failure fails safely and returns false (fully mocked offline)")
    void dnsLookupExceptionFailsSafely() throws Exception {
        when(mockDirContext.getAttributes(eq("unresolvable.invalid"), any()))
                .thenThrow(new NamingException("DNS name not found [response code 3]"));

        assertFalse(dnsService.hasValidMxRecord("test@unresolvable.invalid"));
    }
}
