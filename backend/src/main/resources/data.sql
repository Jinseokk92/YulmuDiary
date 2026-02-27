-- 가족 그룹
INSERT INTO family_group (name, invite_code, created_at, updated_at)
VALUES ('율무네 가족', 'YM2024', NOW(), NOW());

-- 사용자
INSERT INTO users (email, name, provider, provider_id, role, created_at, updated_at)
VALUES
  ('mom@test.com', '율무맘', 'local', 'local_1', 'USER', NOW(), NOW()),
  ('dad@test.com', '율무아빠', 'local', 'local_2', 'USER', NOW(), NOW()),
  ('grandma@test.com', '율무할머니', 'local', 'local_3', 'USER', NOW(), NOW());

-- 가족 멤버십
INSERT INTO family_membership (family_group_id, user_id, role, created_at, updated_at)
VALUES
  (1, 1, 'PARENT', NOW(), NOW()),
  (1, 2, 'PARENT', NOW(), NOW()),
  (1, 3, 'RELATIVE', NOW(), NOW());

-- 아기
INSERT INTO baby (name, birth_date, gender, profile_image_url, family_group_id, created_at, updated_at)
VALUES ('율무', '2024-06-15', 'MALE', NULL, 1, NOW(), NOW());
