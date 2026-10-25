package com.campus.complaint.repository;

import com.campus.complaint.model.Category;
import com.campus.complaint.model.Complaint;
import com.campus.complaint.model.Status;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ComplaintRepository extends MongoRepository<Complaint, String> {
    List<Complaint> findByUserIdOrderByCreatedAtDesc(String userId);
    long countByStatus(Status status);
    long countByCategory(Category category);
}
