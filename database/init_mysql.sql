-- MariaDB / MySQL schema + seed (SkySQL, local MariaDB, etc.)
-- Create an empty database in your host UI if needed, then:
--   mysql -h HOST -P PORT -u USER -p DB_NAME < database/init_mysql.sql

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS item_requests;
DROP TABLE IF EXISTS guest_list;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS memberships;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(120) NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vendors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  business_name VARCHAR(120) NOT NULL,
  category VARCHAR(80) NULL,
  contact_details TEXT NULL,
  CONSTRAINT fk_vendors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE memberships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  duration VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  CONSTRAINT fk_memberships_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  location VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  date DATE NOT NULL,
  CONSTRAINT fk_trans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_trans_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'active',
  CONSTRAINT fk_products_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_cart_user_product (user_id, product_id),
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  grand_total DECIMAL(12, 2) NOT NULL,
  fulfillment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  customer_name VARCHAR(120) NULL,
  customer_email VARCHAR(120) NULL,
  customer_phone VARCHAR(40) NULL,
  customer_address TEXT NULL,
  customer_city VARCHAR(80) NULL,
  customer_state VARCHAR(80) NULL,
  customer_pin VARCHAR(20) NULL,
  payment_method VARCHAR(40) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE item_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  vendor_id INT NULL,
  description TEXT NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ir_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ir_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE guest_list (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  CONSTRAINT fk_guest_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@example.com', '$2a$10$Ypck7s964bsJjMtgnjHh9uOLvPo4dWk9bXlJ/yh5p7ij/hBkYCWCO', 'admin'),
('user', 'user@example.com', '$2a$10$3oIRmyi7FbRccBkjRo1DpuKtt9HMY5YKG3hmlCNje7AX8j7TMEmhi', 'user'),
('jsmith', 'jsmith@example.com', '$2a$10$3oIRmyi7FbRccBkjRo1DpuKtt9HMY5YKG3hmlCNje7AX8j7TMEmhi', 'user'),
('vendor1', 'vendor@example.com', '$2a$10$wOVyPFPcxUyYAl/cBlHl.uTPdizJ3QUUvGjsbHBGOhjbfFzyHfRuu', 'vendor');

INSERT INTO vendors (user_id, business_name, category, contact_details) VALUES
(4, 'Demo Catering Co', 'Catering', 'Call 555-0101 or email vendor@example.com');

INSERT INTO products (vendor_id, name, price, image_url, status) VALUES
(1, 'Coffee Service', 150.00, '/img/placeholder-product.svg', 'active'),
(1, 'Lunch Buffet', 450.00, '/img/placeholder-product.svg', 'active');

INSERT INTO memberships (user_id, duration, start_date, end_date, status) VALUES
(2, '6 months', '2025-10-01', '2026-04-01', 'active'),
(3, '1 year', '2024-06-15', '2025-06-15', 'expired');

INSERT INTO events (name, date, location) VALUES
('Annual Gala', '2026-05-20', 'Grand Hall Downtown'),
('Tech Meetup', '2026-04-12', 'Room 3B City Library'),
('Charity Run', '2026-06-01', 'Riverside Park');

INSERT INTO transactions (user_id, event_id, date) VALUES
(2, 1, '2026-03-01'),
(2, 2, '2026-03-15');
