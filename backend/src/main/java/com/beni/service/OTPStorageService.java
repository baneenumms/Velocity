package com.beni.service;

import com.beni.entity.OtpCode;
import com.beni.entity.User;
import com.beni.repository.OtpCodeRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

@ApplicationScoped
public class OTPStorageService {

    private static final int EXPIRY_MINUTES = 10;

    @Inject
    OtpCodeRepository otpCodeRepository;

    @Inject
    PasswordService passwordService;

    @Transactional
    public void saveOTP(
            User user,
            String email,
            String purpose,
            String otp
    ) {
        String normalizedEmail = normalizeEmail(email);
        String normalizedPurpose = normalizePurpose(purpose);

        requireOtp(otp);

        otpCodeRepository.expireActive(
                normalizedEmail,
                normalizedPurpose
        );

        OtpCode record = new OtpCode();
        record.user = user;
        record.recipientEmail = normalizedEmail;
        record.purpose = normalizedPurpose;
        record.otpHash = passwordService.hashPassword(otp);
        record.status = "ACTIVE";
        record.createdAt = LocalDateTime.now();
        record.expiresAt = record.createdAt.plusMinutes(EXPIRY_MINUTES);

        otpCodeRepository.persist(record);
    }

    @Transactional
    public boolean consumeOTP(
            String email,
            String purpose,
            String enteredOtp
    ) {
        String normalizedEmail = normalizeEmail(email);
        String normalizedPurpose = normalizePurpose(purpose);

        OtpCode record = otpCodeRepository.findLatestActive(
                normalizedEmail,
                normalizedPurpose
        );

        if (record == null) {
            return false;
        }

        if (!record.expiresAt.isAfter(LocalDateTime.now())) {
            record.status = "EXPIRED";
            return false;
        }

        if (!passwordService.matches(enteredOtp, record.otpHash)) {
            return false;
        }

        record.status = "USED";
        record.usedAt = LocalDateTime.now();
        return true;
    }

    @Transactional
    public void linkLatestOtpToUser(
            String email,
            String purpose,
            User user
    ) {
        OtpCode record = otpCodeRepository.findLatest(
                normalizeEmail(email),
                normalizePurpose(purpose)
        );

        if (record != null && "USED".equals(record.status)) {
            record.user = user;
        }
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizePurpose(String purpose) {
        if (purpose == null || purpose.isBlank()) {
            throw new IllegalArgumentException("OTP purpose is required");
        }
        return purpose.trim().toUpperCase(Locale.ROOT);
    }

    private void requireOtp(String otp) {
        if (otp == null || !otp.matches("\\d{6}")) {
            throw new IllegalArgumentException("A valid 6-digit OTP is required");
        }
    }
}
