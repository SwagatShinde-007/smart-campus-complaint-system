package com.campus.complaint.controller;

import com.campus.complaint.dto.ComplaintRequest;
import com.campus.complaint.model.Complaint;
import com.campus.complaint.model.User;
import com.campus.complaint.repository.UserRepository;
import com.campus.complaint.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService service;
    private final UserRepository users;

    public ComplaintController(ComplaintService service, UserRepository users) {
        this.service = service;
        this.users = users;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Complaint create(@Valid @RequestBody ComplaintRequest request, Authentication auth) {
        return service.create(request, current(auth));
    }

    @GetMapping("/my")
    public List<Complaint> mine(Authentication auth) {
        return service.mine(current(auth).getId());
    }

    @GetMapping("/{id}")
    public Complaint get(@PathVariable String id, Authentication auth) {
        return service.get(id, current(auth));
    }

    @DeleteMapping("/{id}")
    public Map<String, String> withdraw(@PathVariable String id, Authentication auth) {
        service.withdraw(id, current(auth));
        return Map.of("message", "Complaint withdrawn");
    }

    private User current(Authentication auth) {
        return users.findByEmail(auth.getName()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account no longer exists"));
    }
}
