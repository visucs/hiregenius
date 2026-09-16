package com.hiregenius.authservice.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@Tag(name = "Health", description = "Public health and service availability monitoring")
public class HealthController {

    @GetMapping("/health")
    @Operation(
            summary = "Health check endpoint",
            description = "Public endpoint, does not require authentication.",
            tags = {"Authentication", "Health"}
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Service is operational",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(
                                    name = "Health Status",
                                    value = "{\n  \"service\": \"auth-service\",\n  \"status\": \"UP\"\n}"
                            )
                    )
            )
    })
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "auth-service"));
    }
}
