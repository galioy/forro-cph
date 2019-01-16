CREATE TABLE _migrations (
  name  varchar(255) NOT NULL
);

CREATE TABLE users (
  id          bigserial PRIMARY KEY,
  email       varchar(60) NOT NULL,
  password    varchar(255) NOT NULL,
  deleted_at  timestamp with time zone DEFAULT NULL, -- we always do soft-deletes, unless requested by the user
  updated_at  timestamp with time zone DEFAULT now() NOT NULL,
  created_at  timestamp with time zone DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON users TO :user_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO :user_app;
