package com.beni.service;

import jakarta.enterprise.context.ApplicationScoped;

import java.util.HashMap;
import java.util.Map;

@ApplicationScoped
public class OTPStorageService {

    private final Map<String, String> otpStorage = new HashMap<>();

    public void saveOTP(String email, String otp) {

        System.out.println("========== SAVE OTP ==========");
        System.out.println("Email key: " + email);
        System.out.println("OTP value: " + otp);
        System.out.println("==============================");

        otpStorage.put(email, otp);
    }


    public boolean verifyOTP(String email, String enteredOTP) {

        String storedOTP = otpStorage.get(email);

        System.out.println("========== VERIFY OTP ==========");
        System.out.println("Email key: " + email);
        System.out.println("Stored OTP: " + storedOTP);
        System.out.println("Entered OTP: " + enteredOTP);
        System.out.println("===============================");

        return storedOTP != null && storedOTP.equals(enteredOTP);
    }


    public void removeOTP(String email) {

        System.out.println("Removing OTP for: " + email);

        otpStorage.remove(email);
    }
}