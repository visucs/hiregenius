package com.hiregenius.authservice.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.naming.CommunicationException;
import javax.naming.NameNotFoundException;
import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.util.Hashtable;

@Service
public class DnsValidationServiceImpl implements DnsValidationService {

    private static final Logger log = LoggerFactory.getLogger(DnsValidationServiceImpl.class);

    @FunctionalInterface
    public interface DirContextProvider {
        DirContext createDirContext(Hashtable<String, String> env) throws NamingException;
    }

    private final DirContextProvider dirContextProvider;

    @Value("${app.email-validation.mx-check-enabled:true}")
    private boolean mxCheckEnabled;

    public DnsValidationServiceImpl() {
        this(InitialDirContext::new);
    }

    public DnsValidationServiceImpl(DirContextProvider dirContextProvider) {
        this.dirContextProvider = dirContextProvider;
    }

    @Override
    public boolean hasValidMxRecord(String email) {
        if (!mxCheckEnabled) {
            log.debug("MX check disabled via configuration; accepting email {}", email);
            return true;
        }

        if (email == null || !email.contains("@")) {
            return false;
        }

        String domain = email.substring(email.lastIndexOf('@') + 1).trim();
        if (domain.isBlank()) {
            return false;
        }

        DirContext ictx = null;
        try {
            Hashtable<String, String> env = new Hashtable<>();
            env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
            // Bound strictly to 2000ms with 0 retries to prevent HTTP request thread starvation
            env.put("com.sun.jndi.dns.timeout.initial", "2000");
            env.put("com.sun.jndi.dns.timeout.retries", "0");

            ictx = dirContextProvider.createDirContext(env);
            Attributes attrs = ictx.getAttributes(domain, new String[]{"MX"});
            Attribute attr = attrs.get("MX");

            if (attr == null || attr.size() == 0) {
                // Check if host has an A record as fallback per RFC 5321 Section 5.1
                Attributes aAttrs = ictx.getAttributes(domain, new String[]{"A"});
                Attribute aAttr = aAttrs.get("A");
                if (aAttr != null && aAttr.size() > 0) {
                    log.debug("Domain {} has A record fallback", domain);
                    return true;
                }
                log.warn("Domain {} has no MX or A DNS records configured", domain);
                return false;
            }

            log.debug("Domain {} verified with {} MX record(s)", domain, attr.size());
            return true;
        } catch (NameNotFoundException e) {
            log.warn("DNS name not found for domain [{}]: {}", domain, e.getMessage());
            return false;
        } catch (CommunicationException e) {
            // Network timeout / DNS server unreachable: fail open to avoid hanging or blocking registration
            log.warn("DNS query timed out/unreachable for domain [{}] (failing open): {}", domain, e.getMessage());
            return true;
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains("DNS name not found") || msg.contains("response code 3")) {
                log.warn("DNS name not found for domain [{}]: {}", domain, msg);
                return false;
            }
            // Timeout or unexpected resolver communication issue: fail open
            log.warn("DNS resolution failed for domain [{}] (failing open): {}", domain, msg);
            return true;
        } finally {
            if (ictx != null) {
                try {
                    ictx.close();
                } catch (Exception ignored) {
                }
            }
        }
    }
}
