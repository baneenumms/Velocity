package com.beni.service;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.Random;

@ApplicationScoped
public class OTPService {

    public String generateOTP() {

        Random random = new Random();

        int otp = 100000 + random.nextInt(900000);

        return String.valueOf(otp);
    }
}