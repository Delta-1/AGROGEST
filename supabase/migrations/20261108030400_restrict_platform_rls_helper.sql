-- Recent Supabase projects may expose this platform event-trigger helper.
-- Only its owner needs to execute it when creating tables.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

-- Cache the JWT once for each statement rather than once per policy row.
alter policy invites_read on public.company_invitations using (
  private.company_role(company_id)='admin' or email=lower((select auth.jwt())->>'email')
);
alter policy members_insert on public.memberships with check (
  user_id=(select auth.uid()) and active and (
    (role='admin' and exists(select 1 from public.companies c where c.id=company_id and c.created_by=(select auth.uid())))
    or exists(select 1 from public.company_invitations i where i.company_id=memberships.company_id and i.email=lower((select auth.jwt())->>'email') and i.role=memberships.role and i.expires_at>now())
  )
);
