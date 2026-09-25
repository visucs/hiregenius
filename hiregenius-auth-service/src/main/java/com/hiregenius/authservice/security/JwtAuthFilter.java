package com.hiregenius.authservice.security;

import com.hiregenius.authservice.auth.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthFilter(JwtService jwtService, CustomUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    private boolean isPublicAuthPath(String path) {
        if (path == null) {
            return false;
        }
        String normalized = (path.endsWith("/") && path.length() > 1)
                ? path.substring(0, path.length() - 1)
                : path;

        return normalized.equals("/api/auth/login") || normalized.equals("/auth/login")
                || normalized.equals("/api/auth/register") || normalized.equals("/auth/register")
                || normalized.equals("/api/auth/signup") || normalized.equals("/auth/signup")
                || normalized.equals("/api/auth/google-login") || normalized.equals("/auth/google-login")
                || normalized.equals("/api/auth/forgot-password") || normalized.equals("/auth/forgot-password")
                || normalized.equals("/api/auth/reset-password") || normalized.equals("/auth/reset-password")
                || normalized.equals("/health")
                || normalized.startsWith("/swagger-ui")
                || normalized.startsWith("/v3/api-docs");
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        final String path = request.getServletPath();

        // Explicitly bypass JWT processing for public authentication & doc endpoints
        if (isPublicAuthPath(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        try {
            final String userEmail = jwtService.extractEmail(jwt);

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception ignored) {
            // Unauthenticated or invalid token; filter chain continues to SecurityConfig authorization rules
        }

        filterChain.doFilter(request, response);
    }
}
