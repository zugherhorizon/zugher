
-- Status enum for chat sessions
do $$ begin
  create type public.chat_session_status as enum ('new', 'contacted', 'qualified', 'converted', 'archived');
exception when duplicate_object then null; end $$;

alter table public.chat_sessions
  add column if not exists status public.chat_session_status not null default 'new';

create index if not exists idx_chat_sessions_status on public.chat_sessions(status);
create index if not exists idx_chat_sessions_created_at on public.chat_sessions(created_at desc);
create index if not exists idx_chat_messages_session_id on public.chat_messages(session_id, created_at);

-- Admin write policies
drop policy if exists "Admins can update chat sessions" on public.chat_sessions;
create policy "Admins can update chat sessions"
on public.chat_sessions for update to authenticated
using (has_role(auth.uid(), 'admin'::app_role))
with check (has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "Admins can delete chat sessions" on public.chat_sessions;
create policy "Admins can delete chat sessions"
on public.chat_sessions for delete to authenticated
using (has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "Admins can delete chat messages" on public.chat_messages;
create policy "Admins can delete chat messages"
on public.chat_messages for delete to authenticated
using (has_role(auth.uid(), 'admin'::app_role));
