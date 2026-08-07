--
-- PostgreSQL database dump
--

\restrict ZRtSrrJKJ5BbQYz6DItaDUc7gSGYYtUkd9yUrggAvQn6dhkwKWYRm4J4Qfk6ffx

-- Dumped from database version 14.23 (Ubuntu 14.23-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.23 (Ubuntu 14.23-0ubuntu0.22.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: driver_auth; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.driver_auth (
    user_id integer NOT NULL,
    password_hash character varying(255) NOT NULL
);


ALTER TABLE public.driver_auth OWNER TO postgres;

--
-- Name: driver_ride_feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.driver_ride_feedback (
    feedback_id integer NOT NULL,
    ride_id integer NOT NULL,
    driver_id integer NOT NULL,
    category character varying(60) NOT NULL,
    details character varying(1000),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.driver_ride_feedback OWNER TO postgres;

--
-- Name: driver_ride_feedback_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.driver_ride_feedback_feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.driver_ride_feedback_feedback_id_seq OWNER TO postgres;

--
-- Name: driver_ride_feedback_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.driver_ride_feedback_feedback_id_seq OWNED BY public.driver_ride_feedback.feedback_id;


--
-- Name: drivers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drivers (
    driver_id integer NOT NULL,
    user_id integer NOT NULL,
    license_number character varying(50) NOT NULL,
    driver_status character varying(20) DEFAULT 'Offline'::character varying,
    current_latitude double precision,
    current_longitude double precision,
    location_updated_at timestamp without time zone,
    CONSTRAINT drivers_driver_status_check CHECK (((driver_status)::text = ANY ((ARRAY['Offline'::character varying, 'Online'::character varying, 'Assigned'::character varying, 'OnTrip'::character varying, 'Suspended'::character varying])::text[])))
);


ALTER TABLE public.drivers OWNER TO postgres;

--
-- Name: drivers_driver_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.drivers_driver_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.drivers_driver_id_seq OWNER TO postgres;

--
-- Name: drivers_driver_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.drivers_driver_id_seq OWNED BY public.drivers.driver_id;


--
-- Name: otp_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_codes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    otp character varying(6) NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT otp_codes_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'USED'::character varying, 'EXPIRED'::character varying])::text[])))
);


ALTER TABLE public.otp_codes OWNER TO postgres;

--
-- Name: otp_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.otp_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.otp_codes_id_seq OWNER TO postgres;

--
-- Name: otp_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.otp_codes_id_seq OWNED BY public.otp_codes.id;


--
-- Name: passengers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.passengers (
    passenger_id integer NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.passengers OWNER TO postgres;

--
-- Name: passengers_passenger_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.passengers_passenger_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.passengers_passenger_id_seq OWNER TO postgres;

--
-- Name: passengers_passenger_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.passengers_passenger_id_seq OWNED BY public.passengers.passenger_id;


--
-- Name: ride_feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ride_feedback (
    feedback_id integer NOT NULL,
    ride_id integer NOT NULL,
    submitted_by character varying(20) NOT NULL,
    rating integer,
    comment character varying(500),
    report_category character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ride_feedback_check CHECK (((rating IS NOT NULL) OR (COALESCE(btrim((comment)::text), ''::text) <> ''::text) OR (COALESCE(btrim((report_category)::text), ''::text) <> ''::text))),
    CONSTRAINT ride_feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT ride_feedback_submitted_by_check CHECK (((submitted_by)::text = ANY ((ARRAY['PASSENGER'::character varying, 'DRIVER'::character varying])::text[])))
);


ALTER TABLE public.ride_feedback OWNER TO postgres;

--
-- Name: ride_feedback_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ride_feedback_feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ride_feedback_feedback_id_seq OWNER TO postgres;

--
-- Name: ride_feedback_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ride_feedback_feedback_id_seq OWNED BY public.ride_feedback.feedback_id;


--
-- Name: rides; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rides (
    ride_id integer NOT NULL,
    passenger_id integer NOT NULL,
    driver_id integer,
    vehicle_id integer,
    pickup_name character varying(255) NOT NULL,
    pickup_lat double precision NOT NULL,
    pickup_lng double precision NOT NULL,
    dropoff_name character varying(255) NOT NULL,
    dropoff_lat double precision NOT NULL,
    dropoff_lng double precision NOT NULL,
    distance_km numeric(8,2) NOT NULL,
    estimated_fare numeric(10,2) NOT NULL,
    requested_fare numeric(10,2) NOT NULL,
    accepted_fare numeric(10,2),
    ride_status character varying(30) DEFAULT 'SEARCHING'::character varying,
    requested_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    accepted_at timestamp without time zone,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    ride_pin_hash character varying(255),
    wallet_reserved_amount numeric(10,2) DEFAULT 0.00 NOT NULL,
    platform_fee_amount numeric(10,2) DEFAULT 0.00,
    cancellation_fee numeric(10,2) DEFAULT 0 NOT NULL,
    cancelled_by character varying(20),
    cancellation_reason character varying(255),
    cancelled_at timestamp without time zone,
    payment_method character varying(20) DEFAULT 'CASH'::character varying NOT NULL,
    payment_status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    driver_fee_reserved_amount numeric(10,2) DEFAULT 0 NOT NULL,
    passenger_wallet_reserved_amount numeric(10,2) DEFAULT 0 NOT NULL,
    payment_confirmed_at timestamp without time zone,
    estimated_duration_minutes integer,
    fee_deduction_due_at timestamp without time zone,
    platform_fee_deducted boolean DEFAULT false NOT NULL,
    platform_fee_deducted_at timestamp without time zone,
    CONSTRAINT rides_cancelled_by_check CHECK (((cancelled_by IS NULL) OR ((cancelled_by)::text = ANY ((ARRAY['PASSENGER'::character varying, 'DRIVER'::character varying])::text[])))),
    CONSTRAINT rides_financial_amounts_check CHECK (((wallet_reserved_amount >= (0)::numeric) AND (platform_fee_amount >= (0)::numeric) AND (cancellation_fee >= (0)::numeric))),
    CONSTRAINT rides_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['CASH'::character varying, 'DIGITAL_TRANSFER'::character varying])::text[]))),
    CONSTRAINT rides_ride_status_check CHECK (((ride_status)::text = ANY ((ARRAY['ACCEPTED'::character varying, 'IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying])::text[])))
);


ALTER TABLE public.rides OWNER TO postgres;

--
-- Name: rides_backup_20260723; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rides_backup_20260723 (
    ride_id integer,
    passenger_id integer,
    driver_id integer,
    vehicle_id integer,
    pickup_name character varying(255),
    pickup_lat double precision,
    pickup_lng double precision,
    dropoff_name character varying(255),
    dropoff_lat double precision,
    dropoff_lng double precision,
    distance_km numeric(8,2),
    estimated_fare numeric(10,2),
    requested_fare numeric(10,2),
    accepted_fare numeric(10,2),
    ride_status character varying(30),
    requested_at timestamp without time zone,
    accepted_at timestamp without time zone,
    started_at timestamp without time zone,
    completed_at timestamp without time zone
);


ALTER TABLE public.rides_backup_20260723 OWNER TO postgres;

--
-- Name: rides_ride_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rides_ride_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rides_ride_id_seq OWNER TO postgres;

--
-- Name: rides_ride_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rides_ride_id_seq OWNED BY public.rides.ride_id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    transaction_id integer NOT NULL,
    ride_id integer NOT NULL,
    wallet_id integer NOT NULL,
    transaction_type character varying(30) NOT NULL,
    payment_method character varying(20) DEFAULT 'WALLET'::character varying NOT NULL,
    direction character varying(10) DEFAULT 'DEBIT'::character varying NOT NULL,
    amount numeric(10,2) NOT NULL,
    transaction_status character varying(20) DEFAULT 'PAID'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at timestamp without time zone,
    CONSTRAINT transactions_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT transactions_direction_check CHECK (((direction)::text = ANY ((ARRAY['DEBIT'::character varying, 'CREDIT'::character varying])::text[]))),
    CONSTRAINT transactions_payment_method_check CHECK (((payment_method)::text = 'WALLET'::text)),
    CONSTRAINT transactions_transaction_status_check CHECK (((transaction_status)::text = ANY ((ARRAY['PENDING'::character varying, 'PAID'::character varying, 'FAILED'::character varying])::text[]))),
    CONSTRAINT transactions_transaction_type_check CHECK (((transaction_type)::text = ANY ((ARRAY['PLATFORM_FEE'::character varying, 'CANCELLATION_FEE'::character varying])::text[])))
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: transactions_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.transactions_transaction_id_seq OWNER TO postgres;

--
-- Name: transactions_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_transaction_id_seq OWNED BY public.transactions.transaction_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    full_name character varying(100) NOT NULL,
    phone_number character varying(15) NOT NULL,
    email character varying(100),
    role character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['passenger'::character varying, 'driver'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicles (
    vehicle_id integer NOT NULL,
    driver_id integer NOT NULL,
    make character varying(50) NOT NULL,
    model character varying(50) NOT NULL,
    vehicle_year integer,
    color character varying(30) NOT NULL,
    plate_number character varying(20) NOT NULL,
    vehicle_type character varying(20),
    capacity integer DEFAULT 4,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vehicles_capacity_check CHECK ((capacity > 0)),
    CONSTRAINT vehicles_vehicle_type_check CHECK (((vehicle_type)::text = 'Car'::text)),
    CONSTRAINT vehicles_vehicle_year_check CHECK ((vehicle_year >= 2000))
);


ALTER TABLE public.vehicles OWNER TO postgres;

--
-- Name: vehicles_vehicle_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vehicles_vehicle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.vehicles_vehicle_id_seq OWNER TO postgres;

--
-- Name: vehicles_vehicle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vehicles_vehicle_id_seq OWNED BY public.vehicles.vehicle_id;


--
-- Name: wallets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wallets (
    wallet_id integer NOT NULL,
    driver_id integer NOT NULL,
    balance double precision DEFAULT 0.00 NOT NULL,
    reserved_balance double precision DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT wallets_reserved_balance_check CHECK (((reserved_balance >= ((0)::numeric)::double precision) AND (reserved_balance <= balance)))
);


ALTER TABLE public.wallets OWNER TO postgres;

--
-- Name: wallets_backup_20260723; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wallets_backup_20260723 (
    wallet_id integer,
    driver_id integer,
    balance numeric(10,2),
    reserved_balance numeric(10,2),
    updated_at timestamp without time zone
);


ALTER TABLE public.wallets_backup_20260723 OWNER TO postgres;

--
-- Name: wallets_wallet_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wallets_wallet_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.wallets_wallet_id_seq OWNER TO postgres;

--
-- Name: wallets_wallet_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wallets_wallet_id_seq OWNED BY public.wallets.wallet_id;


--
-- Name: driver_ride_feedback feedback_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_ride_feedback ALTER COLUMN feedback_id SET DEFAULT nextval('public.driver_ride_feedback_feedback_id_seq'::regclass);


--
-- Name: drivers driver_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers ALTER COLUMN driver_id SET DEFAULT nextval('public.drivers_driver_id_seq'::regclass);


--
-- Name: otp_codes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_codes ALTER COLUMN id SET DEFAULT nextval('public.otp_codes_id_seq'::regclass);


--
-- Name: passengers passenger_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.passengers ALTER COLUMN passenger_id SET DEFAULT nextval('public.passengers_passenger_id_seq'::regclass);


--
-- Name: ride_feedback feedback_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ride_feedback ALTER COLUMN feedback_id SET DEFAULT nextval('public.ride_feedback_feedback_id_seq'::regclass);


--
-- Name: rides ride_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rides ALTER COLUMN ride_id SET DEFAULT nextval('public.rides_ride_id_seq'::regclass);


--
-- Name: transactions transaction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN transaction_id SET DEFAULT nextval('public.transactions_transaction_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: vehicles vehicle_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles ALTER COLUMN vehicle_id SET DEFAULT nextval('public.vehicles_vehicle_id_seq'::regclass);


--
-- Name: wallets wallet_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets ALTER COLUMN wallet_id SET DEFAULT nextval('public.wallets_wallet_id_seq'::regclass);


--
-- Name: driver_auth driver_auth_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_auth
    ADD CONSTRAINT driver_auth_pkey PRIMARY KEY (user_id);


--
-- Name: driver_ride_feedback driver_ride_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_ride_feedback
    ADD CONSTRAINT driver_ride_feedback_pkey PRIMARY KEY (feedback_id);


--
-- Name: drivers drivers_license_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_license_number_key UNIQUE (license_number);


--
-- Name: drivers drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_pkey PRIMARY KEY (driver_id);


--
-- Name: drivers drivers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_user_id_key UNIQUE (user_id);


--
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (id);


--
-- Name: passengers passengers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.passengers
    ADD CONSTRAINT passengers_pkey PRIMARY KEY (passenger_id);


--
-- Name: passengers passengers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.passengers
    ADD CONSTRAINT passengers_user_id_key UNIQUE (user_id);


--
-- Name: ride_feedback ride_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ride_feedback
    ADD CONSTRAINT ride_feedback_pkey PRIMARY KEY (feedback_id);


--
-- Name: ride_feedback ride_feedback_ride_id_submitted_by_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ride_feedback
    ADD CONSTRAINT ride_feedback_ride_id_submitted_by_key UNIQUE (ride_id, submitted_by);


--
-- Name: rides rides_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_pkey PRIMARY KEY (ride_id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (transaction_id);


--
-- Name: transactions uq_ride_transaction_type; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT uq_ride_transaction_type UNIQUE (ride_id, transaction_type);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_number_key UNIQUE (phone_number);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (vehicle_id);


--
-- Name: vehicles vehicles_plate_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_plate_number_key UNIQUE (plate_number);


--
-- Name: wallets wallets_driver_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_driver_id_key UNIQUE (driver_id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (wallet_id);


--
-- Name: idx_feedback_ride; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feedback_ride ON public.ride_feedback USING btree (ride_id);


--
-- Name: idx_rides_platform_fee_due; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rides_platform_fee_due ON public.rides USING btree (platform_fee_deducted, fee_deduction_due_at);


--
-- Name: idx_transactions_ride; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_ride ON public.transactions USING btree (ride_id);


--
-- Name: idx_transactions_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_type ON public.transactions USING btree (transaction_type);


--
-- Name: idx_transactions_wallet; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_wallet ON public.transactions USING btree (wallet_id);


--
-- Name: driver_auth driver_auth_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_auth
    ADD CONSTRAINT driver_auth_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: drivers drivers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: driver_ride_feedback fk_driver_feedback_driver; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_ride_feedback
    ADD CONSTRAINT fk_driver_feedback_driver FOREIGN KEY (driver_id) REFERENCES public.drivers(driver_id) ON DELETE CASCADE;


--
-- Name: driver_ride_feedback fk_driver_feedback_ride; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_ride_feedback
    ADD CONSTRAINT fk_driver_feedback_ride FOREIGN KEY (ride_id) REFERENCES public.rides(ride_id) ON DELETE CASCADE;


--
-- Name: transactions fk_transaction_ride; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_transaction_ride FOREIGN KEY (ride_id) REFERENCES public.rides(ride_id) ON DELETE CASCADE;


--
-- Name: transactions fk_transaction_wallet; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_transaction_wallet FOREIGN KEY (wallet_id) REFERENCES public.wallets(wallet_id) ON DELETE CASCADE;


--
-- Name: wallets fk_wallet_driver; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT fk_wallet_driver FOREIGN KEY (driver_id) REFERENCES public.drivers(driver_id) ON DELETE CASCADE;


--
-- Name: otp_codes otp_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: passengers passengers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.passengers
    ADD CONSTRAINT passengers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: ride_feedback ride_feedback_ride_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ride_feedback
    ADD CONSTRAINT ride_feedback_ride_id_fkey FOREIGN KEY (ride_id) REFERENCES public.rides(ride_id) ON DELETE CASCADE;


--
-- Name: rides rides_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(driver_id);


--
-- Name: rides rides_passenger_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_passenger_id_fkey FOREIGN KEY (passenger_id) REFERENCES public.passengers(passenger_id);


--
-- Name: rides rides_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(vehicle_id);


--
-- Name: vehicles vehicles_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(driver_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict ZRtSrrJKJ5BbQYz6DItaDUc7gSGYYtUkd9yUrggAvQn6dhkwKWYRm4J4Qfk6ffx

