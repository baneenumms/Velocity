BEGIN;

CREATE TABLE IF NOT EXISTS public.ride_requests (
    request_id VARCHAR(36) PRIMARY KEY,
    passenger_id INTEGER NOT NULL
        REFERENCES public.passengers(passenger_id)
        ON DELETE RESTRICT,
    pickup_latitude DOUBLE PRECISION NOT NULL,
    pickup_longitude DOUBLE PRECISION NOT NULL,
    pickup_address VARCHAR(500) NOT NULL,
    dropoff_latitude DOUBLE PRECISION NOT NULL,
    dropoff_longitude DOUBLE PRECISION NOT NULL,
    dropoff_address VARCHAR(500) NOT NULL,
    estimated_fare DOUBLE PRECISION NOT NULL,
    passenger_fare DOUBLE PRECISION NOT NULL,
    estimated_duration_minutes INTEGER NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    request_status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    fare_updated_at TIMESTAMP WITHOUT TIME ZONE,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT ride_requests_request_id_check
        CHECK (btrim(request_id) <> ''),
    CONSTRAINT ride_requests_pickup_latitude_check
        CHECK (pickup_latitude BETWEEN -90 AND 90),
    CONSTRAINT ride_requests_pickup_longitude_check
        CHECK (pickup_longitude BETWEEN -180 AND 180),
    CONSTRAINT ride_requests_dropoff_latitude_check
        CHECK (dropoff_latitude BETWEEN -90 AND 90),
    CONSTRAINT ride_requests_dropoff_longitude_check
        CHECK (dropoff_longitude BETWEEN -180 AND 180),
    CONSTRAINT ride_requests_addresses_check
        CHECK (
            btrim(pickup_address) <> '' AND
            btrim(dropoff_address) <> ''
        ),
    CONSTRAINT ride_requests_fares_check
        CHECK (
            estimated_fare > 0 AND
            passenger_fare > 0
        ),
    CONSTRAINT ride_requests_duration_check
        CHECK (estimated_duration_minutes > 0),
    CONSTRAINT ride_requests_payment_method_check
        CHECK (
            payment_method IN (
                'CASH',
                'DIGITAL_TRANSFER'
            )
        ),
    CONSTRAINT ride_requests_status_check
        CHECK (
            request_status IN (
                'SEARCHING',
                'ACCEPTED',
                'CANCELLED',
                'EXPIRED'
            )
        ),
    CONSTRAINT ride_requests_expiry_check
        CHECK (expires_at > created_at),
    CONSTRAINT ride_requests_version_check
        CHECK (version >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS
    uq_ride_requests_searching_passenger
ON public.ride_requests (passenger_id)
WHERE request_status = 'SEARCHING';

CREATE INDEX IF NOT EXISTS
    idx_ride_requests_available
ON public.ride_requests (
    request_status,
    expires_at,
    created_at DESC
);

CREATE INDEX IF NOT EXISTS
    idx_ride_requests_passenger_activity
ON public.ride_requests (
    passenger_id,
    request_status,
    created_at DESC
);

CREATE INDEX IF NOT EXISTS
    idx_ride_requests_searching_activity
ON public.ride_requests (
    (COALESCE(fare_updated_at, created_at)) DESC
)
WHERE request_status = 'SEARCHING';

CREATE TABLE IF NOT EXISTS public.driver_offers (
    offer_id VARCHAR(36) PRIMARY KEY,
    request_id VARCHAR(36) NOT NULL
        REFERENCES public.ride_requests(request_id)
        ON DELETE CASCADE,
    driver_id INTEGER NOT NULL
        REFERENCES public.drivers(driver_id)
        ON DELETE RESTRICT,
    driver_name VARCHAR(150) NOT NULL,
    vehicle_id INTEGER NOT NULL
        REFERENCES public.vehicles(vehicle_id)
        ON DELETE RESTRICT,
    vehicle_description VARCHAR(200) NOT NULL,
    plate_number VARCHAR(50) NOT NULL,
    offered_fare NUMERIC(10,2) NOT NULL,
    required_reserve NUMERIC(10,2) NOT NULL,
    offer_status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT driver_offers_offer_id_check
        CHECK (btrim(offer_id) <> ''),
    CONSTRAINT driver_offers_names_check
        CHECK (
            btrim(driver_name) <> '' AND
            btrim(vehicle_description) <> '' AND
            btrim(plate_number) <> ''
        ),
    CONSTRAINT driver_offers_amounts_check
        CHECK (
            offered_fare > 0 AND
            required_reserve >= 0
        ),
    CONSTRAINT driver_offers_status_check
        CHECK (
            offer_status IN (
                'PENDING',
                'ACCEPTED',
                'REJECTED',
                'WITHDRAWN'
            )
        ),
    CONSTRAINT driver_offers_timestamp_check
        CHECK (updated_at >= created_at),
    CONSTRAINT driver_offers_version_check
        CHECK (version >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS
    uq_driver_offers_pending_request_driver
ON public.driver_offers (request_id, driver_id)
WHERE offer_status = 'PENDING';

CREATE INDEX IF NOT EXISTS
    idx_driver_offers_request_fare
ON public.driver_offers (
    request_id,
    offer_status,
    offered_fare
);

CREATE INDEX IF NOT EXISTS
    idx_driver_offers_driver_status
ON public.driver_offers (
    driver_id,
    offer_status
);

COMMIT;
