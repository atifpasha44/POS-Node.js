CREATE DATABASE IF NOT EXISTS pos_db;
USE pos_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  tin VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  profile_img VARCHAR(255)
);

INSERT INTO users (email, password, tin, name, profile_img) VALUES
('admin@pos.com', 'admin123', '123456789', 'Admin User', 'profile.png');
