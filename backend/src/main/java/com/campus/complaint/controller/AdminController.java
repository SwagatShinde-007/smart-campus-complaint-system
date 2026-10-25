package com.campus.complaint.controller;

import com.campus.complaint.dto.StatusUpdateRequest;
import com.campus.complaint.model.Category;
import com.campus.complaint.model.Complaint;
import com.campus.complaint.model.Status;
import com.campus.complaint.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final ComplaintService service;

    public AdminController(ComplaintService service) {
        this.service = service;
    }

    @GetMapping("/complaints")
    public List<Complaint> all(@RequestParam(required = false) Status status,
                               @RequestParam(required = false) Category category) {
        return service.all(status, category);
    }

    @PutMapping("/complaints/{id}/status")
    public Complaint updateStatus(@PathVariable String id, @Valid @RequestBody StatusUpdateRequest request) {
        return service.updateStatus(id, request);
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return service.stats();
    }
}
