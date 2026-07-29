package com.beni.repository;

import com.beni.entity.Transaction;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class TransactionRepository
        implements PanacheRepository<Transaction> {

    public Transaction findByRideAndType(
            Integer rideId,
            String type
    ) {
        return find(
                "ride.rideId = ?1 and transactionType = ?2",
                rideId,
                type
        ).firstResult();
    }
}