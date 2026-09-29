package com.hiregenius.authservice.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

public class UpdateUserPrivilegesRequest {

    @Schema(description = "Enable or disable job posting privilege (Recruiter only)", example = "true")
    private Boolean canPostJobs;

    @Schema(description = "Enable or disable job application privilege (Candidate only)", example = "true")
    private Boolean canApplyToJobs;

    public UpdateUserPrivilegesRequest() {
    }

    public UpdateUserPrivilegesRequest(Boolean canPostJobs, Boolean canApplyToJobs) {
        this.canPostJobs = canPostJobs;
        this.canApplyToJobs = canApplyToJobs;
    }

    public Boolean getCanPostJobs() {
        return canPostJobs;
    }

    public void setCanPostJobs(Boolean canPostJobs) {
        this.canPostJobs = canPostJobs;
    }

    public Boolean getCanApplyToJobs() {
        return canApplyToJobs;
    }

    public void setCanApplyToJobs(Boolean canApplyToJobs) {
        this.canApplyToJobs = canApplyToJobs;
    }
}
