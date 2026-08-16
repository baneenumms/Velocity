package com.beni.dto;

import java.util.ArrayList;
import java.util.List;

public class VehicleCatalogResponse {

    public boolean success = true;
    public int minimumYear;
    public int maximumYear;
    public List<Integer> capacities = new ArrayList<>();
    public List<String> colors = new ArrayList<>();
    public List<VehicleMakeOption> makes = new ArrayList<>();

    public static class VehicleMakeOption {
        public String make;
        public List<String> models = new ArrayList<>();

        public VehicleMakeOption() {
        }

        public VehicleMakeOption(String make, List<String> models) {
            this.make = make;
            this.models = new ArrayList<>(models);
        }
    }
}
