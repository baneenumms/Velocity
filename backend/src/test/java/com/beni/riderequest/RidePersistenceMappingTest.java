package com.beni.riderequest;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class RidePersistenceMappingTest {

    @Test
    void mapsRideRequestsToTheirDeploymentTable() throws Exception {
        assertEntityMapping(
                RideRequest.class,
                "ride_requests",
                "requestId"
        );
    }

    @Test
    void mapsDriverOffersToTheirDeploymentTable() throws Exception {
        assertEntityMapping(
                DriverOffer.class,
                "driver_offers",
                "offerId"
        );
    }

    private void assertEntityMapping(
            Class<?> entityType,
            String tableName,
            String idFieldName
    ) throws Exception {
        assertNotNull(
                entityType.getAnnotation(Entity.class)
        );

        Table table =
                entityType.getAnnotation(Table.class);

        assertNotNull(table);
        assertEquals(tableName, table.name());

        Field idField =
                entityType.getField(idFieldName);

        assertNotNull(idField.getAnnotation(Id.class));

        Field versionField =
                entityType.getField("version");

        assertNotNull(
                versionField.getAnnotation(Version.class)
        );
        assertNotNull(
                versionField.getAnnotation(JsonIgnore.class)
        );
    }
}
