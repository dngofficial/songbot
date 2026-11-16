begin;

alter table public.song_requests
  add column if not exists review_version uuid not null default gen_random_uuid();

create or replace function public.submit_song_request(p_request jsonb)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  request_row public.song_requests%rowtype;
begin
  request_row := jsonb_populate_record(null::public.song_requests, p_request);

  -- Serialize submission and review for the same song ID.
  perform pg_advisory_xact_lock(hashtextextended(request_row.id, 714));

  if exists (select 1 from public.songs where id = request_row.id) then
    return false;
  end if;

  insert into public.song_requests (id, title, bpm, sample_rate, encoder, url, trivia, image, requested_by)
  values (request_row.id, request_row.title, request_row.bpm, request_row.sample_rate,
          request_row.encoder, request_row.url, request_row.trivia, request_row.image,
          request_row.requested_by);

  return true;
end;
$$;

create or replace function public.review_song_request(
  p_request_id text,
  p_review_version uuid,
  p_song_id text,
  p_approve boolean
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  request_row public.song_requests%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_song_id, 714));

  delete from public.song_requests
  where id = p_request_id and review_version = p_review_version
  returning * into request_row;

  if not found then
    return false;
  end if;

  if p_approve then
    insert into public.songs (id, title, bpm, sample_rate, encoder, url, trivia, image, requested_by)
    values (p_song_id, request_row.title, request_row.bpm, request_row.sample_rate,
            request_row.encoder, request_row.url, request_row.trivia, request_row.image,
            request_row.requested_by)
    on conflict (id) do update set
      title = excluded.title,
      bpm = excluded.bpm,
      sample_rate = excluded.sample_rate,
      encoder = excluded.encoder,
      url = excluded.url,
      trivia = excluded.trivia,
      image = excluded.image,
      requested_by = excluded.requested_by;
  end if;

  return true;
end;
$$;

revoke execute on function public.submit_song_request(jsonb) from public;
revoke execute on function public.review_song_request(text, uuid, text, boolean) from public;
grant execute on function public.submit_song_request(jsonb) to service_role, anon, authenticated;
grant execute on function public.review_song_request(text, uuid, text, boolean) to service_role, anon, authenticated;

commit;
