-- AGROGEST v1. Run only in the dedicated AGROGEST project.
begin;
create schema if not exists private;
revoke all on schema private from public,anon;
grant usage on schema private to authenticated;
create table public.companies (
 id uuid primary key, name text not null check(length(trim(name)) between 2 and 120),
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
create table public.memberships (
 company_id uuid not null references public.companies(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null check(length(trim(display_name)) between 2 and 100),
 role text not null check(role in ('admin','gestor','tecnico')),active boolean not null default true,
 primary key(company_id,user_id)
);
create index memberships_by_user on public.memberships(user_id,company_id) where active;
create table public.company_invitations (
 id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id) on delete cascade,
 email text not null check(email=lower(trim(email)) and position('@' in email)>1),
 display_name text not null check(length(trim(display_name)) between 2 and 100),
 role text not null check(role in ('admin','gestor','tecnico')),
 expires_at timestamptz not null default now()+interval '7 days',created_at timestamptz not null default now(),
 unique(company_id,email)
);
-- These boolean helpers read authorization tables without recursive RLS.
-- They return no user data, always scope by auth.uid(), and live outside the API schema.
create function private.company_role(cid uuid) returns text language sql stable security definer set search_path='' as $$
 select m.role from public.memberships m where m.company_id=cid and m.user_id=(select auth.uid()) and m.active
$$;
create function private.is_manager(cid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(private.company_role(cid) in ('admin','gestor'),false)
$$;
alter table public.companies enable row level security;
alter table public.memberships enable row level security;
alter table public.company_invitations enable row level security;
create policy companies_read on public.companies for select to authenticated using(created_by=(select auth.uid()) or private.company_role(id) is not null);
create policy companies_insert on public.companies for insert to authenticated with check(created_by=(select auth.uid()));
create policy companies_update on public.companies for update to authenticated using(private.company_role(id)='admin') with check(private.company_role(id)='admin');
create policy members_read on public.memberships for select to authenticated using(user_id=(select auth.uid()) or private.is_manager(company_id));
create policy invites_read on public.company_invitations for select to authenticated using(private.company_role(company_id)='admin' or email=lower((select auth.jwt()->>'email')));
create policy invites_insert on public.company_invitations for insert to authenticated with check(private.company_role(company_id)='admin');
create policy invites_update on public.company_invitations for update to authenticated using(private.company_role(company_id)='admin') with check(private.company_role(company_id)='admin');
create policy members_insert on public.memberships for insert to authenticated with check(
 user_id=(select auth.uid()) and active and (
 (role='admin' and exists(select 1 from public.companies c where c.id=company_id and c.created_by=(select auth.uid())))
 or exists(select 1 from public.company_invitations i where i.company_id=memberships.company_id and i.email=lower((select auth.jwt()->>'email')) and i.role=memberships.role and i.expires_at>now())
 ));
create policy members_update on public.memberships for update to authenticated using(private.company_role(company_id)='admin') with check(private.company_role(company_id)='admin');
create function private.protect_membership() returns trigger language plpgsql set search_path='' as $$
 begin
 if new.company_id<>old.company_id or new.user_id<>old.user_id then raise exception 'O vínculo não pode ser transferido.';end if;
 if old.active and old.role='admin' and (not new.active or new.role<>'admin') and (select count(*) from public.memberships where company_id=old.company_id and role='admin' and active)<2 then raise exception 'O escritório precisa manter um administrador ativo.';end if;
 return new;end $$;
create trigger protect_membership before update on public.memberships for each row execute function private.protect_membership();
-- The payload keeps domain fields together; tenant, ownership, relationships,
-- file hashes and revisions are separate indexed columns enforced by Postgres.
do $$ declare t text; begin
 foreach t in array array['customers','properties','herds','documents','processes','tasks','certificates','pending_rules','company_settings','audit_events'] loop
 execute format('create table public.%I (id uuid primary key,company_id uuid not null references public.companies(id) on delete cascade,owner_id uuid references auth.users(id),customer_id uuid,property_id uuid,payload jsonb not null check(jsonb_typeof(payload)=''object''),revision integer not null default 1 check(revision>0),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(company_id,id))',t);
 execute format('alter table public.%I enable row level security',t);
 execute format('create index %I on public.%I(company_id,created_at desc,id)',t||'_company_idx',t);
 if t not in ('customers','pending_rules','company_settings','audit_events') then
 execute format('alter table public.%I add constraint %I foreign key(company_id,customer_id) references public.customers(company_id,id)',t,t||'_customer_fk');
 execute format('create index %I on public.%I(company_id,customer_id)',t||'_customer_idx',t);
 end if;
 end loop;end $$;
create index customers_owner_idx on public.customers(company_id,owner_id);
create unique index customers_cpf_unique on public.customers(company_id,(regexp_replace(payload->>'cpf','\D','','g'))) where coalesce(payload->>'cpf','')<>'';
alter table public.customers add constraint customer_name check(length(trim(payload->>'name')) between 2 and 200),add constraint customer_owner_required check(owner_id is not null);
alter table public.properties add constraint property_customer_required check(customer_id is not null),add constraint property_name check(length(trim(payload->>'name')) between 2 and 200),add constraint property_area check((payload->>'area')::numeric>=0 and (payload->>'consolidated')::numeric between 0 and (payload->>'area')::numeric);
alter table public.herds add constraint herd_customer_required check(customer_id is not null),add constraint herd_property_required check(property_id is not null),add constraint herd_heads check((payload->>'heads')::numeric>0),add constraint herd_factor check((payload->>'factor')::numeric>0),add constraint herd_property_fk foreign key(company_id,property_id) references public.properties(company_id,id);
alter table public.processes add constraint process_customer_required check(customer_id is not null),add constraint process_amount check((payload->>'amount')::numeric>=0),add constraint process_stage check(payload->>'stage' in ('Cadastro','Elaboração','Análise no banco','Pendência','Aprovação','Liberado','Cancelado'));
alter table public.documents add column sha256 text not null check(sha256~'^[a-f0-9]{64}$'),add constraint documents_hash_unique unique(company_id,sha256),add constraint documents_private_path check(payload->>'storagePath' is not null and payload->>'storagePath' like company_id::text||'/'||owner_id::text||'/%'),add constraint document_status check(payload->>'status' in ('received','review','reviewed','error'));
create unique index company_settings_single on public.company_settings(company_id);
create function private.can_access_customer(cid uuid,customer uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and private.company_role(cid) is not null and exists(select 1 from public.customers c where c.id=customer and c.company_id=cid and (private.is_manager(cid) or c.owner_id=auth.uid()))
$$;
create function private.can_access_record(cid uuid,owner uuid,customer uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and private.company_role(cid) is not null and (private.is_manager(cid) or case when customer is not null then private.can_access_customer(cid,customer) else owner=auth.uid() end)
$$;
create policy customer_read on public.customers for select to authenticated using(private.can_access_record(company_id,owner_id,null));
create policy customer_insert on public.customers for insert to authenticated with check(private.can_access_record(company_id,owner_id,null));
create policy customer_update on public.customers for update to authenticated using(private.can_access_record(company_id,owner_id,null)) with check(private.can_access_record(company_id,owner_id,null));
do $$declare t text;begin
 foreach t in array array['properties','herds','documents','processes','tasks','certificates'] loop
 execute format('create policy data_read on public.%I for select to authenticated using(private.can_access_record(company_id,owner_id,customer_id))',t);
 execute format('create policy data_insert on public.%I for insert to authenticated with check(private.can_access_record(company_id,owner_id,customer_id))',t);
 execute format('create policy data_update on public.%I for update to authenticated using(private.can_access_record(company_id,owner_id,customer_id)) with check(private.can_access_record(company_id,owner_id,customer_id))',t);
 end loop;
 foreach t in array array['pending_rules','company_settings'] loop
 execute format('create policy config_read on public.%I for select to authenticated using(private.company_role(company_id) is not null)',t);
 execute format('create policy config_insert on public.%I for insert to authenticated with check(private.is_manager(company_id))',t);
 execute format('create policy config_update on public.%I for update to authenticated using(private.is_manager(company_id)) with check(private.is_manager(company_id))',t);
 end loop;end $$;
create policy audit_read on public.audit_events for select to authenticated using(private.is_manager(company_id));
create function private.validate_record() returns trigger language plpgsql set search_path='' as $$
 declare property_customer uuid;
 begin
 if new.payload->>'id' is distinct from new.id::text then raise exception 'Identificador do registro inválido.';end if;
 if tg_op='UPDATE' then
 if new.id<>old.id or new.company_id<>old.company_id then raise exception 'O registro não pode mudar de empresa.';end if;
 if new.owner_id is distinct from old.owner_id and not private.is_manager(old.company_id) then raise exception 'Somente a gestão pode alterar o responsável.';end if;
 if tg_table_name='documents' then
 if new.payload->>'storagePath' is distinct from old.payload->>'storagePath' or new.sha256 is distinct from old.sha256 then raise exception 'O arquivo original não pode ser substituído.';end if;
 end if;
 new.revision=old.revision+1;new.created_at=old.created_at;
 end if;
 if tg_table_name in ('properties','herds','documents','processes','tasks','certificates') and coalesce(new.payload->>'customerId','') is distinct from coalesce(new.customer_id::text,'') then raise exception 'Vínculo com produtor inválido.';end if;
 if tg_table_name in ('herds','documents') then
 if coalesce(new.payload->>'propertyId','') is distinct from coalesce(new.property_id::text,'') then raise exception 'Vínculo com imóvel inválido.';end if;
 if new.property_id is not null then
 select customer_id into property_customer from public.properties where id=new.property_id and company_id=new.company_id;
 if property_customer is distinct from new.customer_id then raise exception 'O imóvel não pertence ao produtor selecionado.';end if;
 end if;end if;
 new.updated_at=now();return new;end $$;
-- Append-only, server-authored audit; clients cannot insert or change audit rows.
create function private.audit_record() returns trigger language plpgsql security definer set search_path='' as $$
 declare actor text;
 begin
 if auth.uid() is null then return new;end if;
 select display_name into actor from public.memberships where company_id=new.company_id and user_id=auth.uid() and active;
 if actor is null then raise exception 'Integrante não autorizado.';end if;
 insert into public.audit_events(id,company_id,payload) values(gen_random_uuid(),new.company_id,jsonb_build_object('at',now(),'actor',actor,'action',case when tg_op='INSERT' then 'Criou' else 'Atualizou' end||' · '||tg_table_name,'entityId',new.id));
 return new;end $$;
do $$declare t text;begin
 foreach t in array array['customers','properties','herds','documents','processes','tasks','certificates','pending_rules','company_settings'] loop
 execute format('create trigger validate_record before insert or update on public.%I for each row execute function private.validate_record()',t);
 execute format('create trigger audit_record after insert or update on public.%I for each row execute function private.audit_record()',t);
 end loop;end $$;
create function public.create_agrogest_workspace(company_id uuid,company_name text,display_name text,settings_payload jsonb,rules_payload jsonb) returns void language plpgsql security invoker set search_path='' as $$
 declare rule jsonb;
 begin
 if auth.uid() is null then raise exception 'Entre na sua conta.';end if;
 insert into public.companies(id,name,created_by) values(company_id,trim(company_name),auth.uid());
 insert into public.memberships(company_id,user_id,display_name,role) values(company_id,auth.uid(),trim(display_name),'admin');
 insert into public.company_settings(id,company_id,payload) values((settings_payload->>'id')::uuid,company_id,settings_payload);
 for rule in select value from jsonb_array_elements(rules_payload) loop
 insert into public.pending_rules(id,company_id,payload) values((rule->>'id')::uuid,company_id,rule);
 end loop;
 end $$;
create function public.accept_agrogest_invitations() returns void language sql security invoker set search_path='' as $$
 insert into public.memberships(company_id,user_id,display_name,role)
 select i.company_id,auth.uid(),i.display_name,i.role from public.company_invitations i
 where i.email=lower(auth.jwt()->>'email') and i.expires_at>now() and auth.uid() is not null
 on conflict(company_id,user_id) do nothing
$$;
create function public.apply_document_review(document_id uuid,customer_payload jsonb,property_payload jsonb,document_payload jsonb,customer_revision int,property_revision int,document_revision int) returns void language plpgsql security invoker set search_path='' as $$
 declare cid uuid; customer uuid; prop uuid; changes int;
 begin
 select company_id into cid from public.documents d where d.id=document_id and d.revision=document_revision for update;
 if cid is null then raise exception 'O documento mudou ou seu acesso foi alterado. Atualize a página.';end if;
 if document_payload->>'id' is distinct from document_id::text then raise exception 'Documento inválido.';end if;
 customer=(customer_payload->>'id')::uuid;
 if document_payload->>'customerId' is distinct from customer::text then raise exception 'Produtor inválido.';end if;
 update public.customers set payload=customer_payload-'revision' where id=customer and company_id=cid and revision=customer_revision;
 get diagnostics changes=row_count;if changes<>1 then raise exception 'O produtor mudou. Atualize a página e confira novamente.';end if;
 if property_payload is not null then
 prop=(property_payload->>'id')::uuid;
 update public.properties set payload=property_payload-'revision' where id=prop and company_id=cid and customer_id=customer and revision=property_revision;
 get diagnostics changes=row_count;if changes<>1 then raise exception 'O imóvel mudou. Atualize a página e confira novamente.';end if;
 end if;
 update public.documents set payload=document_payload-'revision',customer_id=customer,property_id=nullif(document_payload->>'propertyId','')::uuid where id=document_id and company_id=cid and revision=document_revision;
 get diagnostics changes=row_count;if changes<>1 then raise exception 'A conferência não foi aplicada.';end if;
 end $$;
-- Explicit grants are necessary when automatic table exposure is disabled.
grant select,insert,update on public.companies,public.memberships,public.company_invitations to authenticated;
grant select,insert,update on public.customers,public.properties,public.herds,public.documents,public.processes,public.tasks,public.certificates,public.pending_rules,public.company_settings to authenticated;
grant select on public.audit_events to authenticated;
revoke all on all tables in schema public from anon;
revoke execute on all functions in schema private from public,anon;
grant execute on function private.company_role(uuid),private.is_manager(uuid),private.can_access_customer(uuid,uuid),private.can_access_record(uuid,uuid,uuid) to authenticated;
revoke execute on function public.create_agrogest_workspace(uuid,text,text,jsonb,jsonb),public.accept_agrogest_invitations(),public.apply_document_review(uuid,jsonb,jsonb,jsonb,int,int,int) from public,anon;
grant execute on function public.create_agrogest_workspace(uuid,text,text,jsonb,jsonb),public.accept_agrogest_invitations(),public.apply_document_review(uuid,jsonb,jsonb,jsonb,int,int,int) to authenticated;
-- Private file bucket, 20 MB per file, no public URLs.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('agrogest-documents','agrogest-documents',false,20971520,array['application/pdf','image/jpeg','image/png']) on conflict(id) do nothing;
create function private.can_read_file(path text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.documents d where d.payload->>'storagePath'=path and private.can_access_record(d.company_id,d.owner_id,d.customer_id))
$$;
revoke execute on function private.can_read_file(text) from public,anon;
grant execute on function private.can_read_file(text) to authenticated;
create policy agrogest_upload on storage.objects for insert to authenticated with check(bucket_id='agrogest-documents' and (storage.foldername(name))[2]=(select auth.uid())::text and private.company_role(((storage.foldername(name))[1])::uuid) is not null);
create policy agrogest_read on storage.objects for select to authenticated using(bucket_id='agrogest-documents' and private.can_read_file(name));
create policy agrogest_cleanup on storage.objects for delete to authenticated using(bucket_id='agrogest-documents' and (storage.foldername(name))[2]=(select auth.uid())::text and private.company_role(((storage.foldername(name))[1])::uuid) is not null and not exists(select 1 from public.documents d where d.payload->>'storagePath'=name));
commit;
