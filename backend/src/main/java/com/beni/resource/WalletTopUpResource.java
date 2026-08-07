package com.beni.resource;

import com.beni.dto.CreateWalletTopUpRequest;
import com.beni.dto.DriverWalletSummaryResponse;
import com.beni.dto.TopUpPaymentMethodResponse;
import com.beni.dto.WalletTopUpResponse;
import com.beni.service.WalletTopUpService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/driver-wallet")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class WalletTopUpResource {

    @Inject
    WalletTopUpService walletTopUpService;

    @GET
    @Path("/{driverId}")
    public DriverWalletSummaryResponse
    getWalletSummary(
            @PathParam("driverId")
            Integer driverId
    ) {
        return walletTopUpService
                .getWalletSummary(driverId);
    }

    @GET
    @Path("/payment-methods")
    public List<TopUpPaymentMethodResponse>
    getPaymentMethods() {
        return walletTopUpService
                .listPaymentMethods();
    }

    @POST
    @Path("/{driverId}/top-ups")
    public Response createTopUp(
            @PathParam("driverId")
            Integer driverId,
            CreateWalletTopUpRequest request
    ) {
        WalletTopUpResponse response =
                walletTopUpService.createTopUp(
                        driverId,
                        request
                );

        return Response
                .status(Response.Status.CREATED)
                .entity(response)
                .build();
    }

    @GET
    @Path("/{driverId}/top-ups")
    public List<WalletTopUpResponse>
    getDriverTopUps(
            @PathParam("driverId")
            Integer driverId
    ) {
        return walletTopUpService
                .listDriverTopUps(driverId);
    }
}