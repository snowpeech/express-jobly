CREATE TABLE companies
(
    handle TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    num_employees INTEGER,
    description TEXT,
    logo_url TEXT
);

-- INSERT INTO companies (handle, name, num_employees) VALUES ('Coco', 'Co and Co', 3);


CREATE TABLE jobs
(
    id SERIAL PRIMARY KEY ,
    title TEXT NOT NULL,
    salary FLOAT NOT NULL,
    equity FLOAT CHECK(equity < 1 AND equity > 0),
    company_handle TEXT REFERENCES companies(handle) ON DELETE CASCADE,
    date_posted DATE DEFAULT NOW
()
);

-- INSERT INTO jobs
--     (title, salary, equity, company_handle, date_posted)
-- VALUES
--     ('rough', 120000, 0.25, 'Coco', '2020-05-11');
