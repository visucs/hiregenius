package com.hiregenius.authservice.auth.service;

import com.hiregenius.authservice.auth.dto.response.AdminUserResponse;
import com.hiregenius.authservice.auth.entity.Role;
import com.hiregenius.authservice.auth.entity.User;
import com.hiregenius.authservice.auth.repository.UserRepository;
import com.hiregenius.authservice.common.PageResponse;
import com.hiregenius.authservice.security.SecurityUser;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class AdminUserServiceImpl implements AdminUserService {

    private static final Logger log = LoggerFactory.getLogger(AdminUserServiceImpl.class);

    private final UserRepository userRepository;

    public AdminUserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> getUsers(int page, int size, Role role, Boolean active, String search) {
        int validatedPage = Math.max(page, 0);
        int validatedSize = Math.min(Math.max(size, 1), 100);

        Pageable pageable = PageRequest.of(validatedPage, validatedSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }

            if (active != null) {
                predicates.add(cb.equal(root.get("isActive"), active));
            }

            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), searchPattern);
                Predicate emailMatch = cb.like(cb.lower(root.get("email")), searchPattern);
                predicates.add(cb.or(nameMatch, emailMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<User> usersPage = userRepository.findAll(spec, pageable);
        Page<AdminUserResponse> mappedPage = usersPage.map(AdminUserResponse::fromEntity);

        return PageResponse.fromPage(mappedPage);
    }

    @Override
    @Transactional
    public AdminUserResponse updateUserStatus(Long targetUserId, boolean active, SecurityUser currentAdmin) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + targetUserId));

        // 1. Guard: Admin cannot disable their own account
        if (currentAdmin != null && targetUserId.equals(currentAdmin.getId())) {
            log.warn("Admin [id={}] attempted to modify their own active status", currentAdmin.getId());
            throw new IllegalArgumentException("Administrators cannot change the active status of their own account");
        }

        // 2. Guard: Admin cannot disable another admin account
        if (targetUser.getRole() == Role.ADMIN) {
            log.warn("Admin [id={}] attempted to modify active status of another admin [id={}]",
                    currentAdmin != null ? currentAdmin.getId() : "unknown", targetUserId);
            throw new IllegalArgumentException("Cannot modify the active status of another administrator account");
        }

        targetUser.setActive(active);
        User savedUser = userRepository.save(targetUser);

        log.info("Admin [id={}] updated user [id={}, email={}] active status to {}",
                currentAdmin != null ? currentAdmin.getId() : "system",
                savedUser.getId(), savedUser.getEmail(), active);

        return AdminUserResponse.fromEntity(savedUser);
    }
}
