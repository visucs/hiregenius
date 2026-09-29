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
    private final EmailService emailService;

    public AdminUserServiceImpl(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> getUsers(int page, int size, Role role, Boolean active, String search, Boolean pendingApproval) {
        int validatedPage = Math.max(page, 0);
        int validatedSize = Math.min(Math.max(size, 1), 100);

        Pageable pageable = PageRequest.of(validatedPage, validatedSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (pendingApproval != null && pendingApproval) {
                predicates.add(cb.equal(root.get("role"), Role.RECRUITER));
                predicates.add(cb.equal(root.get("emailVerified"), true));
                predicates.add(cb.equal(root.get("adminApproved"), false));
            } else if (role != null) {
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

    @Override
    @Transactional
    public AdminUserResponse approveRecruiter(Long targetUserId, SecurityUser currentAdmin) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + targetUserId));

        if (targetUser.getRole() != Role.RECRUITER) {
            throw new IllegalArgumentException("Admin approval is only applicable to recruiter accounts");
        }

        targetUser.setAdminApproved(true);
        User savedUser = userRepository.save(targetUser);

        log.info("Admin [id={}] approved recruiter [id={}, email={}]",
                currentAdmin != null ? currentAdmin.getId() : "system",
                savedUser.getId(), savedUser.getEmail());

        emailService.sendRecruiterApprovalEmail(savedUser.getEmail(), savedUser.getName());

        return AdminUserResponse.fromEntity(savedUser);
    }

    @Override
    @Transactional
    public AdminUserResponse updateUserPrivileges(Long targetUserId, Boolean canPostJobs, Boolean canApplyToJobs, SecurityUser currentAdmin) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + targetUserId));

        if (targetUser.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Cannot modify privileges of administrator accounts");
        }

        if (targetUser.getRole() == Role.RECRUITER && canPostJobs != null) {
            targetUser.setCanPostJobs(canPostJobs);
            log.info("Admin [id={}] updated recruiter [id={}, email={}] canPostJobs to {}",
                    currentAdmin != null ? currentAdmin.getId() : "system",
                    targetUser.getId(), targetUser.getEmail(), canPostJobs);
        }

        if (targetUser.getRole() == Role.CANDIDATE && canApplyToJobs != null) {
            targetUser.setCanApplyToJobs(canApplyToJobs);
            log.info("Admin [id={}] updated candidate [id={}, email={}] canApplyToJobs to {}",
                    currentAdmin != null ? currentAdmin.getId() : "system",
                    targetUser.getId(), targetUser.getEmail(), canApplyToJobs);
        }

        User savedUser = userRepository.save(targetUser);
        return AdminUserResponse.fromEntity(savedUser);
    }
}
