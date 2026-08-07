package com.beni.resource;

import com.beni.dto.AdminRejectWalletTopUpRequest;
import com.beni.dto.AdminWalletTopUpResponse;
import com.beni.entity.User;
import com.beni.service.AdminSessionService;
import com.beni.service.AdminWalletTopUpService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/admin/wallet-top-ups")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AdminWalletTopUpResource {

    @Inject
    AdminSessionService
            adminSessionService;

    @Inject
    AdminWalletTopUpService
            walletTopUpService;

    @GET
    public List<AdminWalletTopUpResponse>
    listRequests(
            @HeaderParam("Authorization")
            String authorizationHeader,

            @QueryParam("status")
            String status
    ) {
        User admin =
                adminSessionService
                        .requireAdmin(
                                authorizationHeader
                        );

        return walletTopUpService
                .listRequests(
                        status,
                        admin
                );
    }

    @GET
    @Path("/{topUpRequestId}")
    public AdminWalletTopUpResponse
    getRequest(
            @HeaderParam("Authorization")
            String authorizationHeader,

            @PathParam("topUpRequestId")
            Integer topUpRequestId
    ) {
        User admin =
                adminSessionService
                        .requireAdmin(
                                authorizationHeader
                        );

        return walletTopUpService
                .getRequest(
                        topUpRequestId,
                        admin
                );
    }

    @POST
    @Path("/{topUpRequestId}/approve")
    public AdminWalletTopUpResponse
    approve(
            @HeaderParam("Authorization")
            String authorizationHeader,

            @PathParam("topUpRequestId")
            Integer topUpRequestId
    ) {
        User admin =
                adminSessionService
                        .requireAdmin(
                                authorizationHeader
                        );

        return walletTopUpService
                .approve(
                        topUpRequestId,
                        admin
                );
    }

    @POST
    @Path("/{topUpRequestId}/reject")
    public AdminWalletTopUpResponse
    reject(
            @HeaderParam("Authorization")
            String authorizationHeader,

            @PathParam("topUpRequestId")
            Integer topUpRequestId,

            AdminRejectWalletTopUpRequest request
    ) {
        User admin =
                adminSessionService
                        .requireAdmin(
                                authorizationHeader
                        );

        return walletTopUpService
                .reject(
                        topUpRequestId,
                        request,
                        admin
                );
    }
}