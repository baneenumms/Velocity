package com.beni.service;

import jakarta.ws.rs.WebApplicationException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;

class VehicleCatalogServiceTest {

    private final VehicleCatalogService service =
            new VehicleCatalogService();

    @Test
    void returnsSearchableHondaAndHyundaiMakes() {
        var options = service.getOptions();

        assertTrue(
                options.makes.stream()
                        .anyMatch(item -> item.make.equals("Honda"))
        );
        assertTrue(
                options.makes.stream()
                        .anyMatch(item -> item.make.equals("Hyundai"))
        );
    }

    @Test
    void canonicalizesAnApprovedVehicleSelection() {
        var selection = service.requireValidSelection(
                "honda",
                "civic",
                2022,
                "white",
                4
        );

        assertEquals("Honda", selection.make());
        assertEquals("Civic", selection.model());
        assertEquals("White", selection.color());
        assertEquals(4, selection.capacity());
    }

    @Test
    void rejectsAnUnapprovedMakeWithoutOtherFallback() {
        WebApplicationException error = assertThrows(
                WebApplicationException.class,
                () -> service.requireValidSelection(
                        "Unlisted Motors",
                        "Unknown",
                        2022,
                        "White",
                        4
                )
        );

        assertEquals(400, error.getResponse().getStatus());
    }

    @Test
    void rejectsAModelOutsideTheSelectedMake() {
        WebApplicationException error = assertThrows(
                WebApplicationException.class,
                () -> service.requireValidSelection(
                        "Honda",
                        "Corolla",
                        2022,
                        "White",
                        4
                )
        );

        assertEquals(400, error.getResponse().getStatus());
    }
}
