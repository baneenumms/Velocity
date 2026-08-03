package com.beni.service;

import jakarta.enterprise.context.ApplicationScoped;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@ApplicationScoped
public class PasswordService {

    private static final String PREFIX = "pbkdf2_sha256";
    private static final int ITERATIONS = 210_000;
    private static final int SALT_LENGTH = 16;
    private static final int HASH_LENGTH_BITS = 256;

    private final SecureRandom secureRandom = new SecureRandom();

    public String hashPassword(String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }

        byte[] salt = new byte[SALT_LENGTH];
        secureRandom.nextBytes(salt);

        byte[] hash = deriveHash(
                rawPassword.toCharArray(),
                salt,
                ITERATIONS
        );

        return PREFIX
                + "$" + ITERATIONS
                + "$" + Base64.getEncoder().withoutPadding()
                .encodeToString(salt)
                + "$" + Base64.getEncoder().withoutPadding()
                .encodeToString(hash);
    }

    public boolean matches(
            String rawPassword,
            String storedPassword
    ) {
        if (rawPassword == null || storedPassword == null) {
            return false;
        }

        if (!isHashed(storedPassword)) {
            return MessageDigest.isEqual(
                    rawPassword.getBytes(StandardCharsets.UTF_8),
                    storedPassword.getBytes(StandardCharsets.UTF_8)
            );
        }

        try {
            String[] parts = storedPassword.split("\\$");

            if (parts.length != 4) {
                return false;
            }

            int iterations = Integer.parseInt(parts[1]);
            byte[] salt = Base64.getDecoder().decode(parts[2]);
            byte[] expectedHash =
                    Base64.getDecoder().decode(parts[3]);

            byte[] actualHash = deriveHash(
                    rawPassword.toCharArray(),
                    salt,
                    iterations
            );

            return MessageDigest.isEqual(
                    expectedHash,
                    actualHash
            );
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    public boolean isHashed(String storedPassword) {
        return storedPassword != null
                && storedPassword.startsWith(PREFIX + "$");
    }

    private byte[] deriveHash(
            char[] password,
            byte[] salt,
            int iterations
    ) {
        PBEKeySpec specification = new PBEKeySpec(
                password,
                salt,
                iterations,
                HASH_LENGTH_BITS
        );

        try {
            SecretKeyFactory factory =
                    SecretKeyFactory.getInstance(
                            "PBKDF2WithHmacSHA256"
                    );

            return factory.generateSecret(specification).getEncoded();
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException(
                    "Password hashing is unavailable",
                    exception
            );
        } finally {
            specification.clearPassword();
        }
    }
}