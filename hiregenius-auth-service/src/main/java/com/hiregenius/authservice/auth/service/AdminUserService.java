package com.hiregenius.authservice.auth.service;

import com.hiregenius.authservice.auth.dto.response.AdminUserResponse;
import com.hiregenius.authservice.auth.entity.Role;
import com.hiregenius.authservice.common.PageResponse;
import com.hiregenius.authservice.security.SecurityUser;

public interface AdminUserService {

    PageResponse<AdminUserResponse> getUsers(int page, int size, Role role, Boolean active, String search);

    AdminUserResponse updateUserStatus(Long targetUserId, boolean active, SecurityUser currentAdmin);
}
