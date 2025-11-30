-- Create additional databases for services
CREATE DATABASE botpress;
CREATE DATABASE n8n;
GRANT ALL PRIVILEGES ON DATABASE botpress TO strapi;
GRANT ALL PRIVILEGES ON DATABASE n8n TO strapi;
