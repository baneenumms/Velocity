package com.beni.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class EmailService {

    @Inject
    ObjectMapper objectMapper;

    @ConfigProperty(name = "brevo.api.key")
    String brevoApiKey;

    @ConfigProperty(name = "brevo.api.url")
    String brevoApiUrl;

    @ConfigProperty(name = "velocity.mail.from")
    String fromEmail;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    public void sendOTPEmail(String toEmail, String otp) {

        Map<String, Object> payload = Map.of(
                "sender", Map.of(
                        "email", fromEmail,
                        "name", "Velocity"
                ),
                "to", List.of(
                        Map.of("email", toEmail)
                ),
                "subject", "Driver OTP Verification",
                "textContent",
                "Your OTP is: " + otp +
                        "\n\nThis OTP will expire in 5 minutes."
        );

        try {
            String requestBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(brevoApiUrl))
                    .header("api-key", brevoApiKey)
                    .header("Accept", "application/json")
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(
                            requestBody,
                            StandardCharsets.UTF_8
                    ))
                    .build();

            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
            );

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException(
                        "Unable to send verification email. Brevo returned HTTP "
                                + response.statusCode()
                );
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(
                    "Unable to send verification email",
                    e
            );
        } catch (IOException e) {
            throw new IllegalStateException(
                    "Unable to send verification email",
                    e
            );
        }
    }
}
