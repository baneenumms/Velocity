package com.beni.service;

import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class EmailService {

    @Inject
    Mailer mailer;


    public void sendOTPEmail(String toEmail, String otp) {

        Mail mail = Mail.withText(
                toEmail,
                "Driver OTP Verification",
                "Your OTP is: " + otp +
                        "\n\nThis OTP will expire in 5 minutes."
        );

        mailer.send(mail);
    }
}