package com.campus.complaint.controller;

import com.campus.complaint.dto.AuthResponse;
import com.campus.complaint.dto.LoginRequest;
import com.campus.complaint.dto.RegisterRequest;
import com.campus.complaint.model.Role;
import com.campus.complaint.model.User;
import com.campus.complaint.repository.UserRepository;
import com.campus.complaint.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtUtil jwt;
    private final String adminRegistrationCode;

    public AuthController(UserRepository users, PasswordEncoder encoder, JwtUtil jwt,
                          @Value("${app.admin.registration-code:}") String adminRegistrationCode) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.adminRegistrationCode = adminRegistrationCode;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest r) {
        String email = r.email().trim().toLowerCase();
        if (users.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        Role role = registrationRole(r);
        User user = users.save(User.builder()
                .name(r.name().trim())
                .email(email)
                .password(encoder.encode(r.password()))
                .role(role)
                .department(r.department() == null ? "" : r.department().trim())
                .createdAt(Instant.now())
                .build());
        return toResponse(user);
    }

    private Role registrationRole(RegisterRequest request) {
        String requestedRole = request.role();
        if (requestedRole == null || requestedRole.isBlank()
                || Role.STUDENT.name().equalsIgnoreCase(requestedRole)) {
            return Role.STUDENT;
        }
        if (!Role.ADMIN.name().equalsIgnoreCase(requestedRole)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be STUDENT or ADMIN");
        }

        String configuredCode = adminRegistrationCode == null ? "" : adminRegistrationCode.trim();
        String suppliedCode = request.adminCode() == null ? "" : request.adminCode().trim();
        if (configuredCode.isBlank() || !MessageDigest.isEqual(
                configuredCode.getBytes(StandardCharsets.UTF_8),
                suppliedCode.getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "A valid admin registration code is required");
        }
        return Role.ADMIN;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest r) {
        User user = users.findByEmail(r.email().trim().toLowerCase())
                .filter(u -> encoder.matches(r.password(), u.getPassword()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        return toResponse(user);
    }

    private AuthResponse toResponse(User u) {
        return new AuthResponse(jwt.generate(u), u.getId(), u.getName(), u.getEmail(), u.getRole().name());
    }
}
