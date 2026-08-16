package com.beni.service;

import com.beni.dto.VehicleCatalogResponse;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.WebApplicationException;

import java.time.Year;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class VehicleCatalogService {

    public static final int MINIMUM_YEAR = 2000;

    private static final List<Integer> CAPACITIES =
            List.of(1, 2, 3, 4, 5, 6, 7, 8);

    private static final List<String> COLORS = List.of(
            "Beige", "Black", "Blue", "Bronze", "Brown",
            "Gold", "Green", "Grey", "Maroon", "Orange",
            "Purple", "Red", "Silver", "White", "Yellow"
    );

    private static final Map<String, List<String>> MAKES =
            createMakes();

    public VehicleCatalogResponse getOptions() {
        VehicleCatalogResponse response = new VehicleCatalogResponse();

        response.minimumYear = MINIMUM_YEAR;
        response.maximumYear = maximumYear();
        response.capacities.addAll(CAPACITIES);
        response.colors.addAll(COLORS);

        MAKES.forEach((make, models) ->
                response.makes.add(
                        new VehicleCatalogResponse.VehicleMakeOption(
                                make,
                                models
                        )
                )
        );

        return response;
    }

    public VehicleSelection requireValidSelection(
            String requestedMake,
            String requestedModel,
            Integer requestedYear,
            String requestedColor,
            Integer requestedCapacity
    ) {
        String make = canonicalValue(
                requestedMake,
                MAKES.keySet().stream().toList(),
                "Please select an approved vehicle make."
        );

        String model = canonicalValue(
                requestedModel,
                MAKES.get(make),
                "Please select an approved model for " + make + "."
        );

        if (requestedYear == null
                || requestedYear < MINIMUM_YEAR
                || requestedYear > maximumYear()) {
            throw new WebApplicationException(
                    "Please select an approved vehicle year.",
                    400
            );
        }

        String color = canonicalValue(
                requestedColor,
                COLORS,
                "Please select an approved vehicle color."
        );

        if (requestedCapacity == null
                || !CAPACITIES.contains(requestedCapacity)) {
            throw new WebApplicationException(
                    "Please select a passenger capacity between 1 and 8.",
                    400
            );
        }

        return new VehicleSelection(
                make,
                model,
                requestedYear,
                color,
                requestedCapacity
        );
    }

    private String canonicalValue(
            String requestedValue,
            List<String> approvedValues,
            String errorMessage
    ) {
        String normalized = requestedValue == null
                ? ""
                : requestedValue.trim();

        return approvedValues.stream()
                .filter(value -> value.equalsIgnoreCase(normalized))
                .findFirst()
                .orElseThrow(() ->
                        new WebApplicationException(errorMessage, 400)
                );
    }

    private int maximumYear() {
        return Year.now().getValue() + 1;
    }

    private static Map<String, List<String>> createMakes() {
        Map<String, List<String>> makes = new LinkedHashMap<>();

        makes.put("Audi", List.of("A3", "A4", "A5", "A6", "Q2", "Q3", "Q5", "Q7"));
        makes.put("BAIC", List.of("BJ40 Plus", "D20", "X25"));
        makes.put("BMW", List.of("1 Series", "2 Series", "3 Series", "5 Series", "7 Series", "X1", "X3", "X5"));
        makes.put("Changan", List.of("Alsvin", "Karvaan", "M9", "Oshan X7"));
        makes.put("Chery", List.of("Tiggo 4 Pro", "Tiggo 8 Pro"));
        makes.put("Chevrolet", List.of("Aveo", "Cruze", "Joy", "Optra", "Spark"));
        makes.put("Daihatsu", List.of("Cast", "Copen", "Cuore", "Mira", "Move", "Tanto"));
        makes.put("DFSK", List.of("Glory 500", "Glory 580", "K01", "K07"));
        makes.put("FAW", List.of("Carrier", "V2", "X-PV"));
        makes.put("Haval", List.of("H6", "H6 HEV", "Jolion", "Jolion HEV"));
        makes.put("Honda", List.of("Accord", "BR-V", "City", "Civic", "CR-V", "Freed", "HR-V", "N-WGN"));
        makes.put("Hyundai", List.of("Elantra", "H-100", "Ioniq", "Porter", "Santa Fe", "Sonata", "Tucson"));
        makes.put("Isuzu", List.of("D-Max"));
        makes.put("JAC", List.of("J7", "T9"));
        makes.put("Kia", List.of("Carnival", "Grand Carnival", "Picanto", "Sorento", "Sportage", "Stonic"));
        makes.put("Lexus", List.of("CT", "ES", "GS", "GX", "IS", "LX", "NX", "RX"));
        makes.put("Mercedes-Benz", List.of("A-Class", "C-Class", "E-Class", "S-Class", "CLA", "GLA", "GLC", "GLE"));
        makes.put("MG", List.of("4 EV", "5 EV", "HS", "HS PHEV", "ZS", "ZS EV"));
        makes.put("Mitsubishi", List.of("EK Wagon", "Lancer", "Mirage", "Outlander", "Pajero"));
        makes.put("Nissan", List.of("Dayz", "Juke", "March", "Note", "Patrol", "Sunny"));
        makes.put("Peugeot", List.of("2008"));
        makes.put("Prince", List.of("K07", "Pearl"));
        makes.put("Proton", List.of("Persona", "Saga", "X70"));
        makes.put("Suzuki", List.of("Alto", "Bolan", "Cultus", "Every", "Mehran", "Ravi", "Swift", "Wagon R"));
        makes.put("Toyota", List.of("Alphard", "Aqua", "Camry", "Corolla", "Fortuner", "Hiace", "Hilux", "Land Cruiser", "Passo", "Prius", "Vitz", "Yaris"));

        return Collections.unmodifiableMap(makes);
    }

    public record VehicleSelection(
            String make,
            String model,
            Integer year,
            String color,
            Integer capacity
    ) {
    }
}
