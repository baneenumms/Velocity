package com.beni.resource;

import com.beni.dto.AccountStatusResponse;
import com.beni.dto.AccountSuspensionRequest;
import com.beni.entity.User;
import com.beni.service.AdminAccountService;
import com.beni.service.AdminSessionService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/admin/users")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AdminAccountResource {

    @Inject
    AdminSessionService
            adminSessionService;

    @Inject
    AdminAccountService
            adminAccountService;

    @POST
    @Path("/{userId}/suspend")
    public AccountStatusResponse suspend(
            @HeaderParam("Authorization")
            String authorization,

            @PathParam("userId")
            Integer userId,

            AccountSuspensionRequest request
    ) {
        User admin =
                adminSessionService
                        .requireAdmin(
                                authorization
                        );

        return adminAccountService.suspend(
                userId,
                request,
                admin
        );
    }

    @POST
    @Path("/{userId}/reactivate")
    public AccountStatusResponse reactivate(
            @HeaderParam("Authorization")
            String authorization,

            @PathParam("userId")
            Integer userId
    ) {
        User admin =
                adminSessionService
                        .requireAdmin(
                                authorization
                        );

        return adminAccountService
                .reactivate(
                        userId,
                        admin
                );
    }
}