-- 061: Permanently delete an ARCHIVED project (frees its code for reuse).
-- Admin/CEO/COO only. Only rows already archived (deleted_at not null) can be purged.
-- Child tables cascade (ON DELETE CASCADE); pm_notifications.project_id is set null.
create or replace function public.fn_purge_archived_project(p_project_id uuid, p_confirm_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_deleted timestamptz;
begin
  if not public.fn_user_has_role(auth.uid(), array['admin','ceo','coo']::user_role[]) then
    raise exception 'غير مصرح: الحذف النهائي متاح للمدير/الإدارة العليا فقط';
  end if;

  select code, deleted_at into v_code, v_deleted from public.projects where id = p_project_id;
  if not found then raise exception 'المشروع غير موجود'; end if;
  if v_deleted is null then raise exception 'لا يمكن حذف مشروع نشط — يجب أرشفته أولاً'; end if;
  if coalesce(trim(p_confirm_code), '') <> coalesce(trim(v_code), '') then
    raise exception 'كود التأكيد غير مطابق لكود المشروع';
  end if;

  delete from public.projects where id = p_project_id;
end;
$$;

revoke all on function public.fn_purge_archived_project(uuid, text) from public, anon;
grant execute on function public.fn_purge_archived_project(uuid, text) to authenticated;
