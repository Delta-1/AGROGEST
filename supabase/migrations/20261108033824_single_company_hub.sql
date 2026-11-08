-- AGROGEST is a private, single-company hub. Apply after disabling public signup.
begin;
create table private.hub_configuration(singleton boolean primary key default true check(singleton),company_id uuid unique references public.companies(id));
alter table private.hub_configuration enable row level security;
revoke all on private.hub_configuration from public,anon,authenticated;
insert into private.hub_configuration(singleton) values(true);
create table public.staff_accounts(
 user_id uuid primary key references auth.users(id) on delete cascade,
 company_id uuid not null references public.companies(id),
 username text unique not null check(username ~ '^[a-z][a-z0-9._-]{2,31}$'),
 contact_email text not null default '',must_change_password boolean not null default true,
 created_at timestamptz not null default now()
);
create index staff_company_idx on public.staff_accounts(company_id);
alter table public.staff_accounts enable row level security;
revoke all on public.staff_accounts from public,anon,authenticated;
grant select on public.staff_accounts to authenticated;
create table private.staff_password_resets(user_id uuid primary key references auth.users(id) on delete cascade,password_hash text not null);
alter table private.staff_password_resets enable row level security;
revoke all on private.staff_password_resets from public,anon,authenticated;
create or replace function private.company_role(cid uuid) returns text language sql stable security definer set search_path='' as $$
 select m.role from public.memberships m join public.staff_accounts s on s.user_id=m.user_id and s.company_id=m.company_id
 join private.hub_configuration h on h.company_id=m.company_id
 where m.company_id=cid and m.user_id=(select auth.uid()) and m.active and not s.must_change_password
$$;
create policy staff_read on public.staff_accounts for select to authenticated using(user_id=(select auth.uid()) or private.is_manager(company_id));
revoke insert on public.companies,public.memberships from authenticated;
revoke all on public.company_invitations from authenticated;
revoke execute on function public.create_agrogest_workspace(uuid,text,text,jsonb,jsonb),public.accept_agrogest_invitations() from public,anon,authenticated;
-- Admin is reserved and provisioned only through Supabase Auth's administrative UI/API.
-- No password or activation secret is stored in the source code.
create function private.bootstrap_agrogest_admin() returns trigger language plpgsql security definer set search_path='' as $$
 declare cid uuid; sid uuid; r jsonb; rid uuid;
 begin
 if lower(new.email)<>'admin@acesso.agrogest.invalid' then return new;end if;
 perform pg_advisory_xact_lock(1830761);
 select company_id into cid from private.hub_configuration where singleton for update;
 if cid is not null then raise exception 'O administrador inicial já foi configurado.';end if;
 if exists(select 1 from public.companies) then raise exception 'Há escritórios existentes. Revise a migração antes de ativar o administrador.';end if;
 cid=gen_random_uuid();sid=gen_random_uuid();
 insert into public.companies(id,name,created_by) values(cid,'AGROGEST Assessoria',new.id);
 update private.hub_configuration set company_id=cid where singleton;
 insert into public.staff_accounts(user_id,company_id,username,must_change_password) values(new.id,cid,'admin',false);
 insert into public.memberships(company_id,user_id,display_name,role) values(cid,new.id,'Administrador Agrogest','admin');
 insert into public.company_settings(id,company_id,payload) values(sid,cid,jsonb_build_object('id',sid,'companyName','AGROGEST Assessoria','office','AGROGEST Assessoria','maxStocking',4,'referenceStocking',3,'holidays','[]'::jsonb,'sourcePriority','["identity","registry","ccir","car","itr"]'::jsonb,'stageDays','{"Cadastro":5,"Elaboração":3,"Análise no banco":10,"Pendência":3,"Aprovação":7}'::jsonb));
 for r in select value from jsonb_array_elements('[{"entity":"customer","field":"name","label":"Nome completo","severity":"blocking","enabled":true},{"entity":"customer","field":"cpf","label":"CPF válido","severity":"blocking","enabled":true},{"entity":"property","field":"name","label":"Nome do imóvel","severity":"blocking","enabled":true},{"entity":"property","field":"city","label":"Município do imóvel","severity":"blocking","enabled":true},{"entity":"property","field":"area","label":"Área total do imóvel","severity":"blocking","enabled":true},{"entity":"property","field":"car","label":"Cadastro Ambiental Rural (CAR)","severity":"blocking","enabled":true},{"entity":"property","field":"tenure","label":"Situação fundiária","severity":"blocking","enabled":true},{"entity":"customer","field":"caf","label":"CAF para análise Pronaf","severity":"blocking","enabled":true,"condition":"pronaf"}]'::jsonb) loop
 rid=gen_random_uuid();insert into public.pending_rules(id,company_id,payload) values(rid,cid,r||jsonb_build_object('id',rid));end loop;
 return new;end $$;
revoke all on function private.bootstrap_agrogest_admin() from public,anon,authenticated;
create trigger agrogest_initial_admin after insert on auth.users for each row execute function private.bootstrap_agrogest_admin();
-- These RPCs can only be invoked by the authenticated administration Edge Function.
create function public.manage_agrogest_staff(actor_id uuid,target_id uuid,operation text,login_name text default '',full_name text default '',target_role text default 'tecnico',email_contact text default '',enabled boolean default true) returns void language plpgsql security definer set search_path='' as $$
 declare cid uuid; actor_role text; old_role text; actor_name text;
 begin
 perform pg_advisory_xact_lock(1830762);
 select m.company_id,m.role,m.display_name into cid,actor_role,actor_name from public.memberships m join public.staff_accounts s on s.user_id=m.user_id join private.hub_configuration h on h.company_id=m.company_id where m.user_id=actor_id and m.active and not s.must_change_password;
 if actor_role is null or actor_role not in ('admin','gestor') then raise exception 'Acesso de RH não autorizado.';end if;
 if operation not in ('create','access','reset') or target_role not in ('admin','gestor','tecnico') then raise exception 'Operação inválida.';end if;
 select role into old_role from public.memberships where user_id=target_id and company_id=cid;
 if actor_role='gestor' and (target_role<>'tecnico' or coalesce(old_role,'tecnico')<>'tecnico') then raise exception 'O RH pode gerenciar somente acessos de técnicos.';end if;
 if target_id=actor_id then raise exception 'Peça a outro administrador para alterar seu acesso.';end if;
 if operation='create' then
  if old_role is not null then raise exception 'Integrante já cadastrado.';end if;
  if length(trim(full_name)) not between 2 and 100 or login_name !~ '^[a-z][a-z0-9._-]{2,31}$' or login_name='admin' then raise exception 'Confira o nome e o login.';end if;
  if (select email from auth.users where id=target_id) is distinct from login_name||'@acesso.agrogest.invalid' then raise exception 'Identidade do login inválida.';end if;
  insert into public.staff_accounts(user_id,company_id,username,contact_email) values(target_id,cid,login_name,trim(email_contact));
  insert into public.memberships(company_id,user_id,display_name,role) values(cid,target_id,trim(full_name),target_role);
 elsif old_role is null then raise exception 'Integrante não encontrado.';
 elsif operation='access' then update public.memberships set role=target_role,active=enabled where user_id=target_id and company_id=cid;
 end if;
 if operation in ('create','reset') then
  update public.staff_accounts set must_change_password=true where user_id=target_id;
  insert into private.staff_password_resets(user_id,password_hash) select id,encrypted_password from auth.users where id=target_id on conflict(user_id) do update set password_hash=excluded.password_hash;
 end if;
 insert into public.audit_events(id,company_id,payload) values(gen_random_uuid(),cid,jsonb_build_object('at',now(),'actor',actor_name,'action','Gerenciou acesso · '||operation,'entityId',target_id));
 end $$;
revoke all on function public.manage_agrogest_staff(uuid,uuid,text,text,text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.manage_agrogest_staff(uuid,uuid,text,text,text,text,text,boolean) to service_role;
grant select on public.staff_accounts,public.memberships to service_role;
create function private.complete_staff_password_change() returns void language plpgsql security definer set search_path='' as $$
 begin
 if auth.uid() is null then raise exception 'Entre na sua conta.';end if;
 if exists(select 1 from public.staff_accounts where user_id=auth.uid() and must_change_password) then
  if not exists(select 1 from private.staff_password_resets r join auth.users u on u.id=r.user_id where r.user_id=auth.uid() and u.encrypted_password is distinct from r.password_hash) then raise exception 'Defina uma nova senha antes de continuar.';end if;
  update public.staff_accounts set must_change_password=false where user_id=auth.uid();delete from private.staff_password_resets where user_id=auth.uid();
 end if;
 end $$;
revoke all on function private.complete_staff_password_change() from public,anon;
grant execute on function private.complete_staff_password_change() to authenticated;
create function public.complete_agrogest_password_change() returns void language sql security invoker set search_path='' as $$select private.complete_staff_password_change()$$;
revoke all on function public.complete_agrogest_password_change() from public,anon;
grant execute on function public.complete_agrogest_password_change() to authenticated;
-- Private contacts, independent of the public website.
create table public.contacts(id uuid primary key,company_id uuid not null references public.companies(id),owner_id uuid not null references auth.users(id),customer_id uuid,payload jsonb not null check(jsonb_typeof(payload)='object'),revision int not null default 1,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),foreign key(company_id,customer_id) references public.customers(company_id,id),check(length(trim(payload->>'name')) between 2 and 200));
create index contacts_company_idx on public.contacts(company_id,created_at desc,id);
create index contacts_customer_idx on public.contacts(company_id,customer_id);
create index contacts_owner_idx on public.contacts(owner_id);
alter table public.contacts enable row level security;
revoke all on public.contacts from public,anon,authenticated;
grant select,insert,update on public.contacts to authenticated;
create policy contacts_read on public.contacts for select to authenticated using(private.can_access_record(company_id,owner_id,customer_id));
create policy contacts_insert on public.contacts for insert to authenticated with check(private.can_access_record(company_id,owner_id,customer_id));
create policy contacts_update on public.contacts for update to authenticated using(private.can_access_record(company_id,owner_id,customer_id)) with check(private.can_access_record(company_id,owner_id,customer_id));
create trigger contacts_validate before insert or update on public.contacts for each row execute function private.validate_record();
create trigger contacts_audit after insert or update on public.contacts for each row execute function private.audit_record();
-- Only this explicitly public content is served to visitors.
create table public.site_content(id text primary key check(id='main'),payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<100000),revision int not null default 1,updated_at timestamptz not null default now());
alter table public.site_content enable row level security;
revoke all on public.site_content from public,anon,authenticated;
grant select on public.site_content to anon,authenticated;
grant update on public.site_content to authenticated;
create policy site_read on public.site_content for select to anon,authenticated using(true);
create function private.is_hub_admin() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from private.hub_configuration h where private.company_role(h.company_id)='admin')$$;
revoke all on function private.is_hub_admin() from public,anon;
grant execute on function private.is_hub_admin() to authenticated;
create policy site_update on public.site_content for update to authenticated using((select private.is_hub_admin())) with check((select private.is_hub_admin()));
create function private.site_revision() returns trigger language plpgsql set search_path='' as $$begin new.id=old.id;new.revision=old.revision+1;new.updated_at=now();return new;end $$;
revoke all on function private.site_revision() from public,anon,authenticated;
create trigger site_revision before update on public.site_content for each row execute function private.site_revision();
insert into public.site_content(id,payload) values('main','{"companyName":"AGROGEST Assessoria","headline":"Cuidar do campo. Aproximar conquistas.","intro":"Assessoria rural com atenção a cada produtor, organização em cada etapa e compromisso com o seu próximo passo.","about":"A AGROGEST Assessoria conecta a rotina do produtor à organização que o negócio rural precisa. Reunimos informações, documentos e acompanhamento para tornar cada etapa mais clara, do primeiro contato à entrega.","team":"Pessoas que escutam, organizam e acompanham. Nosso trabalho conecta o atendimento ao produtor, o cuidado com os documentos e o acompanhamento técnico.","email":"","phone":"","whatsapp":"","address":"","hours":"Atendimento mediante agendamento","videoUrl":"","heroImage":"","gallery":[]}'::jsonb);
create table public.site_messages(id uuid primary key default gen_random_uuid(),name text not null check(length(name) between 2 and 100),phone text not null default '' check(length(phone)<=30),email text not null default '' check(length(email)<=254),message text not null check(length(message) between 10 and 2000),status text not null default 'Novo' check(status in ('Novo','Em atendimento','Concluído')),created_at timestamptz not null default now());
create index site_messages_created_idx on public.site_messages(created_at desc);
create index site_messages_contact_idx on public.site_messages(email,phone,created_at desc);
alter table public.site_messages enable row level security;
revoke all on public.site_messages from public,anon,authenticated;
grant select,update(status) on public.site_messages to authenticated;
create function private.is_hub_manager() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from private.hub_configuration h where private.is_manager(h.company_id))$$;
revoke all on function private.is_hub_manager() from public,anon;
grant execute on function private.is_hub_manager() to authenticated;
create policy messages_read on public.site_messages for select to authenticated using((select private.is_hub_manager()));
create policy messages_update on public.site_messages for update to authenticated using((select private.is_hub_manager())) with check((select private.is_hub_manager()));
create function private.receive_site_message(sender_name text,sender_phone text,sender_email text,body text,website text) returns void language plpgsql security definer set search_path='' as $$
 begin
 if coalesce(website,'')<>'' then return;end if;
 sender_name=trim(sender_name);sender_phone=trim(sender_phone);sender_email=lower(trim(sender_email));body=trim(body);
 if length(sender_name) not between 2 and 100 or length(body) not between 10 and 2000 or (sender_phone='' and sender_email='') or length(sender_phone)>30 or length(sender_email)>254 or (sender_email<>'' and sender_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') then raise exception 'Confira seu nome, contato e mensagem.';end if;
 perform pg_advisory_xact_lock(1830763);
 if (select count(*) from public.site_messages where created_at>now()-interval '1 minute')>=20 or (select count(*) from public.site_messages where created_at>now()-interval '1 hour' and ((sender_phone<>'' and phone=sender_phone) or (sender_email<>'' and email=sender_email)))>=3 then raise exception 'Aguarde um pouco antes de enviar outra mensagem.';end if;
 insert into public.site_messages(name,phone,email,message) values(sender_name,sender_phone,sender_email,body);
 end $$;
revoke all on function private.receive_site_message(text,text,text,text,text) from public;
grant usage on schema private to anon;
grant execute on function private.receive_site_message(text,text,text,text,text) to anon,authenticated;
create function public.send_agrogest_message(sender_name text,sender_phone text,sender_email text,body text,website text default '') returns void language sql security invoker set search_path='' as $$select private.receive_site_message(sender_name,sender_phone,sender_email,body,website)$$;
revoke all on function public.send_agrogest_message(text,text,text,text,text) from public;
grant execute on function public.send_agrogest_message(text,text,text,text,text) to anon,authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('agrogest-site','agrogest-site',true,41943040,array['image/png','image/jpeg','image/webp','video/mp4','video/webm']);
create policy site_media_insert on storage.objects for insert to authenticated with check(bucket_id='agrogest-site' and (select private.is_hub_admin()));
create policy site_media_read on storage.objects for select to authenticated using(bucket_id='agrogest-site' and (select private.is_hub_admin()));
commit;
