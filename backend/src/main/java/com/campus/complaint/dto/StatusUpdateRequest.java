package com.campus.complaint.dto;

import com.campus.complaint.model.Status;
import jakarta.validation.constraints.NotNull;

public record StatusUpdateRequest(
        @NotNull(message = "Status is required") Status status,
        String adminRemark) {
}
