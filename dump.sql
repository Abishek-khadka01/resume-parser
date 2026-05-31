--
-<- PostgreSQL database dump
--

\restrict 3BeJ554kpYG7bgN9CfZrNu2m7ctiuIzFY7Iq7K1tYDfB8GrSrR1hNX3EvQeyVoY

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: alert_freq_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.alert_freq_enum AS ENUM (
    'instant',
    'daily',
    'weekly'
);


ALTER TYPE public.alert_freq_enum OWNER TO postgres;

--
-- Name: app_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.app_status_enum AS ENUM (
    'saved',
    'applied',
    'interview',
    'offer',
    'rejected'
);


ALTER TYPE public.app_status_enum OWNER TO postgres;

--
-- Name: auth_provider_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.auth_provider_enum AS ENUM (
    'local',
    'google'
);


ALTER TYPE public.auth_provider_enum OWNER TO postgres;

--
-- Name: exp_level_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.exp_level_enum AS ENUM (
    'entry',
    'mid',
    'senior',
    'lead'
);


ALTER TYPE public.exp_level_enum OWNER TO postgres;

--
-- Name: work_model_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.work_model_enum AS ENUM (
    'remote',
    'hybrid',
    'on-site'
);


ALTER TYPE public.work_model_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applications (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    job_id character varying NOT NULL,
    job_title character varying NOT NULL,
    company_name character varying NOT NULL,
    company_logo_url character varying,
    match_score integer,
    status public.app_status_enum NOT NULL,
    notes text,
    applied_at timestamp with time zone,
    status_updated_at timestamp with time zone,
    created_at timestamp with time zone,
    job_data jsonb
);


ALTER TABLE public.applications OWNER TO postgres;

--
-- Name: education; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.education (
    id uuid NOT NULL,
    profile_id uuid NOT NULL,
    institution character varying NOT NULL,
    degree character varying,
    field character varying,
    graduation_year integer
);


ALTER TABLE public.education OWNER TO postgres;

--
-- Name: job_alerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_alerts (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    keywords character varying[] NOT NULL,
    location character varying,
    work_model character varying,
    min_match_pct integer,
    frequency public.alert_freq_enum,
    is_active boolean,
    last_sent_at timestamp with time zone,
    created_at timestamp with time zone
);


ALTER TABLE public.job_alerts OWNER TO postgres;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    full_name character varying,
    phone character varying,
    linkedin_url character varying,
    location character varying,
    desired_title character varying,
    work_model public.work_model_enum,
    experience_level public.exp_level_enum,
    work_authorization character varying,
    salary_min integer,
    salary_max integer,
    skills character varying[],
    completeness_pct integer,
    resume_url character varying,
    updated_at timestamp with time zone
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email character varying NOT NULL,
    password_hash character varying,
    auth_provider public.auth_provider_enum,
    provider_id character varying,
    reset_token character varying,
    reset_token_expires timestamp with time zone,
    created_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: work_experiences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_experiences (
    id uuid NOT NULL,
    profile_id uuid NOT NULL,
    company character varying NOT NULL,
    title character varying NOT NULL,
    start_date date,
    end_date date,
    description text
);


ALTER TABLE public.work_experiences OWNER TO postgres;

--
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applications (id, user_id, job_id, job_title, company_name, company_logo_url, match_score, status, notes, applied_at, status_updated_at, created_at, job_data) FROM stdin;
\.


--
-- Data for Name: education; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.education (id, profile_id, institution, degree, field, graduation_year) FROM stdin;
\.


--
-- Data for Name: job_alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_alerts (id, user_id, keywords, location, work_model, min_match_pct, frequency, is_active, last_sent_at, created_at) FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profiles (id, user_id, full_name, phone, linkedin_url, location, desired_title, work_model, experience_level, work_authorization, salary_min, salary_max, skills, completeness_pct, resume_url, updated_at) FROM stdin;
6092039c-7500-4e01-8550-a283fd0b0acb	d39cc1e8-7585-44da-a78c-a35e191df075	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	0	\N	2026-05-29 21:55:08.754099+05:45
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, auth_provider, provider_id, reset_token, reset_token_expires, created_at) FROM stdin;
d39cc1e8-7585-44da-a78c-a35e191df075	abishek1234khadka@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$l2NnIoURvBvgk+ttkcZVUg$VXv1zLoKKKTa9y3sZ97OXDuk/A0KJJCYCr6nV8vD/LI	local	\N	\N	\N	2026-05-29 21:55:08.749166+05:45
\.


--
-- Data for Name: work_experiences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.work_experiences (id, profile_id, company, title, start_date, end_date, description) FROM stdin;
\.


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: education education_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.education
    ADD CONSTRAINT education_pkey PRIMARY KEY (id);


--
-- Name: job_alerts job_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_alerts
    ADD CONSTRAINT job_alerts_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: work_experiences work_experiences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_experiences
    ADD CONSTRAINT work_experiences_pkey PRIMARY KEY (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: applications applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: education education_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.education
    ADD CONSTRAINT education_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id);


--
-- Name: job_alerts job_alerts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_alerts
    ADD CONSTRAINT job_alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: work_experiences work_experiences_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_experiences
    ADD CONSTRAINT work_experiences_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 3BeJ554kpYG7bgN9CfZrNu2m7ctiuIzFY7Iq7K1tYDfB8GrSrR1hNX3EvQeyVoY

