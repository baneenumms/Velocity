--
-- PostgreSQL database dump
--

\restrict UWgob9A7hGgHfQOj1jaPRYDIuIzEpAiurJ3QsXOtEa2hl874yqQMivBaYdbJ3cP

-- Dumped from database version 14.23 (Ubuntu 14.23-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.23 (Ubuntu 14.23-0ubuntu0.22.04.1)

-- Started on 2026-07-17 15:59:15 PKT

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
-- TOC entry 217 (class 1259 OID 16445)
-- Name: driver_auth; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.driver_auth (
    user_id integer NOT NULL,
    password_hash character varying(255) NOT NULL
);


ALTER TABLE public.driver_auth OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 16428)
-- Name: drivers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drivers (
    driver_id integer NOT NULL,
    user_id integer NOT NULL,
    license_number character varying(50) NOT NULL,
    driver_status character varying(20) DEFAULT 'Offline'::character varying,
    CONSTRAINT drivers_driver_status_check CHECK (((driver_status)::text = ANY ((ARRAY['Offline'::character varying, 'Online'::character varying, 'OnTrip'::character varying, 'Suspended'::character varying])::text[])))
);


ALTER TABLE public.drivers OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 16427)
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
-- TOC entry 3465 (class 0 OID 0)
-- Dependencies: 215
-- Name: drivers_driver_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.drivers_driver_id_seq OWNED BY public.drivers.driver_id;


--
-- TOC entry 214 (class 1259 OID 16413)
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
-- TOC entry 213 (class 1259 OID 16412)
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
-- TOC entry 3466 (class 0 OID 0)
-- Dependencies: 213
-- Name: otp_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.otp_codes_id_seq OWNED BY public.otp_codes.id;


--
-- TOC entry 212 (class 1259 OID 16399)
-- Name: passengers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.passengers (
    passenger_id integer NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.passengers OWNER TO postgres;

--
-- TOC entry 211 (class 1259 OID 16398)
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
-- TOC entry 3467 (class 0 OID 0)
-- Dependencies: 211
-- Name: passengers_passenger_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.passengers_passenger_id_seq OWNED BY public.passengers.passenger_id;


--
-- TOC entry 221 (class 1259 OID 16475)
-- Name: rides; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rides (
    ride_id integer NOT NULL,
    passenger_id integer,
    driver_id integer,
    vehicle_id integer,
    pickup_location double precision NOT NULL,
    dropoff_location double precision NOT NULL,
    final_fare numeric(10,2),
    ride_status character varying(20) DEFAULT 'Pending'::character varying,
    requested_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    CONSTRAINT rides_final_fare_check CHECK ((final_fare >= (0)::numeric)),
    CONSTRAINT rides_ride_status_check CHECK (((ride_status)::text = ANY ((ARRAY['Pending'::character varying, 'Accepted'::character varying, 'DriverArriving'::character varying, 'DriverArrived'::character varying, 'InProgress'::character varying, 'Completed'::character varying, 'Cancelled'::character varying])::text[])))
);


ALTER TABLE public.rides OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16474)
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
-- TOC entry 3468 (class 0 OID 0)
-- Dependencies: 220
-- Name: rides_ride_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rides_ride_id_seq OWNED BY public.rides.ride_id;


--
-- TOC entry 223 (class 1259 OID 16501)
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    transaction_id integer NOT NULL,
    ride_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method character varying(20) NOT NULL,
    payment_status character varying(20) DEFAULT 'Pending'::character varying,
    transaction_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT transactions_amount_check CHECK ((amount >= (0)::numeric)),
    CONSTRAINT transactions_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['Cash'::character varying, 'Wallet'::character varying])::text[]))),
    CONSTRAINT transactions_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['Pending'::character varying, 'Paid'::character varying, 'Failed'::character varying])::text[])))
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16500)
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
-- TOC entry 3469 (class 0 OID 0)
-- Dependencies: 222
-- Name: transactions_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_transaction_id_seq OWNED BY public.transactions.transaction_id;


--
-- TOC entry 210 (class 1259 OID 16386)
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
-- TOC entry 209 (class 1259 OID 16385)
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
-- TOC entry 3470 (class 0 OID 0)
-- Dependencies: 209
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 219 (class 1259 OID 16456)
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
-- TOC entry 218 (class 1259 OID 16455)
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
-- TOC entry 3471 (class 0 OID 0)
-- Dependencies: 218
-- Name: vehicles_vehicle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vehicles_vehicle_id_seq OWNED BY public.vehicles.vehicle_id;


--
-- TOC entry 3247 (class 2604 OID 16431)
-- Name: drivers driver_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers ALTER COLUMN driver_id SET DEFAULT nextval('public.drivers_driver_id_seq'::regclass);


--
-- TOC entry 3243 (class 2604 OID 16416)
-- Name: otp_codes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_codes ALTER COLUMN id SET DEFAULT nextval('public.otp_codes_id_seq'::regclass);


--
-- TOC entry 3242 (class 2604 OID 16402)
-- Name: passengers passenger_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.passengers ALTER COLUMN passenger_id SET DEFAULT nextval('public.passengers_passenger_id_seq'::regclass);


--
-- TOC entry 3256 (class 2604 OID 16478)
-- Name: rides ride_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rides ALTER COLUMN ride_id SET DEFAULT nextval('public.rides_ride_id_seq'::regclass);


--
-- TOC entry 3261 (class 2604 OID 16504)
-- Name: transactions transaction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN transaction_id SET DEFAULT nextval('public.transactions_transaction_id_seq'::regclass);


--
-- TOC entry 3239 (class 2604 OID 16389)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 3250 (class 2604 OID 16459)
-- Name: vehicles vehicle_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles ALTER COLUMN vehicle_id SET DEFAULT nextval('public.vehicles_vehicle_id_seq'::regclass);


--
-- TOC entry 3453 (class 0 OID 16445)
-- Dependencies: 217
-- Data for Name: driver_auth; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.driver_auth (user_id, password_hash) FROM stdin;
1	baneen123
2	ali123
3	ahmed123
5	sara123
6	raza123
\.


--
-- TOC entry 3452 (class 0 OID 16428)
-- Dependencies: 216
-- Data for Name: drivers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.drivers (driver_id, user_id, license_number, driver_status) FROM stdin;
1	1	LIC-BN-001	Offline
2	2	LIC-AR-002	Offline
3	3	LIC-AK-003	Offline
4	5	LIC-SR-004	Offline
5	6	LIC-RZ-005	Offline
\.


--
-- TOC entry 3450 (class 0 OID 16413)
-- Dependencies: 214
-- Data for Name: otp_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.otp_codes (id, user_id, otp, status, expires_at, created_at) FROM stdin;
\.


--
-- TOC entry 3448 (class 0 OID 16399)
-- Dependencies: 212
-- Data for Name: passengers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.passengers (passenger_id, user_id) FROM stdin;
\.


--
-- TOC entry 3457 (class 0 OID 16475)
-- Dependencies: 221
-- Data for Name: rides; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rides (ride_id, passenger_id, driver_id, vehicle_id, pickup_location, dropoff_location, final_fare, ride_status, requested_at, started_at, completed_at) FROM stdin;
\.


--
-- TOC entry 3459 (class 0 OID 16501)
-- Dependencies: 223
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (transaction_id, ride_id, amount, payment_method, payment_status, transaction_date) FROM stdin;
\.


--
-- TOC entry 3446 (class 0 OID 16386)
-- Dependencies: 210
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, full_name, phone_number, email, role, created_at) FROM stdin;
1	Baneen	03308497640	beninn23@gmail.com	driver	2026-07-16 13:03:20.242538
2	Ali Raza	03001234567	ali.raza@gmail.com	driver	2026-07-16 13:05:05.279939
3	Ahmed Khan	03111222333	ahmed.khan@gmail.com	driver	2026-07-16 13:05:40.394482
5	Sara Raza	03222333444	rax@gmail.com	driver	2026-07-16 13:07:57.887347
6	raza	03289333444	raxu@gmail.com	driver	2026-07-16 13:08:42.263749
7	Zainab Ali	03123456789	zainab.ali@gmail.com	passenger	2026-07-16 13:09:31.37493
8	Fatima Khan	03456789012	fatima.khan@gmail.com	passenger	2026-07-16 13:09:54.80047
\.


--
-- TOC entry 3455 (class 0 OID 16456)
-- Dependencies: 219
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicles (vehicle_id, driver_id, make, model, vehicle_year, color, plate_number, vehicle_type, capacity, created_at) FROM stdin;
\.


--
-- TOC entry 3472 (class 0 OID 0)
-- Dependencies: 215
-- Name: drivers_driver_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.drivers_driver_id_seq', 5, true);


--
-- TOC entry 3473 (class 0 OID 0)
-- Dependencies: 213
-- Name: otp_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.otp_codes_id_seq', 1, false);


--
-- TOC entry 3474 (class 0 OID 0)
-- Dependencies: 211
-- Name: passengers_passenger_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.passengers_passenger_id_seq', 1, false);


--
-- TOC entry 3475 (class 0 OID 0)
-- Dependencies: 220
-- Name: rides_ride_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rides_ride_id_seq', 1, false);


--
-- TOC entry 3476 (class 0 OID 0)
-- Dependencies: 222
-- Name: transactions_transaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transactions_transaction_id_seq', 1, false);


--
-- TOC entry 3477 (class 0 OID 0)
-- Dependencies: 209
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 8, true);


--
-- TOC entry 3478 (class 0 OID 0)
-- Dependencies: 218
-- Name: vehicles_vehicle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vehicles_vehicle_id_seq', 1, false);


--
-- TOC entry 3286 (class 2606 OID 16449)
-- Name: driver_auth driver_auth_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_auth
    ADD CONSTRAINT driver_auth_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3280 (class 2606 OID 16439)
-- Name: drivers drivers_license_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_license_number_key UNIQUE (license_number);


--
-- TOC entry 3282 (class 2606 OID 16435)
-- Name: drivers drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_pkey PRIMARY KEY (driver_id);


--
-- TOC entry 3284 (class 2606 OID 16437)
-- Name: drivers drivers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_user_id_key UNIQUE (user_id);


--
-- TOC entry 3278 (class 2606 OID 16421)
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (id);


--
-- TOC entry 3274 (class 2606 OID 16404)
-- Name: passengers passengers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.passengers
    ADD CONSTRAINT passengers_pkey PRIMARY KEY (passenger_id);


--
-- TOC entry 3276 (class 2606 OID 16406)
-- Name: passengers passengers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.passengers
    ADD CONSTRAINT passengers_user_id_key UNIQUE (user_id);


--
-- TOC entry 3292 (class 2606 OID 16484)
-- Name: rides rides_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_pkey PRIMARY KEY (ride_id);


--
-- TOC entry 3294 (class 2606 OID 16511)
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (transaction_id);


--
-- TOC entry 3296 (class 2606 OID 16513)
-- Name: transactions transactions_ride_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_ride_id_key UNIQUE (ride_id);


--
-- TOC entry 3268 (class 2606 OID 16397)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3270 (class 2606 OID 16395)
-- Name: users users_phone_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_number_key UNIQUE (phone_number);


--
-- TOC entry 3272 (class 2606 OID 16393)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3288 (class 2606 OID 16466)
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (vehicle_id);


--
-- TOC entry 3290 (class 2606 OID 16468)
-- Name: vehicles vehicles_plate_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_plate_number_key UNIQUE (plate_number);


--
-- TOC entry 3300 (class 2606 OID 16450)
-- Name: driver_auth driver_auth_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_auth
    ADD CONSTRAINT driver_auth_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3299 (class 2606 OID 16440)
-- Name: drivers drivers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3298 (class 2606 OID 16422)
-- Name: otp_codes otp_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3297 (class 2606 OID 16407)
-- Name: passengers passengers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.passengers
    ADD CONSTRAINT passengers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3303 (class 2606 OID 16490)
-- Name: rides rides_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(driver_id);


--
-- TOC entry 3302 (class 2606 OID 16485)
-- Name: rides rides_passenger_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_passenger_id_fkey FOREIGN KEY (passenger_id) REFERENCES public.passengers(passenger_id);


--
-- TOC entry 3304 (class 2606 OID 16495)
-- Name: rides rides_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(vehicle_id);


--
-- TOC entry 3305 (class 2606 OID 16514)
-- Name: transactions transactions_ride_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_ride_id_fkey FOREIGN KEY (ride_id) REFERENCES public.rides(ride_id);


--
-- TOC entry 3301 (class 2606 OID 16469)
-- Name: vehicles vehicles_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(driver_id) ON DELETE CASCADE;


-- Completed on 2026-07-17 15:59:15 PKT

--
-- PostgreSQL database dump complete
--

\unrestrict UWgob9A7hGgHfQOj1jaPRYDIuIzEpAiurJ3QsXOtEa2hl874yqQMivBaYdbJ3cP

