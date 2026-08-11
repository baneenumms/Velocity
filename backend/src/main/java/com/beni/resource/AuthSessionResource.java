package com.beni.resource;

import com.beni.entity.AuthSession;
import com.beni.service.SessionService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.Map;

@Path("/auth-sessions")
@Produces(MediaType.APPLICATION_JSON)
public class AuthSessionResource {

    @Inject
    SessionService sessionService;

    @GET
    @Path("/current")
    public Map<String, Object> current(
            @HeaderParam("Authorization") String authorization
    ) {
        AuthSession session = sessionService.requireValidSession(authorization);
        return Map.of(
                "activeMode", session.activeMode,
                "expiresAt", session.expiresAt.toString()
        );
    }

    @DELETE
    @Path("/current")
    public void logout(
            @HeaderParam("Authorization") String authorization
    ) {
        sessionService.revokeCurrentSession(authorization);
    }
}
