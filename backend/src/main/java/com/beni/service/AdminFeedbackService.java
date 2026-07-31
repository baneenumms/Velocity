package com.beni.service;

import com.beni.dto.AdminFeedbackResponse;
import com.beni.entity.RideFeedback;
import com.beni.entity.User;
import com.beni.repository.RideFeedbackRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;

import java.util.List;

@ApplicationScoped
public class AdminFeedbackService {

    @Inject
    RideFeedbackRepository
            feedbackRepository;

    @Transactional
    public List<AdminFeedbackResponse>
    getAllFeedback() {
        return feedbackRepository
                .find(
                        "order by createdAt desc"
                )
                .list()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AdminFeedbackResponse
    getFeedback(
            Integer feedbackId
    ) {
        if (
                feedbackId == null ||
                        feedbackId <= 0
        ) {
            throw new WebApplicationException(
                    "Valid feedback ID is required.",
                    400
            );
        }

        RideFeedback feedback =
                feedbackRepository.findById(
                        feedbackId.longValue()
                );

        if (feedback == null) {
            throw new WebApplicationException(
                    "Feedback was not found.",
                    404
            );
        }

        return toResponse(feedback);
    }

    private AdminFeedbackResponse
    toResponse(
            RideFeedback feedback
    ) {
        AdminFeedbackResponse response =
                new AdminFeedbackResponse();

        response.feedbackId =
                feedback.feedbackId;

        response.submittedBy =
                feedback.submittedBy;

        response.rating =
                feedback.rating;

        response.comment =
                feedback.comment;

        response.reportCategory =
                feedback.reportCategory;

        response.createdAt =
                feedback.createdAt;

        if (feedback.ride != null) {
            response.rideId =
                    feedback.ride.rideId;

            response.rideStatus =
                    feedback.ride.rideStatus ==
                            null
                            ? null
                            : feedback.ride
                            .rideStatus
                            .name();

            if (
                    feedback.ride.passenger !=
                            null
            ) {
                response.passengerId =
                        feedback.ride
                                .passenger
                                .passengerId;

                User passengerUser =
                        feedback.ride
                                .passenger
                                .user;

                if (passengerUser != null) {
                    response.passengerUserId =
                            passengerUser.userId;

                    response.passengerName =
                            passengerUser.fullName;

                    response.passengerAccountStatus =
                            status(
                                    passengerUser
                            );
                }
            }

            if (
                    feedback.ride.driver !=
                            null
            ) {
                response.driverId =
                        feedback.ride
                                .driver
                                .driverId;

                User driverUser =
                        feedback.ride
                                .driver
                                .user;

                if (driverUser != null) {
                    response.driverUserId =
                            driverUser.userId;

                    response.driverName =
                            driverUser.fullName;

                    response.driverAccountStatus =
                            status(
                                    driverUser
                            );
                }
            }
        }

        return response;
    }

    private String status(
            User user
    ) {
        if (
                user.accountStatus == null ||
                        user.accountStatus
                                .isBlank()
        ) {
            return "ACTIVE";
        }

        return user.accountStatus;
    }
}