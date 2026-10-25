package com.campus.complaint.service;

import com.campus.complaint.model.PasswordResetToken;
import com.campus.complaint.model.User;
import com.campus.complaint.repository.PasswordResetTokenRepository;
import com.campus.complaint.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;

@Service
public class PasswordResetService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final long TOKEN_LIFETIME_SECONDS = 30 * 60;

    private final UserRepository users;
    private final PasswordResetTokenRepository resetTokens;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    private final String frontendUrl;
    private final String mailHost;
    private final String mailFrom;

    public PasswordResetService(UserRepository users,
                                PasswordResetTokenRepository resetTokens,
                                PasswordEncoder passwordEncoder,
                                JavaMailSender mailSender,
                                @Value("${app.frontend-url}") String frontendUrl,
                                @Value("${spring.mail.host:}") String mailHost,
                                @Value("${app.mail.from:}") String mailFrom) {
        this.users = users;
        this.resetTokens = resetTokens;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
        this.frontendUrl = frontendUrl;
        this.mailHost = mailHost;
        this.mailFrom = mailFrom;
    }

    public void requestReset(String email) {
        if (mailHost.isBlank() || mailFrom.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Password reset email is not configured. Contact the system administrator.");
        }

        users.findByEmail(email.trim().toLowerCase(Locale.ROOT))
                .ifPresent(user -> sendResetEmail(user));
    }

    public void resetPassword(String rawToken, String newPassword) {
        if (newPassword.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Password must be 72 UTF-8 bytes or fewer");
        }
        PasswordResetToken resetToken = resetTokens.findByTokenHash(hash(rawToken))
                .filter(token -> token.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "This password reset link is invalid or expired. Request a new one."));

        User user = users.findById(resetToken.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "This password reset link is invalid or expired. Request a new one."));
        resetTokens.deleteAllByUserId(user.getId());
        user.setPassword(passwordEncoder.encode(newPassword));
        users.save(user);
    }

    private void sendResetEmail(User user) {
        byte[] randomBytes = new byte[32];
        RANDOM.nextBytes(randomBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        resetTokens.deleteAllByUserId(user.getId());
        resetTokens.save(new PasswordResetToken(
                user.getId(), hash(token), Instant.now().plusSeconds(TOKEN_LIFETIME_SECONDS)));

        String resetUrl = frontendUrl.replaceAll("/+$", "") + "/index.html#reset=" + token;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(user.getEmail());
        message.setSubject("Reset your Smart Campus password");
        message.setText("Use the link below to reset your password. It expires in 30 minutes.\n\n"
                + resetUrl + "\n\nIf you did not request this, you can ignore this email.");
        try {
            mailSender.send(message);
        } catch (MailException ex) {
            resetTokens.deleteAllByUserId(user.getId());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "The password reset email could not be sent. Please try again later.", ex);
        }
    }

    private String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }
}
