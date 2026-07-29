package com.beni.scheduler;

import com.beni.entity.Ride;
import com.beni.entity.RideStatus;
import com.beni.repository.RideRepository;
import com.beni.service.RideService;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class PlatformFeeScheduler {

    @Inject
    RideRepository rideRepository;

    @Inject
    RideService rideService;

    /*
     * Runs every minute and deducts the reserved
     * 12% after the estimated journey duration
     * plus the 10-minute grace period.
     */
    @Scheduled(
            every = "60s",
            delayed = "10s"
    )
    void deductDuePlatformFees() {
        LocalDateTime now =
                LocalDateTime.now();

        List<Ride> dueRides =
                rideRepository.find(
                        "feeDeductionDueAt is not null " +
                                "and feeDeductionDueAt <= ?1 " +
                                "and (" +
                                "platformFeeDeducted is null " +
                                "or platformFeeDeducted = false" +
                                ") " +
                                "and (" +
                                "rideStatus = ?2 " +
                                "or rideStatus = ?3" +
                                ")",
                        now,
                        RideStatus.IN_PROGRESS,
                        RideStatus.COMPLETED
                ).list();

        for (Ride ride : dueRides) {
            try {
                rideService
                        .deductScheduledPlatformFee(
                                ride.rideId
                        );
            } catch (Exception error) {
                System.err.println(
                        "Platform fee deduction failed for ride " +
                                ride.rideId +
                                ": " +
                                error.getMessage()
                );
            }
        }
    }
}
