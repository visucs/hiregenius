package com.hiregenius.authservice.auth.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.hiregenius.authservice.exception.InvalidGoogleTokenException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class GoogleAuthService {

    private static final Logger log = LoggerFactory.getLogger(GoogleAuthService.class);

    public record FirebaseUserInfo(String uid, String email, String name) {
    }

    /**
     * Verifies the Firebase ID token using the Firebase Admin SDK.
     * Note: Never logs the raw ID token in full per security guidelines.
     *
     * @param idToken the Firebase ID token received from the client
     * @return verified FirebaseUserInfo containing email, name, and uid
     * @throws InvalidGoogleTokenException if verification fails or token is expired/invalid
     */
    public FirebaseUserInfo verifyIdToken(String idToken) {
        if (idToken == null || idToken.trim().isEmpty()) {
            log.warn("Firebase ID token verification failed: Token is null or empty");
            throw new InvalidGoogleTokenException("Firebase ID token is required");
        }

        // Support stub/mock token for local development/testing
        if (idToken.startsWith("mock-google-token:")) {
            String[] parts = idToken.split(":", 3);
            String email = parts.length > 1 && !parts[1].isBlank() ? parts[1] : "google-dev@hiregenius.ai";
            String name = parts.length > 2 && !parts[2].isBlank() ? parts[2] : "Google Test User";
            log.info("Using mock Google token for development/testing: email={}", email);
            return new FirebaseUserInfo("mock-google-uid-" + Math.abs(email.hashCode()), email, name);
        }

        // Check if Firebase is initialized
        if (FirebaseApp.getApps().isEmpty()) {
            log.warn("FirebaseApp is not initialized with valid service account credentials.");
            throw new InvalidGoogleTokenException("Firebase service is currently unconfigured");
        }

        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String email = decodedToken.getEmail();
            String name = decodedToken.getName();
            String uid = decodedToken.getUid();

            if (email == null || email.trim().isEmpty()) {
                log.warn("Firebase ID token verification failed: No verified email in token");
                throw new InvalidGoogleTokenException("No verified email associated with Google account");
            }

            log.info("Firebase ID token successfully verified for email: {}", email);
            return new FirebaseUserInfo(uid, email, name);
        } catch (Exception e) {
            log.warn("Firebase ID token verification failed: {}", e.getMessage());
            throw new InvalidGoogleTokenException("Invalid or expired Google authentication token: " + e.getMessage(), e);
        }
    }
}
