package com.hiregenius.authservice.auth.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public class UpdateUserStatusRequest {

    @NotNull(message = "isActive is required")
    @JsonProperty("isActive")
    private Boolean active;

    public UpdateUserStatusRequest() {
    }

    public UpdateUserStatusRequest(Boolean active) {
        this.active = active;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
