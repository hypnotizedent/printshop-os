-- Create additional databases for services
-- Note: The main 'printshop' database is created by POSTGRES_DB environment variable
-- These are additional databases for other services

-- Create botpress database
CREATE DATABASE botpress;

-- Create n8n database
CREATE DATABASE n8n;

-- Grant privileges to the default postgres user (will be run as POSTGRES_USER)
-- Note: POSTGRES_USER defaults to 'strapi', which already has access to databases it creates
