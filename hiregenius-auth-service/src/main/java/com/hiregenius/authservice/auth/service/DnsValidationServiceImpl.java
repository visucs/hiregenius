package com.hiregenius.authservice.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

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
            env.put("com.sun.jndi.dns.timeout.initial", "3000");
            env.put("com.sun.jndi.dns.timeout.retries", "1");

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
        } catch (Exception e) {
            log.warn("DNS lookup failed for domain [{}]: {}", domain, e.getMessage());
            return false;
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
