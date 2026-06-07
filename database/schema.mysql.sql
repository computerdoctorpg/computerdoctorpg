-- PC Servis Admin - MySQL schema za Hostinger
-- Pokreni u: hPanel -> Websites -> Databases -> phpMyAdmin -> SQL

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'operater') NOT NULL DEFAULT 'operater',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
  id CHAR(36) PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
  id CHAR(36) PRIMARY KEY,
  ticket_number VARCHAR(50) NOT NULL UNIQUE,
  client_id CHAR(36) NOT NULL,
  device_name VARCHAR(255) NOT NULL,
  device_serial VARCHAR(255) NULL,
  charger_serial VARCHAR(255) NULL,
  battery_serial VARCHAR(255) NULL,
  issue_description TEXT,
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  os_password VARCHAR(255) NULL,
  keep_data TINYINT(1) NOT NULL DEFAULT 0,
  has_bag TINYINT(1) NOT NULL DEFAULT 0,
  bag_description TEXT NULL,
  history JSON NOT NULL,
  repair_details TEXT,
  parts_used TEXT,
  parts_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  service_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  estimated_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  dispatch_note_number VARCHAR(50) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  CONSTRAINT fk_tickets_client FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS parts_categories (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parts (
  id CHAR(36) PRIMARY KEY,
  category_id CHAR(36) NULL,
  name VARCHAR(255) NOT NULL,
  manufacturer VARCHAR(255) NULL,
  part_number VARCHAR(255) NULL,
  description TEXT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_parts_category FOREIGN KEY (category_id) REFERENCES parts_categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS parts_sales (
  id CHAR(36) PRIMARY KEY,
  part_id CHAR(36) NULL,
  part_name VARCHAR(255) NULL,
  customer_name VARCHAR(255) NULL,
  sale_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  sold_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_parts_sales_part FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS parts_sales_new (
  id CHAR(36) PRIMARY KEY,
  part_id CHAR(36) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_surname VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  sale_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  sale_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_parts_sales_new_part FOREIGN KEY (part_id) REFERENCES parts(id)
);

CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_parts_category_id ON parts(category_id);

INSERT INTO parts_categories (id, name, description) VALUES
  (UUID(), 'RAM', 'Memorijski moduli'),
  (UUID(), 'SSD/HDD', 'Diskovi'),
  (UUID(), 'Ekrani', 'LCD paneli'),
  (UUID(), 'Baterije', 'Laptop baterije');
