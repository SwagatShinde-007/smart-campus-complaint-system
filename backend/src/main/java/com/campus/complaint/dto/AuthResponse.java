package com.campus.complaint.dto;

public record AuthResponse(String token, String id, String name, String email, String role) {
}
