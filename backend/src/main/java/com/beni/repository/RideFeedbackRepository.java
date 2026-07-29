package com.beni.repository;

import com.beni.entity.RideFeedback;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class RideFeedbackRepository
        implements PanacheRepository<RideFeedback> {

    public RideFeedback findExisting(
            Integer rideId,
            String role
    ) {
        return find(
                "ride.rideId = ?1 and submittedBy = ?2",
                rideId,
                role
        ).firstResult();
    }
}