-- Example SQL script to create a sample table in a PostgreSQL database 
-- This script creates a table named 'users' with some basic fields
-- 1. sudo dockerd
-- 2. docker compose up

-- *THEN TO ENTER POSTGRESQL*
-- 1. docker exec -it project_db psql -U postgres

-- ## TO SEE IF DOCKER IS RUNNING ##
-- 1. docker ps

-- ## TO EXIT POSTGRE SQL ## 
-- 1. \q

-- ## SQL Script Starts Here ## 
-- ## Copy and paste this into your PostgreSQL environment ##


CREATE TABLE users (
    id INT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);