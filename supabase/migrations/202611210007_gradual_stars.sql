-- Stars build up gradually: the average is scaled by how many reviews there are, reaching full
-- weight at 50 reviews. So 10 five-star reviews = 1.0 star and 50 five-star reviews = 5.0.
create or replace function public.get_profile_rating(target_profile_id uuid, target_role text default null)
returns table(average_rating numeric, review_count bigint)
language sql stable security definer set search_path = '' as $$
  select coalesce(round(avg(r.rating)::numeric * least(count(*), 50) / 50.0, 2), 0), count(*)
  from public.profile_reviews r
  where r.reviewee_id = target_profile_id and (target_role is null or r.reviewee_role = target_role);
$$;
