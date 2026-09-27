package com.hiregenius.authservice.auth.repository;

import com.hiregenius.authservice.auth.entity.EmailVerificationToken;
import com.hiregenius.authservice.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByToken(String token);

    List<EmailVerificationToken> findByUserOrderByCreatedAtDesc(User user);

    void deleteByUser(User user);
}
