-- Migration script generated from old DB data

-- 1. Insert auth.users
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  '380e4e32-9925-4c88-b2c2-df12643a40e0',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'shohaibh@pzoneinternational.com',
  '$2a$10$jY6a7Cu0p.m1F6K3z4ayWOd9s0AEaKj2.w.x40.ZlX1XpzmHxA4LG',
  '2026-06-01T08:15:16.979817+00:00',
  '{"provider":"email","providers":["email"]}',
  '{"sub":"380e4e32-9925-4c88-b2c2-df12643a40e0","email":"shohaibh@pzoneinternational.com","full_name":"Hassan Shohaib","email_verified":true,"phone_verified":false}',
  '2026-06-01T08:10:27.201313+00:00',
  '2026-06-01T08:15:17.021132+00:00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  '4831e84c-b4ce-46bd-b6de-06332e55aa8a',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@admin.com',
  '$2a$06$t5oQWwJ7x.kE9/pbe5QsoeYvs9kU4fXVnHjSFfwHB/PxvbecMqiHO',
  '2026-03-24T08:21:21.434917+00:00',
  '{"provider":"email","providers":["email"]}',
  '{"email_verified":true}',
  '2026-03-16T08:38:16.128709+00:00',
  '2026-07-05T09:06:40.169595+00:00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  '6729ed26-fd94-4965-af3b-7831edf4acd5',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'hassan_admin@pzoneinternational.com',
  '$2a$10$5.yfq2lnm.As9pQF.pDN4.OetCFk421QgP7rQnPKbgrZHub5S4jzm',
  '2026-07-22T00:46:31.15604+00:00',
  '{"provider":"email","providers":["email"]}',
  '{"sub":"6729ed26-fd94-4965-af3b-7831edf4acd5","email":"hassan_admin@pzoneinternational.com","email_verified":false,"phone_verified":false}',
  '2026-07-22T00:46:31.15604+00:00',
  '2026-07-22T00:46:31.680321+00:00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  '4b292af6-b5b0-46c5-a8bb-39b514c07462',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'o1027352352@gmail.com',
  '$2a$10$PJAcSBUTdI3NNy/Za6JZd.VCHsIw9YK904B4VuMiQ2/bZc2kYbTw6',
  '2026-07-20T10:14:12.620704+00:00',
  '{"provider":"email","providers":["email"]}',
  '{"email_verified":true}',
  '2026-07-20T10:13:54.941098+00:00',
  '2026-07-20T10:14:12.664013+00:00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  'fe18f071-3373-42ff-9c0a-5ded4e7988d2',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'elbatrawih@pzoneinternational.com',
  '$2a$10$vDxflPHRXqGz/N7UsMr8jeOmkvekAFMP4dvzllQINW.vDM5uqprwS',
  '2026-07-23T19:36:10.1809+00:00',
  '{"provider":"email","providers":["email"]}',
  '{"sub":"fe18f071-3373-42ff-9c0a-5ded4e7988d2","email":"elbatrawih@pzoneinternational.com","full_name":"Hisham El Batrawi","email_verified":false,"phone_verified":false}',
  '2026-07-23T19:36:10.1809+00:00',
  '2026-07-23T19:36:10.712103+00:00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  'e403fea2-4964-4c6b-b41f-0e3d8b3cbca2',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'hassansolimanofficial@gmail.com',
  '$2a$10$.sUm/.bio/B79CkexXvTHOOiPBEmaAsov7JqPZ3EnOi8CgNzPkNUG',
  '2026-08-10T15:05:56.491416+00:00',
  '{"provider":"email","providers":["email"]}',
  '{"sub":"e403fea2-4964-4c6b-b41f-0e3d8b3cbca2","email":"hassansolimanofficial@gmail.com","full_name":"عميل","email_verified":true,"phone_verified":false}',
  '2026-08-10T15:05:28.778936+00:00',
  '2026-08-24T08:03:42.805836+00:00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  'a49e2832-214d-4821-8c72-45b33d5410c1',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@pzone.com',
  '$2a$06$SybTQP0CIvUJ5KJA9X3RSe.crwAoK.PeMcV6d0JZI6F8AXJccw5ry',
  '2026-03-16T07:55:15.345467+00:00',
  '{"provider":"email","providers":["email"]}',
  '{"sub":"a49e2832-214d-4821-8c72-45b33d5410c1","email":"admin@pzone.com","full_name":"Administrator","email_verified":true,"phone_verified":false}',
  '2026-03-16T07:48:22.939867+00:00',
  '2026-08-23T15:41:17.971501+00:00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  '38e9ed67-923f-4356-bb9a-9ed7c4d1e9da',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'omarm@pzoneinternational.com',
  '$2a$10$EbJGwqIMwKZzQHObVQjrZO9car2ODKvQOKA6fBxTeejUfztPWfDtu',
  '2026-08-03T14:41:40.183871+00:00',
  '{"provider":"email","providers":["email"]}',
  '{"sub":"38e9ed67-923f-4356-bb9a-9ed7c4d1e9da","email":"omarm@pzoneinternational.com","full_name":"Mostafa Omar","email_verified":true,"phone_verified":false}',
  '2026-07-30T09:57:46.804729+00:00',
  '2026-08-03T14:41:40.243585+00:00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  '20bd8401-984b-42d0-b71d-79a95d9972a0',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'alshaikhm@pzoneinternational.com',
  '$2a$10$r9prjepAcMV0f3EXNdp1rO80b.6NhMM/fTmghLWKd8oRpj878J0RS',
  '2026-07-23T17:30:08.387488+00:00',
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Alshaikh M (COO)","email_verified":true}',
  '2026-07-23T17:24:25.396581+00:00',
  '2026-08-04T08:02:36.246473+00:00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  '71e40138-62c4-491d-8c6d-2109b41edfca',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'kawthar.boshra.seda@gmail.com',
  '$2a$10$WcR8KWxD6.HVg3mpd7IE1upYQhO1Ym0Q2wbY6tmkP/6SlBiacI3YS',
  '2026-07-22T10:23:24.631925+00:00',
  '{"provider":"email","providers":["email"]}',
  '{"sub":"71e40138-62c4-491d-8c6d-2109b41edfca","email":"kawthar.boshra.seda@gmail.com","full_name":"Kawthar Boshra ","email_verified":true,"phone_verified":false}',
  '2026-07-22T10:23:11.654479+00:00',
  '2026-08-23T09:15:12.536636+00:00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  'c5d32647-cdf5-44a6-8f72-71181d8b67e2',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'solimane@pzoneinternational.com',
  '$2a$10$lqZ4iZTcmse6mEx6d.gSgeOlWnf6GgeJEh4hrUQkOeplu/tqVSh36',
  '2026-06-08T15:59:02.298836+00:00',
  '{"provider":"email","providers":["email"]}',
  '{"sub":"c5d32647-cdf5-44a6-8f72-71181d8b67e2","email":"solimane@pzoneinternational.com","full_name":"Hassan Soliman","email_verified":true,"phone_verified":false}',
  '2026-06-08T15:58:45.00102+00:00',
  '2026-08-24T08:07:11.3273+00:00'
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert clients
INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '4f9870e8-ff5e-4b6a-ad87-6baaee174d50',
  '—_4f9870e8',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '1690cf1b-7648-4d9a-94f2-46e49bfd2059',
  '—_1690cf1b',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '11c79c3c-98b5-475e-b6a1-edf4125547c4',
  '—_11c79c3c',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  'c78a7003-be8e-44f1-8758-f738e9c2b4cf',
  '—_c78a7003',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  'f95fa6d0-9fa2-489d-916f-a08c6bf2cfb5',
  '—_f95fa6d0',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '4f7c156a-868e-4b68-959d-142c41c37c0c',
  '—_4f7c156a',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '4df9bc3c-c7ec-43f9-abe7-c53fb308e569',
  '—_4df9bc3c',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  'c0fb36a2-c17d-45c9-94ee-33e488bc2fe7',
  '—_c0fb36a2',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  'adfc8147-80b0-4e0a-be56-a0ece60c2519',
  '—_adfc8147',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '71b15cdc-af57-4f28-892e-0e9feb55a10f',
  '—_71b15cdc',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  'bb326620-36de-4fd9-8935-f782515ba087',
  '—_bb326620',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '54f65d1e-30e1-49d9-9586-2e39646d729e',
  '—_54f65d1e',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '9a19a313-a651-4223-a9cb-9443a7a02d32',
  '—_9a19a313',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '71e379f2-1ccf-4919-9402-902a25b21d76',
  '—_71e379f2',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  'ec657aad-ab29-4ccb-8de6-4ce4bf021739',
  '—_ec657aad',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  'de4acfb1-156f-469e-9485-b9b0531a12b7',
  '—_de4acfb1',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '41c8586d-8bb3-41ee-90d4-cf4db4fd1dd9',
  '—_41c8586d',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '4eec3f12-d8fd-4ad9-b267-3b315b360257',
  '—_4eec3f12',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  'f24a1416-45ad-4fb7-9bd4-e480d7295c76',
  '—_f24a1416',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  'ae6d1744-958a-4235-b6ef-ccbcaadf6a16',
  '—_ae6d1744',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '61c8f827-2efc-426c-9f41-79d27e70c5ad',
  '—_61c8f827',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '2cbba51c-b109-4a10-ba80-05ff1b5d11fb',
  '—_2cbba51c',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  'e95ca626-92f0-4b9c-a7fc-9a9516ac7652',
  '—_e95ca626',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  'da9e6b05-d7dc-45c2-8c7c-3cb7f6414961',
  '—_da9e6b05',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '23d671f3-f294-42be-93e7-c1b8dc3b1bc4',
  '—_23d671f3',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '0d249d13-2c81-490f-b1af-89faffbb0d62',
  '—_0d249d13',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '6460a1aa-9cb8-4f1b-96f0-f5cf8fc1d7bf',
  '—_6460a1aa',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '53c6b525-3e9e-4992-9051-5e74f4eb52ab',
  '—_53c6b525',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  'de08baa0-770b-40d4-87d2-6b876d8c36b4',
  '—_de08baa0',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  'a0ee8a1c-559a-4d59-b8d5-29623a7e215e',
  '—_a0ee8a1c',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '56cc98a0-544f-46af-b8e0-cd09f1f60b6b',
  '—_56cc98a0',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  'db0f5210-6c69-4c55-833c-edf1e4ff9343',
  '—_db0f5210',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '454037a2-8bdd-432a-a866-74e7cb1a201b',
  '—_454037a2',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  'ecd1f18f-bb1b-4532-807f-39545fc2df42',
  '—_ecd1f18f',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '017a9db6-1eb0-4d37-9c01-9d5d19d07ae5',
  '—_017a9db6',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  'dcdc85e5-d8b6-4712-977b-65bb92cf7548',
  '—_dcdc85e5',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '9ec1d599-51ef-4896-a5b0-88b0f5c98998',
  '—_9ec1d599',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  'c298f50d-2307-43b3-920e-aa7e84c46fe2',
  '—_c298f50d',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  'db7f27f8-93a8-4eef-ac12-3ade05c3bbea',
  '—_db7f27f8',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '8546b090-fa90-4bf6-8f49-692f63e4eb23',
  '—_8546b090',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '51adfa39-a7f0-4467-9e2c-867cb9f81c80',
  '—_51adfa39',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '9886b230-a19d-4c3a-8638-48fd661564bd',
  '—_9886b230',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '30138635-c9c4-4207-a50a-fb03faea3569',
  '—_30138635',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  'd59610a3-337f-4111-ac16-54a0c608bccd',
  '—_d59610a3',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  'cccc6de4-51dc-4840-ad67-2add7d10e02b',
  '—_cccc6de4',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '9ace56ca-41b1-47c8-9ae9-5c99c47a0e9c',
  '—_9ace56ca',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name_ar, email, phone, address, contact_person, created_at, updated_at, type)
VALUES (
  '9505b249-7e44-467b-99a4-add7908b7159',
  '—_9505b249',
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-17T12:25:09+00:00',
  '2026-05-24T15:07:59.049645+00:00',
  'owner'
) ON CONFLICT (id) DO NOTHING;

-- 3. Insert stakeholders
INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'هشام الصافي',
  '',
  '',
  'مدير المشاريع',
  '2026-08-10T15:34:13.214234+00:00',
  '2026-08-10T15:34:13.214234+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عميل',
  'hassansolimanofficial@gmail.com',
  '',
  'مدير مشروع',
  '2026-08-10T15:58:08.981378+00:00',
  '2026-08-10T15:58:08.981378+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمود عصام الدين محمود عبدالعزيز',
  'essamm@pzoneinternational.com',
  '1096617723',
  NULL,
  '2026-07-28T11:57:46.867974+00:00',
  '2026-07-28T11:57:46.867974+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'مايكل هانى لطيف وسيلى',
  'hanym@pzoneinternational.com',
  '01099040222',
  NULL,
  '2026-07-28T11:57:46.867974+00:00',
  '2026-07-28T11:57:46.867974+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عمرو سعيد بدوى راضى',
  'radya@pzoneinternational.com',
  '01020100511',
  NULL,
  '2026-07-28T11:57:46.867974+00:00',
  '2026-07-28T11:57:46.867974+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد هشام مراد على',
  'heshama@pzoneinternational.com',
  '01070559965',
  NULL,
  '2026-07-28T11:57:46.867974+00:00',
  '2026-07-28T11:57:46.867974+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد احمد حسين احمد',
  'HussienM@pzoneinternational.com',
  '01069821959',
  NULL,
  '2026-07-28T11:57:46.867974+00:00',
  '2026-07-28T11:57:46.867974+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'Hesham El Seifi',
  NULL,
  '01202624321',
  NULL,
  '2026-08-11T10:42:55.157667+00:00',
  '2026-08-11T10:42:55.157667+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'Hesham El Seifi',
  NULL,
  '01202624321',
  NULL,
  '2026-08-11T10:43:58.643046+00:00',
  '2026-08-11T10:43:58.643046+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'Evram Rafat',
  NULL,
  '01143353755',
  NULL,
  '2026-08-11T10:43:58.643046+00:00',
  '2026-08-11T10:43:58.643046+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'tester',
  'hassansolimanofficial@gmail.com',
  '',
  'project manager',
  '2026-08-11T13:10:20.837723+00:00',
  '2026-08-11T13:10:20.837723+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'امير بطرس يونان بطرس',
  '',
  '01224530850',
  NULL,
  '2026-07-28T11:58:00.827192+00:00',
  '2026-07-28T11:58:00.827192+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد محسن بركات محمد',
  '',
  '1144775783',
  NULL,
  '2026-07-28T11:58:01.648304+00:00',
  '2026-07-28T11:58:01.648304+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد السيد ابوالمجد احمد',
  '',
  '1110301028',
  NULL,
  '2026-07-28T11:58:01.648304+00:00',
  '2026-07-28T11:58:01.648304+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد جمال عبد العزيز جعفر',
  '',
  '01029225419',
  NULL,
  '2026-07-28T11:58:01.648304+00:00',
  '2026-07-28T11:58:01.648304+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد محمد السحاتى',
  'sahatym@pzoneinternational.com',
  '01009745550',
  NULL,
  '2026-07-28T11:57:46.867974+00:00',
  '2026-07-28T11:57:46.867974+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'فارس عامر اسماعيل عامر',
  '',
  '01080474433',
  NULL,
  '2026-07-28T11:57:46.867974+00:00',
  '2026-07-28T11:57:46.867974+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد عماد محمد مجاهد',
  'emada@pzoneinternational.com',
  '1280987204',
  NULL,
  '2026-07-28T11:57:46.867974+00:00',
  '2026-07-28T11:57:46.867974+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'ابراهيم خالد عبدالعاطى السحاتى',
  '',
  '1099697535',
  NULL,
  '2026-07-28T11:57:46.867974+00:00',
  '2026-07-28T11:57:46.867974+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'على ايمن على محمد',
  '',
  '01033110356',
  NULL,
  '2026-07-28T11:57:46.867974+00:00',
  '2026-07-28T11:57:46.867974+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'بدر ايمن محمد السيد',
  '',
  '01050390805',
  NULL,
  '2026-07-28T11:57:46.867974+00:00',
  '2026-07-28T11:57:46.867974+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد سعد محمد محجوب',
  'saadm@pzoneinternational.com',
  '1099500347',
  NULL,
  '2026-07-28T11:57:46.867974+00:00',
  '2026-07-28T11:57:46.867974+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'ايمن عبدالمطلب حسن شهيب',
  'abdelmottaleba@pzoneinternational.com',
  '01099859987',
  NULL,
  '2026-07-28T11:57:46.867974+00:00',
  '2026-07-28T11:57:46.867974+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'سيد صلاح مراد السيد',
  '',
  '01090043116',
  NULL,
  '2026-07-28T11:57:46.867974+00:00',
  '2026-07-28T11:57:46.867974+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمود مدحت حسين يوسف',
  '',
  '01065736661',
  NULL,
  '2026-07-28T11:57:46.867974+00:00',
  '2026-07-28T11:57:46.867974+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'ابراهيم السيد ابراهيم ابو المجد',
  '',
  '01026147208',
  NULL,
  '2026-07-28T11:57:46.867974+00:00',
  '2026-07-28T11:57:46.867974+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد فتحى على على بدر',
  '',
  '01022811992',
  NULL,
  '2026-07-28T11:57:46.867974+00:00',
  '2026-07-28T11:57:46.867974+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد اشرف ابراهيم محمد',
  '',
  '01022828876',
  NULL,
  '2026-07-28T11:57:46.867974+00:00',
  '2026-07-28T11:57:46.867974+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'حماده محمد عبدالرحمن على سلامة',
  '',
  '01050305582',
  NULL,
  '2026-07-28T11:57:46.867974+00:00',
  '2026-07-28T11:57:46.867974+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد علي محمد لبده',
  '',
  '01066221404',
  NULL,
  '2026-07-28T11:57:46.867974+00:00',
  '2026-07-28T11:57:46.867974+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'مجدى السيد ابراهيم محمد ابو المجد',
  '',
  '1091278781',
  NULL,
  '2026-07-28T11:57:48.411152+00:00',
  '2026-07-28T11:57:48.411152+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمود حسن نصر الدين حسنين',
  '',
  '1094333451',
  NULL,
  '2026-07-28T11:57:48.411152+00:00',
  '2026-07-28T11:57:48.411152+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد احمد عبدالنبى شحاتة',
  '',
  '1099483002',
  NULL,
  '2026-07-28T11:57:48.411152+00:00',
  '2026-07-28T11:57:48.411152+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمود حسين رشاد احمد عمر',
  '',
  '01050859536',
  NULL,
  '2026-07-28T11:57:48.411152+00:00',
  '2026-07-28T11:57:48.411152+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عبدالرحيم بدوى عبدالرحيم اسماعيل',
  '',
  '1023797098',
  NULL,
  '2026-07-28T11:57:48.411152+00:00',
  '2026-07-28T11:57:48.411152+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عمرو محمد نفادى احمد',
  '',
  '1069676483',
  NULL,
  '2026-07-28T11:57:48.411152+00:00',
  '2026-07-28T11:57:48.411152+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد اسامه سيد اسماعيل',
  '',
  '1270691333',
  NULL,
  '2026-07-28T11:57:48.411152+00:00',
  '2026-07-28T11:57:48.411152+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد على حسن اللبانى',
  '',
  '01033110429',
  NULL,
  '2026-07-28T11:57:48.411152+00:00',
  '2026-07-28T11:57:48.411152+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'تامر عبدالعظيم محمد ادريس',
  'abdelazimt@pzoneinternational.com',
  '01099495757',
  NULL,
  '2026-07-28T11:57:48.411152+00:00',
  '2026-07-28T11:57:48.411152+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'هيثم محمد محمود محمد احمد المؤيد',
  'mohamedh@pzoneinternational.com',
  '01050305579',
  NULL,
  '2026-07-28T11:57:48.411152+00:00',
  '2026-07-28T11:57:48.411152+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'موهوب محمود احمد على',
  '',
  '01066220985',
  NULL,
  '2026-07-28T11:57:48.411152+00:00',
  '2026-07-28T11:57:48.411152+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'صلاح عزازى عبد الفتاح',
  '',
  '01022842289',
  NULL,
  '2026-07-28T11:57:48.411152+00:00',
  '2026-07-28T11:57:48.411152+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عبدالرازق محمد عبدالرزاق سليم',
  '',
  '01068803799',
  NULL,
  '2026-07-28T11:57:48.411152+00:00',
  '2026-07-28T11:57:48.411152+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'السيد محمد على درويش',
  '',
  '01001519176',
  NULL,
  '2026-07-28T11:57:48.411152+00:00',
  '2026-07-28T11:57:48.411152+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد علاء صفوت على',
  '',
  '01013358858',
  NULL,
  '2026-07-28T11:57:48.411152+00:00',
  '2026-07-28T11:57:48.411152+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد فرج عبدالعليم فرج',
  '',
  '01080474455',
  NULL,
  '2026-07-28T11:57:48.411152+00:00',
  '2026-07-28T11:57:48.411152+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عبد النبي مهني عبد القوي',
  '',
  '01022180082',
  NULL,
  '2026-07-28T11:57:48.411152+00:00',
  '2026-07-28T11:57:48.411152+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'هانى حامد النجدى حسين',
  '',
  '1033124718',
  NULL,
  '2026-07-28T11:57:48.411152+00:00',
  '2026-07-28T11:57:48.411152+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'مختار قضب كريم جمعة',
  '',
  '1069839653',
  NULL,
  '2026-07-28T11:57:48.411152+00:00',
  '2026-07-28T11:57:48.411152+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد شعبان احمد مرسى',
  '',
  '0103277761',
  NULL,
  '2026-07-28T11:57:48.411152+00:00',
  '2026-07-28T11:57:48.411152+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'ارميا ابراهيم  ألماني',
  '',
  '01080015697',
  NULL,
  '2026-07-28T11:57:52.004409+00:00',
  '2026-07-28T11:57:52.004409+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'منسي منعم عبدالله',
  '',
  '01080015696',
  NULL,
  '2026-07-28T11:57:52.004409+00:00',
  '2026-07-28T11:57:52.004409+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عبدالرحمن صبحى عبدالعزيز',
  'sobhia@pzoneinternational.com',
  '1026881672',
  NULL,
  '2026-07-28T11:57:44.220405+00:00',
  '2026-07-28T11:57:44.220405+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'ناجى نسيم ناشد فهيم',
  '',
  '1270088815',
  NULL,
  '2026-07-28T11:57:44.220405+00:00',
  '2026-07-28T11:57:44.220405+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'طارق علي محمود البطراوي',
  'elbatrawit@pzoneinternational.com',
  '01001415055',
  NULL,
  '2026-07-28T11:57:44.220405+00:00',
  '2026-07-28T11:57:44.220405+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد اسماعيل ابراهيم محمد',
  'ismaila@pzoneinternational.com',
  '01006606736',
  NULL,
  '2026-07-28T11:57:44.220405+00:00',
  '2026-07-28T11:57:44.220405+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد اسماعيل عبد الغنى',
  'noneattiam@pzoneinternational.com',
  '01090043223',
  NULL,
  '2026-07-28T11:57:44.220405+00:00',
  '2026-07-28T11:57:44.220405+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'حمدى حامد ابراهيم محمد على',
  '',
  '1090041899',
  NULL,
  '2026-07-28T11:57:44.220405+00:00',
  '2026-07-28T11:57:44.220405+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'ياسين جعفر عبدالرحمن',
  '',
  '01080015698',
  NULL,
  '2026-07-28T11:57:52.004409+00:00',
  '2026-07-28T11:57:52.004409+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'خالد جوده عبدالعزيز محمد',
  'elmalahk@pzoneinternational.com',
  '01080100543',
  NULL,
  '2026-07-28T11:57:52.004409+00:00',
  '2026-07-28T11:57:52.004409+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'دعاء احمد  فكرى',
  'pzstpc@gmail.com',
  '01024646600',
  NULL,
  '2026-07-28T11:57:52.004409+00:00',
  '2026-07-28T11:57:52.004409+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد محمود زكى تايسون',
  '',
  '',
  NULL,
  '2026-07-28T11:57:52.004409+00:00',
  '2026-07-28T11:57:52.004409+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد العسيلى',
  'osailya@pzoneinternational.com',
  '--',
  NULL,
  '2026-07-28T11:57:52.004409+00:00',
  '2026-07-28T11:57:52.004409+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد على عبدالله',
  'alim@pzoneinternational.com',
  '1006058881',
  NULL,
  '2026-07-28T11:57:52.004409+00:00',
  '2026-07-28T11:57:52.004409+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد السيد جزارة',
  '',
  '1112901282',
  NULL,
  '2026-07-28T11:57:52.004409+00:00',
  '2026-07-28T11:57:52.004409+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'أيمن عبد الستار',
  '',
  '',
  NULL,
  '2026-07-28T11:57:52.004409+00:00',
  '2026-07-28T11:57:52.004409+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد عبد الرحيم',
  '',
  '',
  NULL,
  '2026-07-28T11:57:52.004409+00:00',
  '2026-07-28T11:57:52.004409+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'موريس إبراهيم عبده النقيب',
  '',
  '01222616709',
  NULL,
  '2026-07-28T11:57:52.004409+00:00',
  '2026-07-28T11:57:52.004409+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'أحمد محمود عبد الوهاب عبدالعزيز',
  '',
  '1277048800',
  NULL,
  '2026-07-28T11:57:52.004409+00:00',
  '2026-07-28T11:57:52.004409+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد يحيى محمد',
  '',
  '1027556357',
  NULL,
  '2026-07-28T11:57:52.004409+00:00',
  '2026-07-28T11:57:52.004409+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'أحمد صلاح محمد علي',
  'salaha@pzoneinternational.com',
  '01022828839',
  NULL,
  '2026-07-28T11:57:52.004409+00:00',
  '2026-07-28T11:57:52.004409+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'السيد سليمان السيد ِعامر',
  '',
  '01032977753',
  NULL,
  '2026-07-28T11:57:52.004409+00:00',
  '2026-07-28T11:57:52.004409+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'مجدي محمد عبد الحميد',
  '',
  '1123586154',
  NULL,
  '2026-07-28T11:57:52.004409+00:00',
  '2026-07-28T11:57:52.004409+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'شريف سيد محمود',
  'Mahmouds@pzoneinternational.com',
  '01020033837',
  NULL,
  '2026-07-28T11:57:52.004409+00:00',
  '2026-07-28T11:57:52.004409+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'مؤمن أحمد جودة',
  'Goudam@pzoneinternational.com',
  '01063666786',
  NULL,
  '2026-07-28T11:57:52.004409+00:00',
  '2026-07-28T11:57:52.004409+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'حسن ناصر على محمد',
  'Alih@pzoneinternational.com',
  '01069837175',
  NULL,
  '2026-07-28T11:57:52.004409+00:00',
  '2026-07-29T11:42:19.823043+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'منه الله انور فهمى جاد',
  'Fahmym@pzoneinternational.com',
  '01066607697',
  NULL,
  '2026-07-28T11:57:54.560265+00:00',
  '2026-07-28T11:57:54.560265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'مصطفى محمد سعد سيد احمد',
  'Saidm@pzoneinternational.com',
  '01044553105',
  NULL,
  '2026-07-28T11:57:54.560265+00:00',
  '2026-07-28T11:57:54.560265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'مينا نبيل نصيف فرج الله ميخائيل',
  'Nasifm@pzoneinternational.com',
  '01066031006',
  NULL,
  '2026-07-28T11:57:54.560265+00:00',
  '2026-07-28T11:57:54.560265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'علاء سامي علي الحناوي',
  'Elhenawya@pzoneinternational.com',
  '1050433646',
  NULL,
  '2026-07-28T11:57:54.560265+00:00',
  '2026-07-28T11:57:54.560265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'علي خليفة نظيف علي',
  '',
  '1060289473',
  NULL,
  '2026-07-28T11:57:54.560265+00:00',
  '2026-07-28T11:57:54.560265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد غاشمي عبدالطيف',
  'ghashmym@pzoneinternational.com',
  '1008884291',
  NULL,
  '2026-07-28T11:57:54.560265+00:00',
  '2026-07-28T11:57:54.560265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'رضوان محمد رضوان',
  'radwanr@pzoneinternational.com',
  '1022828815',
  NULL,
  '2026-07-28T11:57:54.560265+00:00',
  '2026-07-28T11:57:54.560265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'نادين وائل السيد وحيد',
  'wahedn@pzoneinternational.com',
  '1019705778',
  NULL,
  '2026-07-28T11:57:54.560265+00:00',
  '2026-07-28T11:57:54.560265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'الحسن احمد سليمان',
  'Solimane@pzoneinternational.com',
  '1060486869',
  NULL,
  '2026-07-28T11:57:54.560265+00:00',
  '2026-07-28T11:57:54.560265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'سعيد احمد محمود  الهاوي',
  '',
  '1044992838',
  NULL,
  '2026-07-28T11:57:54.560265+00:00',
  '2026-07-28T11:57:54.560265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عمرو احمد  الضوى جودة',
  '',
  '1281390199',
  NULL,
  '2026-07-28T11:57:54.560265+00:00',
  '2026-07-28T11:57:54.560265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد عبدالرحيم عبدالله',
  '',
  '10164444221',
  NULL,
  '2026-07-28T11:57:54.560265+00:00',
  '2026-07-28T11:57:54.560265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'امير ايهاب ديمتري',
  'ehaba@pzoneinternational.com',
  '1031355008',
  NULL,
  '2026-07-28T11:57:54.560265+00:00',
  '2026-07-28T11:57:54.560265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'مجدي حسن محمدي',
  '',
  '1044992841',
  NULL,
  '2026-07-28T11:57:54.560265+00:00',
  '2026-07-28T11:57:54.560265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد راتب محمود رشوان',
  '',
  '1149242525',
  NULL,
  '2026-07-28T11:57:54.560265+00:00',
  '2026-07-28T11:57:54.560265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'شريف وجيه عبد العليم',
  'wagehs@pzoneinternational.com',
  '1099832666',
  NULL,
  '2026-07-28T11:57:54.560265+00:00',
  '2026-07-28T11:57:54.560265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد مجدي عبدالرازق محمود',
  '',
  '1060470760',
  NULL,
  '2026-07-28T11:57:54.560265+00:00',
  '2026-07-28T11:57:54.560265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'مدحت فؤاد عبدالعزيز',
  'fouadme@pzoneinternational.com',
  '1021066699',
  NULL,
  '2026-07-28T11:57:54.560265+00:00',
  '2026-07-28T11:57:54.560265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد وجيه عبدالعليم فرج',
  'waheha@pzoneinternational.com',
  '1060464641',
  NULL,
  '2026-07-28T11:57:54.560265+00:00',
  '2026-07-28T11:57:54.560265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد اشرف صلاح الدين البطراوي',
  '',
  '1016672273',
  NULL,
  '2026-07-28T11:57:54.560265+00:00',
  '2026-07-29T10:54:45.902255+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عادل محمد صاوي محمد',
  '',
  '1031355600',
  NULL,
  '2026-07-28T11:57:55.294265+00:00',
  '2026-07-28T11:57:55.294265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عوض عبدالله بسيوني',
  '',
  '1064106661',
  NULL,
  '2026-07-28T11:57:55.294265+00:00',
  '2026-07-28T11:57:55.294265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد عبدالرازق فهمي',
  '',
  '1031357577',
  NULL,
  '2026-07-28T11:57:55.294265+00:00',
  '2026-07-28T11:57:55.294265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'الحسن محمد محمد الحسن',
  'masouda@pzoneinternational.com',
  '1031348800',
  NULL,
  '2026-07-28T11:57:55.294265+00:00',
  '2026-07-28T11:57:55.294265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عمرو شعبان عبدالله خليفة',
  'procdepart1@gmail.com',
  '01008777980',
  NULL,
  '2026-07-28T11:57:44.220405+00:00',
  '2026-07-28T11:57:44.220405+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'ابراهيم احمد عبدالحميد',
  '',
  '01050859538',
  NULL,
  '2026-07-28T11:57:44.220405+00:00',
  '2026-07-28T11:57:44.220405+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عبدالحميد حلمى عبدالحميد عبدالوهاب',
  '',
  '01008577705',
  NULL,
  '2026-07-28T11:57:44.220405+00:00',
  '2026-07-28T11:57:44.220405+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمود محمد على ابراهيم مرزوق',
  '',
  '01009466680',
  NULL,
  '2026-07-28T11:57:44.220405+00:00',
  '2026-07-28T11:57:44.220405+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد ماهر فهمي السيد',
  'mahera@pzoneinternational.com',
  '1080015704',
  NULL,
  '2026-07-28T11:57:55.294265+00:00',
  '2026-07-28T11:57:55.294265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عماد محمد كردي محمد',
  'Kordye@pzoneinternational.com',
  '1009411160',
  NULL,
  '2026-07-28T11:57:55.294265+00:00',
  '2026-07-28T11:57:55.294265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد جمال زكي احمد',
  '',
  '1099144418',
  NULL,
  '2026-07-28T11:57:55.294265+00:00',
  '2026-07-28T11:57:55.294265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد صالح محمد محمد',
  '',
  '1080442249',
  NULL,
  '2026-07-28T11:57:55.294265+00:00',
  '2026-07-28T11:57:55.294265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد ناصر محمود عبدالباقي',
  'naserm@pzoneinternational.com',
  '1020822100',
  NULL,
  '2026-07-28T11:57:55.294265+00:00',
  '2026-07-28T11:57:55.294265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'علاء علي محمد علي',
  '',
  '1070540092',
  NULL,
  '2026-07-28T11:57:55.294265+00:00',
  '2026-07-28T11:57:55.294265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'مينا مكرم شارونى واصف',
  'makramm@pzoneinternational.com',
  '01044553101',
  NULL,
  '2026-07-28T11:57:42.402703+00:00',
  '2026-07-28T11:57:42.402703+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عبدالرحمن ابراهيم كمال',
  'ebrahimr@pzoneinternational.com',
  '01044992839',
  NULL,
  '2026-07-28T11:57:42.402703+00:00',
  '2026-07-28T11:57:42.402703+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'مصطفى عمر كامل على',
  'omarm@pzoneinternational.com',
  '01022844113',
  NULL,
  '2026-07-28T11:57:42.402703+00:00',
  '2026-07-28T11:57:42.402703+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'حسن عبدالمطلب حسن',
  'shohaibh@pzoneinternational.com',
  '01064076660',
  NULL,
  '2026-07-28T11:57:42.402703+00:00',
  '2026-07-28T11:57:42.402703+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عبد الله سيد احمد عبد الله',
  'sayedahmeda@pzoneinternational.com',
  '01094333241',
  NULL,
  '2026-07-28T11:57:42.402703+00:00',
  '2026-07-28T11:57:42.402703+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'نادين عبدالرحيم على احمد',
  'abdelrehimn@pzoneinternational.com',
  '01025554469',
  NULL,
  '2026-07-28T11:57:42.402703+00:00',
  '2026-07-28T11:57:42.402703+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد حسن عبدالتواب شهيب',
  'Tawabm@pzoneinternational.com',
  '01044992838',
  NULL,
  '2026-07-28T11:57:42.402703+00:00',
  '2026-07-28T11:57:42.402703+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'امير مصطفى سليمان محمد',
  'mostafaa@pzoneinternational.com',
  '01066220351',
  NULL,
  '2026-07-28T11:57:42.402703+00:00',
  '2026-07-28T11:57:42.402703+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'ماريانا عز كمال غالى',
  '',
  '1201834343',
  NULL,
  '2026-07-28T11:58:00.827192+00:00',
  '2026-07-28T11:58:00.827192+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عنتر احمد رتيب علي',
  '',
  '1201135902',
  NULL,
  '2026-07-28T11:57:55.294265+00:00',
  '2026-07-28T11:57:55.294265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد طارق البطراوي',
  'elbatrawim@pzoneinternational.com',
  '1115147888',
  NULL,
  '2026-07-28T11:57:55.294265+00:00',
  '2026-07-28T11:57:55.294265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'يوسف زكي محمد زكي',
  'zakiy@pzoneinternational.com',
  '01024499884',
  NULL,
  '2026-07-28T11:57:55.294265+00:00',
  '2026-07-28T11:57:55.294265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عبدالله جمال سيد محمود',
  'gamalas@pzoneinternational.com',
  '1032980999',
  NULL,
  '2026-07-28T11:57:55.294265+00:00',
  '2026-07-28T11:57:55.294265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عمر سامي عبدالهادي هلال',
  '',
  '1554332499',
  NULL,
  '2026-07-28T11:57:55.294265+00:00',
  '2026-07-28T11:57:55.294265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'اشرف ابراهيم محمود احمد',
  'Ibrahima@pzoneinternational.com',
  '01050434497',
  NULL,
  '2026-07-28T11:57:55.294265+00:00',
  '2026-07-28T11:57:55.294265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'مصطفي علي ابو العلا حربي',
  '',
  '1050433836',
  NULL,
  '2026-07-28T11:57:55.294265+00:00',
  '2026-07-28T11:57:55.294265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'مصطفي علي احمد محمد ربيع',
  'rabiem@pzoneinternational.com',
  '01032985222',
  NULL,
  '2026-07-28T11:57:55.294265+00:00',
  '2026-07-28T11:57:55.294265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'طنطاوي محمد مرشدي',
  '',
  '01031370055',
  NULL,
  '2026-07-28T11:57:55.294265+00:00',
  '2026-07-28T11:57:55.294265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'جلال عبدالعاطي صادق حسن',
  '',
  '1034443697',
  NULL,
  '2026-07-28T11:57:55.294265+00:00',
  '2026-07-28T11:57:55.294265+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'انور مجدي محمود محمد',
  '',
  '1031722009',
  NULL,
  '2026-07-28T11:57:58.568556+00:00',
  '2026-07-28T11:57:58.568556+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عبد الرحمن احمد محمد عبدالمعطي',
  'ahmeda@pzoneinternational.com',
  '1099188838',
  NULL,
  '2026-07-28T11:57:58.568556+00:00',
  '2026-07-28T11:57:58.568556+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'نرمين جمال محمود احمد',
  'mahmoudn@pzoneinternational.com',
  '01021111762',
  NULL,
  '2026-07-28T11:57:58.568556+00:00',
  '2026-07-28T11:57:58.568556+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد شعبان توني عبد الدايم',
  '',
  '1272321897',
  NULL,
  '2026-07-28T11:57:58.568556+00:00',
  '2026-07-28T11:57:58.568556+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمود خالد احمد علي',
  '',
  '1117027500',
  NULL,
  '2026-07-28T11:57:58.568556+00:00',
  '2026-07-28T11:57:58.568556+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عبدالخالق غريب عبدالخالق محمد',
  '',
  '1208422133',
  NULL,
  '2026-07-28T11:57:58.568556+00:00',
  '2026-07-28T11:57:58.568556+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عمر نبيل عبد العال حسن',
  '',
  '1028977768',
  NULL,
  '2026-07-28T11:57:58.568556+00:00',
  '2026-07-28T11:57:58.568556+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد طارق محمد أنيس',
  '',
  '1031700227',
  NULL,
  '2026-07-28T11:57:58.568556+00:00',
  '2026-07-28T11:57:58.568556+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد طارق فتحي عبد الهادي ربيع',
  'tarekm@pzoneinternational.com',
  '1063113041',
  NULL,
  '2026-07-28T11:57:58.568556+00:00',
  '2026-07-28T11:57:58.568556+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'كريم عادل عدلي عبد الجواد',
  '',
  '1067246383',
  NULL,
  '2026-07-28T11:57:58.568556+00:00',
  '2026-07-28T11:57:58.568556+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'أحمد يحيى إسماعيل عبد الحميد',
  '',
  '1002746461',
  NULL,
  '2026-07-28T11:57:58.568556+00:00',
  '2026-07-28T11:57:58.568556+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد كامل عبدالرازق عبدالله',
  '',
  '01091631397',
  NULL,
  '2026-07-28T11:57:58.568556+00:00',
  '2026-07-28T11:57:58.568556+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'اشرف حمدي محمد محمد',
  '',
  '01031956553',
  NULL,
  '2026-07-28T11:57:58.568556+00:00',
  '2026-07-28T11:57:58.568556+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'السيد محمود أحمد عوض',
  'mahmoude@pzoneinternational.com',
  '01034443698',
  NULL,
  '2026-07-28T11:57:58.568556+00:00',
  '2026-07-28T11:57:58.568556+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد محمد البكري السيد',
  '',
  '01031695500',
  NULL,
  '2026-07-28T11:57:58.568556+00:00',
  '2026-07-28T11:57:58.568556+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'مصطفي محمد  مصطفي محمد سليم',
  'selimm@pzoneinternational.com',
  '01044992837',
  NULL,
  '2026-07-28T11:57:58.568556+00:00',
  '2026-07-28T11:57:58.568556+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'جلال السيد ابراهيم السيد حموده',
  '',
  '01024641999',
  NULL,
  '2026-07-28T11:57:58.568556+00:00',
  '2026-07-28T11:57:58.568556+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد ممدوح حسن علي عزام',
  '',
  '01031683300',
  NULL,
  '2026-07-28T11:57:58.568556+00:00',
  '2026-07-28T11:57:58.568556+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عمر صبري مصطفي اسماعيل',
  '',
  '01070774713',
  NULL,
  '2026-07-28T11:57:58.568556+00:00',
  '2026-07-28T11:57:58.568556+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'أحمد محمد مصطفى محمد سليم',
  '',
  '01033317832',
  NULL,
  '2026-07-28T11:57:58.568556+00:00',
  '2026-07-28T11:57:58.568556+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عبدالله سيد حسن سلامة',
  'salamaa@pzoneinternational.com',
  '01222768680',
  NULL,
  '2026-07-28T11:58:00.827192+00:00',
  '2026-07-28T11:58:00.827192+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'اميره مصطفي سليمان محمد ذكي',
  '',
  '010959524973',
  NULL,
  '2026-07-28T11:58:00.827192+00:00',
  '2026-07-28T11:58:00.827192+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد ناصر محمود عبد الباقي',
  '',
  '1204137283',
  NULL,
  '2026-07-28T11:58:00.827192+00:00',
  '2026-07-28T11:58:00.827192+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد فاروق سعد الدين احمد',
  '',
  '01128959059',
  NULL,
  '2026-07-28T11:58:00.827192+00:00',
  '2026-07-28T11:58:00.827192+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عبدالرحمن جمال عبدالعظيم محمد',
  '',
  '01019890766',
  NULL,
  '2026-07-28T11:58:00.827192+00:00',
  '2026-07-28T11:58:00.827192+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'علي سيد علي إبراهيم',
  '',
  '01157425244',
  NULL,
  '2026-07-28T11:58:00.827192+00:00',
  '2026-07-28T11:58:00.827192+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'كريم احمد محمد حسن',
  '',
  '01550199750',
  NULL,
  '2026-07-28T11:58:00.827192+00:00',
  '2026-07-28T11:58:00.827192+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد مجدى مندى حافظ',
  '',
  '01228314165',
  NULL,
  '2026-07-28T11:58:00.827192+00:00',
  '2026-07-28T11:58:00.827192+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عمر خالد جوده عبدالعزيز',
  '',
  '01016887633',
  NULL,
  '2026-07-28T11:58:00.827192+00:00',
  '2026-07-28T11:58:00.827192+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمود هشام علي محمود البطراوي',
  'elbatrawih@pzoneinternational.com',
  '01224387313',
  NULL,
  '2026-07-28T11:57:42.402703+00:00',
  '2026-07-28T11:57:42.402703+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'مهدى  محمد قاسم مهدى الشيخ',
  'alshaikhm@pzoneinternational.com',
  '01006606738',
  NULL,
  '2026-07-28T11:57:42.402703+00:00',
  '2026-07-28T11:57:42.402703+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'ماهيتاب هشام نبيه محجوب',
  'mahgoubm@pzoneinternational.com',
  '01024557766',
  NULL,
  '2026-07-28T11:57:42.402703+00:00',
  '2026-07-28T11:57:42.402703+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'ايهاب انور محمد زكى حسن',
  'anware@pzoneinternational.com',
  '01099858877',
  NULL,
  '2026-07-28T11:57:42.402703+00:00',
  '2026-07-28T11:57:42.402703+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمود سيد محمود سابق',
  'sabekm@pzoneinternational.com',
  '01014522283',
  NULL,
  '2026-07-28T11:57:42.402703+00:00',
  '2026-07-28T11:57:42.402703+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد السعيد محمود محمد',
  'Elsaiedm@pzoneinternational.com',
  '01006022901',
  NULL,
  '2026-07-28T11:57:42.402703+00:00',
  '2026-07-28T11:57:42.402703+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'حازم نصر نصر حسن',
  'nasrh@pzoneinternational.com',
  '01022146800',
  NULL,
  '2026-07-28T11:57:42.402703+00:00',
  '2026-07-28T11:57:42.402703+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عمرو جمال محمد',
  'Gamala@pzoneinternational.com',
  '01050859540',
  NULL,
  '2026-07-28T11:57:42.402703+00:00',
  '2026-07-28T11:57:42.402703+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد طارق حداد ابراهيم',
  'tareka@pzoneinternational.com',
  '01022836366',
  NULL,
  '2026-07-28T11:57:42.402703+00:00',
  '2026-07-28T11:57:42.402703+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'سيف طارق عبدالعال حسنى توكل',
  'tawakols@pzoneinternational.com',
  '01044553102',
  NULL,
  '2026-07-28T11:57:42.402703+00:00',
  '2026-07-28T11:57:42.402703+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عبدالرحمن عمرو فاروق حسين',
  'amra@pzoneinternational.com',
  '01044992835',
  NULL,
  '2026-07-28T11:57:42.402703+00:00',
  '2026-07-28T11:57:42.402703+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد محمود عثمان إسماعيل',
  '',
  '01145346841
 01034694148',
  NULL,
  '2026-07-28T11:58:01.648304+00:00',
  '2026-07-28T11:58:01.648304+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمود محمد سمير محمود',
  '',
  '01099959191',
  NULL,
  '2026-07-28T11:58:01.648304+00:00',
  '2026-07-28T11:58:01.648304+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد محمود الطاهر إبراهيم محمد',
  '',
  '01142952051
 01069977990',
  NULL,
  '2026-07-28T11:58:01.648304+00:00',
  '2026-07-28T11:58:01.648304+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد أسعد احمد السيد',
  '',
  '1032143258',
  NULL,
  '2026-07-28T11:58:01.648304+00:00',
  '2026-07-28T11:58:01.648304+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'مصطفي حسن حافظ مصطفي',
  '',
  '01007689770',
  NULL,
  '2026-07-28T11:58:01.648304+00:00',
  '2026-07-28T11:58:01.648304+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عباس خلف السيد احمد عمر',
  '',
  '01099427519',
  NULL,
  '2026-07-28T11:58:01.648304+00:00',
  '2026-07-28T11:58:01.648304+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمود مصطفي عبد القادر سيداحمد',
  '',
  '01022013110',
  NULL,
  '2026-07-28T11:58:01.648304+00:00',
  '2026-07-28T11:58:01.648304+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'اكرم محمد عبد العليم علي',
  '',
  '01110771473',
  NULL,
  '2026-07-28T11:58:01.648304+00:00',
  '2026-07-28T11:58:01.648304+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'كريم محمد علي محمود محمد',
  '',
  '01152099815',
  NULL,
  '2026-07-28T11:58:01.648304+00:00',
  '2026-07-28T11:58:01.648304+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'ماهر يوسف عربيات ابراهيم',
  '',
  '',
  NULL,
  '2026-07-28T11:58:00.827192+00:00',
  '2026-07-28T11:58:00.827192+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد احمد محمد احمد محمد',
  '',
  '01122909930',
  NULL,
  '2026-07-28T11:58:01.648304+00:00',
  '2026-07-28T11:58:01.648304+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'أسامة محمدي محمد سيد',
  '',
  '01113203240',
  NULL,
  '2026-07-28T11:58:01.648304+00:00',
  '2026-07-28T11:58:01.648304+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'حسن عاطف احمد علي',
  '',
  '01126550880',
  NULL,
  '2026-07-28T11:58:01.648304+00:00',
  '2026-07-28T11:58:01.648304+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'هند سمير عبدالرحيم محمد',
  '',
  '01096039611',
  NULL,
  '2026-07-28T11:58:01.648304+00:00',
  '2026-07-28T11:58:01.648304+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'كوثر بشري عبد الحميد الليثي',
  '',
  '01004117999',
  NULL,
  '2026-07-28T11:58:01.648304+00:00',
  '2026-07-28T11:58:01.648304+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'سعودي معوض عيسي حسن علي',
  '',
  '01102941593',
  NULL,
  '2026-07-28T11:58:01.648304+00:00',
  '2026-07-28T11:58:01.648304+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'ماجد زكريا سنوسي محمد منظور',
  '',
  '01015279671',
  NULL,
  '2026-07-28T11:58:01.648304+00:00',
  '2026-07-28T11:58:01.648304+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد عيد يوسف علي شريف',
  '',
  '01093214661',
  NULL,
  '2026-07-28T11:58:01.648304+00:00',
  '2026-07-28T11:58:01.648304+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'حسين عبد الناصر صديق حسونة',
  '',
  '01142573866',
  NULL,
  '2026-07-28T11:58:07.641293+00:00',
  '2026-07-28T11:58:07.641293+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'خالد حامد احمد إبراهيم',
  '',
  '',
  NULL,
  '2026-07-28T11:58:07.641293+00:00',
  '2026-07-28T11:58:07.641293+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمود محمد عبد اللطيف',
  '',
  '01110562135',
  NULL,
  '2026-07-28T11:58:07.641293+00:00',
  '2026-07-28T11:58:07.641293+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'ميدينو موسي كوكو',
  '',
  '',
  NULL,
  '2026-07-28T11:58:07.641293+00:00',
  '2026-07-28T11:58:07.641293+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد عبد اللطيف محمود احمد المناوي',
  '',
  '01090177295',
  NULL,
  '2026-07-28T11:58:07.641293+00:00',
  '2026-07-28T11:58:07.641293+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمود عادل عبد الحكيم السيد',
  '',
  '01272270707',
  NULL,
  '2026-07-28T11:58:07.641293+00:00',
  '2026-07-28T11:58:07.641293+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'اسراء احمد إبراهيم صلاح الدين',
  '',
  '01229218429',
  NULL,
  '2026-07-28T11:58:07.641293+00:00',
  '2026-07-28T11:58:07.641293+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد صبري غريب عبد الرحيم',
  '',
  '01092565747',
  NULL,
  '2026-07-28T11:58:07.641293+00:00',
  '2026-07-28T11:58:07.641293+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'حنان السيد عبد الفتاح السيد محمد',
  '',
  '01004759101',
  NULL,
  '2026-07-28T11:58:07.641293+00:00',
  '2026-07-28T11:58:07.641293+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد أشرف محمد فرج جاد',
  '',
  '01224787510',
  NULL,
  '2026-07-28T11:58:07.641293+00:00',
  '2026-07-28T11:58:07.641293+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد أشرف أحمد التجاني',
  '',
  '01080719873',
  NULL,
  '2026-07-28T11:58:07.641293+00:00',
  '2026-07-28T11:58:07.641293+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'سيف حاتم زكريا عبدالمنعم',
  'hatems@pzoneinternational.com',
  '01070540097',
  NULL,
  '2026-07-28T11:57:42.402703+00:00',
  '2026-07-28T11:57:42.402703+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عزت حميد بسيونى غالى',
  '',
  '01070534995',
  NULL,
  '2026-07-28T11:57:44.220405+00:00',
  '2026-07-28T11:57:44.220405+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمود عبدالحميد ابراهيم',
  'abdelhamidm@pzoneinternational.com',
  '01080015703',
  NULL,
  '2026-07-28T11:57:44.220405+00:00',
  '2026-07-28T11:57:44.220405+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'ندى طاهر محمدى نوير',
  'tahern@pzoneinternational.com',
  '01050361115',
  NULL,
  '2026-07-28T11:57:44.220405+00:00',
  '2026-07-28T11:57:44.220405+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'بيتر عادل عطا الله سليم',
  '',
  '',
  NULL,
  '2026-07-28T11:58:00.827192+00:00',
  '2026-07-28T11:58:00.827192+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد فتوح رضوان محمود',
  'fatouhm@pzoneinternational.com',
  '01099500196',
  NULL,
  '2026-07-28T11:57:43.488+00:00',
  '2026-07-28T11:57:43.488+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'شروق محمد زكريا السيد',
  'zakarias@pzoneinternational.com',
  '01050377796',
  NULL,
  '2026-07-28T11:57:43.488+00:00',
  '2026-07-28T11:57:43.488+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد السيد محمود السيد',
  'pzerpm@gmail.com',
  '01004593857',
  NULL,
  '2026-07-28T11:57:43.488+00:00',
  '2026-07-28T11:57:43.488+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عمرو فيصل اسماعيل ابراهيم العربي',
  'faisala@pzoneinternational.com',
  '01033316306',
  NULL,
  '2026-07-28T11:57:43.488+00:00',
  '2026-07-28T11:57:43.488+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'خالد اسماعيل ابراهيم محمد',
  'ismaelkh@pzoneinternational.com',
  '01061777803',
  NULL,
  '2026-07-28T11:57:43.488+00:00',
  '2026-07-28T11:57:43.488+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد محمد شحاتة عبدالجليل',
  'mohameda@pzoneinternational.com',
  '01022855665',
  NULL,
  '2026-07-28T11:57:43.488+00:00',
  '2026-07-28T11:57:43.488+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عبد الرحمن حمدى ابراهيم عزب',
  'azaba@pzoneinternational.com',
  '01050222189',
  NULL,
  '2026-07-28T11:57:43.488+00:00',
  '2026-07-28T11:57:43.488+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'بسام البدرى عبد اللطيف احمد',
  'elbadryb@pzoneinternational.com',
  '01033316581',
  NULL,
  '2026-07-28T11:57:43.488+00:00',
  '2026-07-28T11:57:43.488+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'اسامه محمد ابراهيم السيد شاهين',
  'Shahino@pzoneinternational.com',
  '010066605687',
  NULL,
  '2026-07-28T11:57:43.488+00:00',
  '2026-07-28T11:57:43.488+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد شعبان زايد محمد',
  '',
  '01009577796',
  NULL,
  '2026-07-28T11:57:43.488+00:00',
  '2026-07-28T11:57:43.488+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'خالد اشرف على',
  'ashrafk@pzoneinternational.com',
  '1008690007',
  NULL,
  '2026-07-28T11:57:43.488+00:00',
  '2026-07-28T11:57:43.488+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'مصطفى عادل عبدالرحمن محمود عوض',
  'abdelrahman@pzoneinternational.com',
  '01080015695',
  NULL,
  '2026-07-28T11:57:43.488+00:00',
  '2026-07-28T11:57:43.488+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد حمدى فتحى ابوالغيث',
  '',
  '01070474455',
  NULL,
  '2026-07-28T11:57:43.488+00:00',
  '2026-07-28T11:57:43.488+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'وائل سعيد محمود ضحا',
  'Saeedw@pzoneinternational.com',
  '01099500362',
  NULL,
  '2026-07-28T11:57:43.488+00:00',
  '2026-07-28T11:57:43.488+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'ابراهيم جمعة ابراهيم عبدالرحمن',
  'gomaai@pzoneinternational.com',
  '01099132221',
  NULL,
  '2026-07-28T11:57:43.488+00:00',
  '2026-07-28T11:57:43.488+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عبد الرحمن مصطفى محمد طه',
  '',
  '01278556020',
  NULL,
  '2026-07-28T11:58:00.827192+00:00',
  '2026-07-28T11:58:00.827192+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'مصطفى امير احمد مختار',
  'amirm@pzoneinternational.com',
  '01050390804',
  NULL,
  '2026-07-28T11:57:43.488+00:00',
  '2026-07-28T11:57:43.488+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'مينا سمير توفيق ابراهيم',
  'samirm@pzoneinternational.com',
  '01099858552',
  NULL,
  '2026-07-28T11:57:43.488+00:00',
  '2026-07-28T11:57:43.488+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'ابراهيم حسن عبدالعليم سيد',
  '',
  '01044992836',
  NULL,
  '2026-07-28T11:57:43.488+00:00',
  '2026-07-28T11:57:43.488+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محمد حسن على ابوالليل السيد',
  '',
  '01066220439',
  NULL,
  '2026-07-28T11:57:43.488+00:00',
  '2026-07-28T11:57:43.488+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عبدالرحمن سعد مبروك',
  'saada@pzoneinternational.com',
  '1014822888',
  NULL,
  '2026-07-28T11:57:43.488+00:00',
  '2026-07-28T11:57:43.488+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'مصطفى عبد المحسن ابراهيم',
  '',
  '01064516663',
  NULL,
  '2026-07-28T11:57:44.220405+00:00',
  '2026-07-28T11:57:44.220405+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'ناهد محمود محمد رشاد',
  'rashedn@pzoneinternational.com',
  '01080015693',
  NULL,
  '2026-07-28T11:57:44.220405+00:00',
  '2026-07-28T11:57:44.220405+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'ندى جمال محمد عبدالشافى',
  'gamaln@pzoneinternational.com',
  '01050222179',
  NULL,
  '2026-07-28T11:57:44.220405+00:00',
  '2026-07-28T11:57:44.220405+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'بولا موريس فوزى مسعود',
  'morisb@pzoneinternational.com',
  '01069826535',
  NULL,
  '2026-07-28T11:57:44.220405+00:00',
  '2026-07-28T11:57:44.220405+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد هانى عبدالفتاح على',
  '',
  '01211479773',
  NULL,
  '2026-07-28T11:58:00.827192+00:00',
  '2026-07-28T11:58:00.827192+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عامر هانى عامر زكى',
  '',
  '01205070268',
  NULL,
  '2026-07-28T11:58:00.827192+00:00',
  '2026-07-28T11:58:00.827192+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد السيد ابراهيم محمد ابوالمجد',
  '',
  '01098949459',
  NULL,
  '2026-07-28T11:58:00.827192+00:00',
  '2026-07-28T11:58:00.827192+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'حسام زكريا سنوسى محمد',
  '',
  '01015147330',
  NULL,
  '2026-07-28T11:58:00.827192+00:00',
  '2026-07-28T11:58:00.827192+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'عبدالله جمال محمدى منظور',
  '',
  '01280404684',
  NULL,
  '2026-07-28T11:58:00.827192+00:00',
  '2026-07-28T11:58:00.827192+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'احمد سعيد صالح فرج الله',
  '',
  '01097750463',
  NULL,
  '2026-07-28T11:58:00.827192+00:00',
  '2026-07-28T11:58:00.827192+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'نهلة سامي محمد عامر',
  '',
  '01556097939',
  NULL,
  '2026-07-28T11:58:07.641293+00:00',
  '2026-07-28T11:58:07.641293+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'خالد عبد الخالق خالد احمد',
  '',
  '01002305274',
  NULL,
  '2026-07-28T11:58:07.641293+00:00',
  '2026-07-29T12:10:06.050527+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'اية السيد محمد فاروز',
  'sayeda@pzoneinternational.com',
  '01066220357',
  NULL,
  '2026-07-28T11:57:44.220405+00:00',
  '2026-07-28T11:57:44.220405+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'محاسن عيد مرسى',
  'eidm@pzoneinternational.com',
  '01080015702',
  NULL,
  '2026-07-28T11:57:44.220405+00:00',
  '2026-07-28T11:57:44.220405+00:00'
);


INSERT INTO public.stakeholders (name_ar, email, phone, role, created_at, updated_at)
VALUES (
  'اسماء عبدالمنعم عيسوى',
  'abdelmenema@pzoneinternational.com',
  '01064666801',
  NULL,
  '2026-07-28T11:57:44.220405+00:00',
  '2026-07-28T11:57:44.220405+00:00'
);


-- 4. Insert projects
INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '700b5ea3-39e8-4539-b4a3-194e9ddf4976',
  NULL,
  '1044',
  'Project 1044',
  'التجمع',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '573d019f-b9fc-4af3-88b3-80c1439b5f2a',
  NULL,
  '2105',
  'Project 2105',
  'التجمع',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '3e070749-03bd-479d-81ff-577b78d0d982',
  NULL,
  '2111',
  'Project 2111',
  'العاصمة',
  'on_hold',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  'Migrated legacy on_hold project'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  'aa022cc3-2385-4a13-a13f-018a49e30031',
  NULL,
  '2113',
  'Project 2113',
  'اكتوبر',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '76116142-3643-4f6a-9ad2-60c5c279611f',
  NULL,
  '2119',
  'Project 2119',
  'اكتوبر',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '5f63e871-28cb-4250-80c3-95ab1bcaff85',
  NULL,
  '2120',
  'Project 2120',
  'الشروق',
  'on_hold',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  'Migrated legacy on_hold project'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '1ba04f8e-2d3a-45f2-82a6-e17a9d77cbf4',
  NULL,
  '2131',
  'Project 2131',
  'العاصمة',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '7ce59fc2-356a-4e9c-ad1d-36fdaddf22c8',
  NULL,
  '2106',
  'Project 2106',
  'التجمع',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '449f2a5f-3370-495d-8324-2888d49ff5d9',
  NULL,
  '2135',
  'Project 2135',
  'الزمالك',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '11a968ab-f555-4333-bdd1-f683d424751e',
  NULL,
  '2141',
  'Project 2141',
  'التجمع',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  'c294ec82-a8c5-45ed-97af-6bb3271c2c91',
  NULL,
  '2145',
  'Project 2145',
  'المقطم',
  'on_hold',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  'Migrated legacy on_hold project'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '7c0a800d-b696-4c5b-8bd8-0a8a9102b3e4',
  NULL,
  '2269',
  'Project 2269',
  'العاصمة',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '46390de9-08f2-457d-a64a-213c30fd0111',
  NULL,
  '2272',
  'Project 2272',
  'التجمع',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  'e38cd1e1-a62a-4571-b3e8-3f7fe3ffc02a',
  NULL,
  '2272-dup',
  'Project 2272',
  'التجمع',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '811031f9-85c8-4542-b2ae-5bc84f73fc74',
  NULL,
  '2275',
  'Project 2275',
  'القاهرة الجديدة',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '231a94b6-2617-45a7-8c11-a61292adc801',
  NULL,
  '2302',
  'Project 2302',
  'الاسماعيلية',
  'on_hold',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  'Migrated legacy on_hold project'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '3b395aa1-9396-41b6-abde-13610fae2c92',
  NULL,
  '2304',
  'Project 2304',
  'El mostakbl city',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  'fb30ce25-66a3-4910-8a58-36db9966de0f',
  NULL,
  '2308',
  'Project 2308',
  'العاصمة',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '231367d7-a217-48dc-9bba-6acaa9c44455',
  NULL,
  '2309',
  'Project 2309',
  'التجمع',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '68d0173d-91ad-46d1-afe4-9ce6ee3e16f1',
  NULL,
  '2325',
  'Project 2325',
  'El mostakbl city',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '60ea2b9d-1a2c-4013-beef-dc21d438ce30',
  NULL,
  '2326',
  'Project 2326',
  'الجونة',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '6851d585-a139-41b7-ab7c-9d1b6be091aa',
  NULL,
  '2327',
  'Project 2327',
  'اكتوبر',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '1141dcde-291f-4ea2-82a1-654a14c4c5fc',
  NULL,
  '2328',
  'Project 2328',
  'القاهرة الجديدة',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '6951e1d2-41af-443b-b738-b4433ce780a8',
  NULL,
  '2331',
  'Project 2331',
  'North coast',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '3e555df6-c796-4888-b633-0e3a39711831',
  NULL,
  '2332',
  'Project 2332',
  'el sokhna',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  'bc05c323-7d4c-4f72-bb4d-4f545a88c0b0',
  NULL,
  '2333',
  'Project 2333',
  'العاصمة',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  'c05b0cd3-ce07-4668-abe0-4071aea1399e',
  NULL,
  '2334',
  'Project 2334',
  'North coast',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '1b652ccc-b137-4325-b429-c6e71c7e5600',
  NULL,
  '2335',
  'Project 2335',
  'اكتوبر',
  'on_hold',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  'Migrated legacy on_hold project'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  'bdfeb8e3-9936-417a-a354-1cfd9feef194',
  NULL,
  '2336',
  'Project 2336',
  'الشروق',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '619d92f7-a5f9-4f0f-8d35-f70e8b4fd620',
  NULL,
  '2337',
  'Project 2337',
  'el sokhna',
  'on_hold',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  'Migrated legacy on_hold project'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '79b58e99-0e08-44d9-b976-4b42445f301e',
  NULL,
  '2401',
  'Project 2401',
  'North coast',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '046013f3-8545-4316-9fed-9974b4bebb58',
  NULL,
  '2402',
  'Project 2402',
  'North coast',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  'e2d81d98-18e9-4296-83fd-573996cb4720',
  NULL,
  '2403',
  'Project 2403',
  'North coast',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '50e32c4d-7a59-4f2c-be79-0f59ff202fc4',
  NULL,
  '2404',
  'Project 2404',
  'North coast',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '13b24e0f-7a4b-4a61-90c3-d97bb606eae9',
  NULL,
  '2405',
  'Project 2405',
  'North coast',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '32b43d53-ae56-40be-a1dd-85c9b21ec6ab',
  NULL,
  '2406',
  'Project 2406',
  'القاهرة الجديدة',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '49531ead-2ec2-4fd4-976f-17a5db252a21',
  NULL,
  '2407',
  'Project 2407',
  'North coast',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '0f0bfe13-1aad-4e99-980c-cac1164fb5e8',
  NULL,
  '2408',
  'Project 2408',
  'العاصمة',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '86d75eb8-09b7-4006-973e-1ab24f933521',
  NULL,
  '2409',
  'Project 2409',
  'الشروق',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '6c2223e8-cc42-4c78-a03d-b470ed64edbf',
  NULL,
  '2410',
  'Project 2410',
  'North coast',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  'e52f5035-7617-486d-b0ca-657d3f2ac107',
  NULL,
  '2411',
  'Project 2411',
  'اكتوبر',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  'bb9140aa-d72e-4f8b-ade6-26970b82ea19',
  NULL,
  '2412',
  'Project 2412',
  'North coast',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '7bba9790-4780-4871-b82e-05b423542804',
  NULL,
  '2413',
  'Project 2413',
  'القاهرة الجديدة',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  'd4668512-1df6-4941-83fd-86fbcc46c7a2',
  NULL,
  '2414',
  'Project 2414',
  'التجمع',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '2f8f55d9-0da6-428c-862f-28d296804e65',
  NULL,
  '2415',
  'Project 2415',
  'اكتوبر',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  'a1e310a2-cc05-426e-8b4a-f154358a9e00',
  NULL,
  '2416',
  'Project 2416',
  'القاهرة الجديدة',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  'aae3efb9-c5a7-409d-9253-43528ce1f5cd',
  NULL,
  '2417',
  'Project 2417',
  'التجمع',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  'a0518d01-2f40-4ef9-a34c-c623794a0de4',
  NULL,
  '2418',
  'Project 2418',
  'التجمع',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '5e02f8ba-5d04-40cd-ba1b-beb5cff009fd',
  NULL,
  '2419',
  'Project 2419',
  'North coast',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '917e8247-a71e-4fe5-bc52-ffb54e49ef63',
  NULL,
  '2420',
  'Project 2420',
  'القاهرة الجديدة',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '7c2e5f01-90b3-4b0e-a9b6-f69fa5ebc359',
  NULL,
  '2421',
  'Project 2421',
  'North coast',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '485f7b5b-6284-4e4a-aafc-f9b2758aede0',
  NULL,
  '2422',
  'Project 2422',
  'North coast',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  'f6480ded-b679-4e67-a821-514bcfd1ee4d',
  NULL,
  '2501',
  'Project 2501',
  'North coast',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '84fad664-3601-4624-a054-64512c3a5571',
  NULL,
  '2502',
  'Project 2502',
  'North coast',
  'on_hold',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  'Migrated legacy on_hold project'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '48113e1d-778c-401a-8a2a-dbaa35ba4a99',
  NULL,
  '2503',
  'Project 2503',
  'القاهرة الجديدة',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '894d4304-338a-4411-8959-d34db1aaa51c',
  NULL,
  '2504',
  'Project 2504',
  'اكتوبر',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  'b5281944-0df3-4fdc-9e38-6c57ff4cbb7f',
  NULL,
  '2505',
  'Project 2505',
  'القاهرة الجديدة',
  'on_hold',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  'Migrated legacy on_hold project'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '71a287e4-26b9-45bd-954b-79eb4a5a7d94',
  NULL,
  '2506',
  'Project 2506',
  'North coast',
  'on_hold',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  'Migrated legacy on_hold project'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '47c5a1d7-86f8-454d-8cda-86c51fc0167a',
  NULL,
  '2507',
  'Project 2507',
  'North coast',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  'b3cf75f3-2294-4e7a-93f6-48a0d8d03e70',
  NULL,
  '2508',
  'Project 2508',
  'North coast',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  'e8091777-ccde-43b7-b153-606f8ed84584',
  NULL,
  '2509',
  'Project 2509',
  'القاهرة الجديدة',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '1c4b6329-097a-4cd4-af88-8eabb7948734',
  NULL,
  '2510',
  'Project 2510',
  'North coast',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '5dd4a6a2-2f34-4777-a2ea-481dba37acf5',
  NULL,
  '2511',
  'Project 2511',
  'North coast',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  'b892e01c-ad6f-498b-97eb-5b9d67088229',
  NULL,
  '2512',
  'Project 2512',
  'North coast',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '6aebfaa1-d35c-49b0-8717-dd2a86c5ac4c',
  NULL,
  '2513',
  'Project 2513',
  'العاصمة',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '6214b75c-9a37-483d-98b2-e9228f803d1f',
  NULL,
  '2514',
  'Project 2514',
  'الجونة',
  'finished',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '8f42e723-2325-4d51-a897-4f68f5033b8c',
  NULL,
  '2601',
  'Project 2601',
  'القاهرة الجديدة',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '69ffadf1-407d-467f-9e84-331c41ae9e4d',
  NULL,
  '2602',
  'Project 2602',
  'اكتوبر',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '6855ab71-43bd-4422-8782-29bf55e60685',
  NULL,
  '2603',
  'Project 2603',
  'القاهرة الجديدة',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '5a352144-7059-4ea1-87d1-dc4a217ec07b',
  NULL,
  '2604',
  'Project 2604',
  'North coast',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '46032b54-698a-4918-b50c-f02343c27386',
  NULL,
  '2605',
  'Project 2605',
  'الأقصر',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '7296439e-5866-427d-9aea-266760f758cc',
  NULL,
  '2606',
  'Project 2606',
  'اكتوبر',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T14:45:23.379798+00:00',
  '2026-07-23T14:45:23.379798+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, code, name_ar, location, status, contract_value, planned_start, planned_finish, created_at, updated_at, suspension_reason)
VALUES (
  '94cc9bc3-ff41-4bf3-a389-af6a633a5ea7',
  NULL,
  '27-01',
  'Project 27-01',
  'North Coast',
  'working',
  NULL,
  NULL,
  NULL,
  '2026-07-23T16:17:08.912259+00:00',
  '2026-07-23T16:17:08.912259+00:00',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- 5. Update profiles (since they might be auto-created by auth.users trigger)
UPDATE public.profiles SET
  full_name_ar = NULL,
  phone = NULL,
  roles = ARRAY['board_member']::public.user_role[],
  avatar_url = NULL,
  updated_at = '2026-03-16T08:38:16.127177+00:00'
WHERE id = 'e0d333a1-eafe-4096-b500-1776bd5ddc90';

UPDATE public.profiles SET
  full_name_ar = 'Hassan Shohaib',
  phone = NULL,
  roles = ARRAY['board_member']::public.user_role[],
  avatar_url = NULL,
  updated_at = '2026-06-01T08:10:27.200405+00:00'
WHERE id = 'b1988cfb-b290-4e6c-b204-58e603a63a87';

UPDATE public.profiles SET
  full_name_ar = 'Hassan Soliman',
  phone = NULL,
  roles = ARRAY['board_member']::public.user_role[],
  avatar_url = NULL,
  updated_at = '2026-06-08T15:58:45.00005+00:00'
WHERE id = 'b14ccad8-1341-43ab-a056-f8b2163be90d';

UPDATE public.profiles SET
  full_name_ar = NULL,
  phone = NULL,
  roles = ARRAY['board_member']::public.user_role[],
  avatar_url = NULL,
  updated_at = '2026-07-20T10:13:54.940041+00:00'
WHERE id = 'a3106317-08b7-4844-b90d-1e8bc370e82a';

UPDATE public.profiles SET
  full_name_ar = NULL,
  phone = NULL,
  roles = ARRAY['board_member']::public.user_role[],
  avatar_url = NULL,
  updated_at = '2026-07-22T00:46:31.155681+00:00'
WHERE id = '8b9e7b52-a1e2-4645-9da8-7bb8a05a5cb9';

UPDATE public.profiles SET
  full_name_ar = 'Kawthar Boshra ',
  phone = NULL,
  roles = ARRAY['board_member']::public.user_role[],
  avatar_url = NULL,
  updated_at = '2026-07-22T10:23:11.653524+00:00'
WHERE id = '0b6dd144-04f6-4905-b17d-477ebd8c94d7';

UPDATE public.profiles SET
  full_name_ar = 'Alshaikh M (COO)',
  phone = NULL,
  roles = ARRAY['board_member']::public.user_role[],
  avatar_url = NULL,
  updated_at = '2026-07-23T17:30:09.078695+00:00'
WHERE id = '6ba3e8d8-1d0c-426c-a7a8-d14d5833d63d';

UPDATE public.profiles SET
  full_name_ar = 'Hisham El Batrawi',
  phone = NULL,
  roles = ARRAY['board_member']::public.user_role[],
  avatar_url = NULL,
  updated_at = '2026-07-23T19:36:10.177793+00:00'
WHERE id = '73d18b2c-a4e9-4809-b4d6-7e208b0842ad';

UPDATE public.profiles SET
  full_name_ar = 'Mostafa Omar',
  phone = NULL,
  roles = ARRAY['board_member']::public.user_role[],
  avatar_url = NULL,
  updated_at = '2026-07-30T09:57:46.804415+00:00'
WHERE id = 'be66de8b-0556-4bfc-ba28-3fcd346b997b';

UPDATE public.profiles SET
  full_name_ar = 'عميل',
  phone = NULL,
  roles = ARRAY['board_member']::public.user_role[],
  avatar_url = NULL,
  updated_at = '2026-08-10T15:05:28.777986+00:00'
WHERE id = '058f6acb-7c07-4025-bee2-dadea49e9f98';

UPDATE public.profiles SET
  full_name_ar = 'PZone Admin',
  phone = NULL,
  roles = ARRAY['board_member']::public.user_role[],
  avatar_url = NULL,
  updated_at = '2026-08-10T15:43:20.031923+00:00'
WHERE id = '0dfa29cf-264e-41e1-aa3c-f3059e30e233';

