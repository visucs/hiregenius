package com.hiregenius.authservice.auth.controller;

import com.hiregenius.authservice.auth.dto.request.UpdateUserStatusRequest;
import com.hiregenius.authservice.auth.dto.response.AdminUserResponse;
import com.hiregenius.authservice.auth.entity.Role;
import com.hiregenius.authservice.auth.service.AdminUserService;
import com.hiregenius.authservice.common.ApiResponse;
import com.hiregenius.authservice.common.PageResponse;
import com.hiregenius.authservice.security.SecurityUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/admin/users", "/admin/users"})
@Tag(name = "Admin User Management", description = "Endpoints for administrator user management and account status toggling")
@SecurityRequirement(name = "bearerAuth")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get paginated user list with filters (ADMIN only)")
    public ResponseEntity<ApiResponse<PageResponse<AdminUserResponse>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search
    ) {
        Role roleEnum = null;
        if (role != null && !role.trim().isEmpty()) {
            try {
                roleEnum = Role.valueOf(role.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Invalid role filter: " + role);
            }
        }

        PageResponse<AdminUserResponse> result = adminUserService.getUsers(page, size, roleEnum, active, search);
        return ResponseEntity.ok(ApiResponse.ok("Users retrieved successfully", result));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update user active status (ADMIN only)")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            @AuthenticationPrincipal SecurityUser currentAdmin
    ) {
        AdminUserResponse updatedUser = adminUserService.updateUserStatus(id, request.getActive(), currentAdmin);
        String action = request.getActive() ? "enabled" : "disabled";
        return ResponseEntity.ok(ApiResponse.ok("User account " + action + " successfully", updatedUser));
    }
}
