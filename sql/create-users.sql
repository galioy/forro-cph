-- Create migrations user
CREATE USER :user_migration WITH PASSWORD 'asdf1234';

-- Grant permissions to migrations user
GRANT CONNECT ON DATABASE :dbname TO :user_migration;
GRANT USAGE ON SCHEMA public TO :user_migration;
REVOKE CREATE ON SCHEMA public FROM public;
GRANT CREATE ON SCHEMA public TO :user_migration;

-- Create app user
CREATE USER :user_app WITH PASSWORD 'asdf1234';

-- Grant permissions to app user
GRANT CONNECT ON DATABASE :dbname TO :user_app;
GRANT USAGE ON SCHEMA "public" TO :user_app;
