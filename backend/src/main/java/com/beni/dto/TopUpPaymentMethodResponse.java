package com.beni.dto;

public class TopUpPaymentMethodResponse {

    public String paymentMethodCode;

    public String displayName;

    public TopUpPaymentMethodResponse() {
    }

    public TopUpPaymentMethodResponse(
            String paymentMethodCode,
            String displayName
    ) {
        this.paymentMethodCode =
                paymentMethodCode;

        this.displayName =
                displayName;
    }
}