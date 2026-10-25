package com.campus.complaint.service;

import com.campus.complaint.dto.ComplaintRequest;
import com.campus.complaint.dto.StatusUpdateRequest;
import com.campus.complaint.model.*;
import com.campus.complaint.repository.ComplaintRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ComplaintService {

    private final ComplaintRepository repo;

    public ComplaintService(ComplaintRepository repo) {
        this.repo = repo;
    }

    public Complaint create(ComplaintRequest r, User user) {
        Complaint c = new Complaint();
        c.setTitle(r.title().trim());
        c.setDescription(r.description().trim());
        c.setCategory(r.category());
        c.setPriority(r.priority());
        c.setLocation(r.location().trim());
        c.setStatus(Status.PENDING);
        c.setUserId(user.getId());
        c.setUserName(user.getName());
        c.setUserEmail(user.getEmail());
        c.setCreatedAt(Instant.now());
        c.setUpdatedAt(c.getCreatedAt());
        return repo.save(c);
    }

    public List<Complaint> mine(String userId) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Complaint get(String id, User user) {
        Complaint c = find(id);
        if (user.getRole() != Role.ADMIN && !c.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This complaint belongs to another user");
        }
        return c;
    }

    public void withdraw(String id, User user) {
        Complaint c = get(id, user);
        if (user.getRole() != Role.ADMIN && c.getStatus() != Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only pending complaints can be withdrawn");
        }
        repo.delete(c);
    }

    public List<Complaint> all(Status status, Category category) {
        return repo.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .filter(c -> status == null || c.getStatus() == status)
                .filter(c -> category == null || c.getCategory() == category)
                .toList();
    }

    public Complaint updateStatus(String id, StatusUpdateRequest r) {
        Complaint c = find(id);
        c.setStatus(r.status());
        c.setAdminRemark(r.adminRemark() == null ? null : r.adminRemark().trim());
        c.setUpdatedAt(Instant.now());
        return repo.save(c);
    }

    public Map<String, Object> stats() {
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (Status s : Status.values()) byStatus.put(s.name(), repo.countByStatus(s));

        Map<String, Long> byCategory = new LinkedHashMap<>();
        for (Category c : Category.values()) byCategory.put(c.name(), repo.countByCategory(c));

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("total", repo.count());
        out.put("byStatus", byStatus);
        out.put("byCategory", byCategory);
        return out;
    }

    private Complaint find(String id) {
        return repo.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Complaint not found"));
    }
}
