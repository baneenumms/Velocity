package com.beni.filter;

import com.beni.service.SessionService;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(Priorities.AUTHENTICATION)
public class VelocitySessionFilter implements ContainerRequestFilter {

    @Inject
    SessionService sessionService;

    @Override
    public void filter(ContainerRequestContext context) {
        String path = context.getUriInfo().getPath();
        if (!requiresVelocitySession(path)) {
            return;
        }

        sessionService.requireValidSession(
                context.getHeaderString("Authorization")
        );
    }

    private boolean requiresVelocitySession(String path) {
        return path.startsWith("ride-requests") ||
                path.startsWith("driver-offers") ||
                path.startsWith("drivers") ||
                path.startsWith("driver-rides") ||
                path.startsWith("passenger-rides") ||
                path.startsWith("driver-wallet") ||
                path.startsWith("ride-feedback") ||
                path.startsWith("auth-sessions") ||
                (path.startsWith("rides") && !path.startsWith("rides/estimate"));
    }
}
