package com.hiregenius.authservice.auth.repository;

import com.hiregenius.authservice.auth.entity.EmailOtp;
import com.hiregenius.authservice.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {

    List<EmailOtp> findByUserAndPurposeOrderByCreatedAtDesc(User user, String purpose);

    List<EmailOtp> findByUserOrderByCreatedAtDesc(User user);
}
