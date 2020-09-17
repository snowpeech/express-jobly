CREATE TABLE companies
(
    handle TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    num_employees INTEGER,
    description TEXT,
    logo_url TEXT
);

-- CREATE TABLE jobs
-- (
--     id SERIAL PRIMARY KEY ,
--     title TEXT NOT NULL,
--     salary FLOAT NOT NULL,
--     equity FLOAT CHECK(equity < 1 AND equity < 0),
--     company_handle TEXT  REFERENCES companies(handle),
--     date_posted DATETIME DEFAULT NOW
-- ()
-- );