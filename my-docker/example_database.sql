-- Example SQL script to create a sample table in a PostgreSQL database 
-- This script creates a table named 'users' with some basic fields
-- 1. sudo dockerd
-- 2. docker compose up

-- *THEN TO ENTER POSTGRESQL*
-- docker exec -it project_db psql -U postgres

-- *THEN TO CONNECT TO YOUR DATABASE*
-- \c example_database

-- *THEN TO SEE TABLES IN YOUR DATABASE*
-- \dt

-- ## TO SEE IF DOCKER IS RUNNING ##
-- docker ps

-- ## TO EXIT POSTGRE SQL ## 
-- \q

-- ## SQL Script Starts Here ## 
-- ## Copy and paste this into your PostgreSQL environment ##

-- \d users

-- SELECT * FROM users LIMIT 10;

CREATE TABLE users (
    id INT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (id, username, email) VALUES
(1, 'alice', 'alice@gmail.com'),
(2, 'bob', 'bob@gmail.com'),
(3, 'charlie', 'charlie@gmail.com');