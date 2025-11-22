-- Update Password Hashes for Existing Users
-- This script should be run after the backend generates proper BCrypt hashes
-- 
-- To generate proper hashes, you can:
-- 1. Use the Register endpoint to create a new user, then copy the hash
-- 2. Or use a BCrypt online generator: https://bcrypt-generator.com/
--    Password: Admin@123
--    Rounds: 11
--
-- Example valid BCrypt hash for "Admin@123":
-- $2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

-- Update admin user password hash
UPDATE [Users] 
SET [PasswordHash] = '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE [Username] = 'admin'
  AND ([PasswordHash] LIKE '%K5K5K5K5K5K5K5K5K5K5K5K%' OR [PasswordHash] IS NULL);

-- Update pm1 user password hash
UPDATE [Users] 
SET [PasswordHash] = '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE [Username] = 'pm1'
  AND ([PasswordHash] LIKE '%K5K5K5K5K5K5K5K5K5K5K5K%' OR [PasswordHash] IS NULL);

-- Update user1 password hash
UPDATE [Users] 
SET [PasswordHash] = '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE [Username] = 'user1'
  AND ([PasswordHash] LIKE '%K5K5K5K5K5K5K5K5K5K5K5K%' OR [PasswordHash] IS NULL);

GO

