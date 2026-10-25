package com.campus.complaint.dto;

import com.campus.complaint.model.Category;
import com.campus.complaint.model.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ComplaintRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 120, message = "Title must be 120 characters or fewer") String title,
        @NotBlank(message = "Description is required")
        @Size(max = 2000, message = "Description must be 2000 characters or fewer") String description,
        @NotNull(message = "Choose a category") Category category,
        @NotNull(message = "Choose a priority") Priority priority,
        @NotBlank(message = "Location is required") String location) {
}
