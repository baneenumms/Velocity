package com.beni.repository;

import com.beni.entity.DriverApplication;
import com.beni.entity.DriverApplicationCorrection;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class DriverApplicationCorrectionRepository
        implements PanacheRepository<DriverApplicationCorrection> {

    public List<DriverApplicationCorrection> findByApplication(
            DriverApplication application
    ) {
        if (application == null) {
            return List.of();
        }

        return find(
                "application = ?1 order by correctionId asc",
                application
        ).list();
    }

    public List<DriverApplicationCorrection> findByApplicationId(
            Integer applicationId
    ) {
        if (applicationId == null) {
            return List.of();
        }

        return find(
                "application.applicationId = ?1 order by correctionId asc",
                applicationId
        ).list();
    }

    public DriverApplicationCorrection findByApplicationAndField(
            DriverApplication application,
            String fieldName
    ) {
        if (application == null || fieldName == null) {
            return null;
        }

        return find(
                "application = ?1 and fieldName = ?2",
                application,
                fieldName
        ).firstResult();
    }
}