package com.beni.dto;

import java.util.ArrayList;
import java.util.List;

public class AdminDeclineDriverApplicationRequest {

    public String reviewSummary;

    public List<AdminApplicationCorrectionRequest> corrections =
            new ArrayList<>();

    public Boolean suspendAccount = false;

    public String suspensionReason;
}