-- Shared sample database for the SQL lessons.
-- The validator loads this into a fresh in-memory SQLite database and then runs each lesson's SQL
-- against it, so lessons may use these tables and columns without creating them.
-- Keep the tables stable: changing them can break many lessons.

CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  city TEXT,
  country TEXT,
  created_at TEXT              -- ISO dates: 'YYYY-MM-DD'
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  price REAL NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  order_date TEXT NOT NULL,    -- ISO dates: 'YYYY-MM-DD'
  status TEXT NOT NULL,        -- 'pending', 'shipped', 'delivered' or 'cancelled'
  total REAL NOT NULL
);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL
);

CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT,
  salary REAL,
  manager_id INTEGER REFERENCES employees(id),
  hire_date TEXT               -- ISO dates: 'YYYY-MM-DD'
);

INSERT INTO customers (id, name, email, city, country, created_at) VALUES
  (1, 'Ada Lovelace',  'ada@example.com',   'London',   'UK',     '2023-01-15'),
  (2, 'Grace Hopper',  'grace@example.com', 'New York', 'USA',    '2023-02-20'),
  (3, 'Linus Torvalds','linus@example.com', 'Helsinki', 'Finland','2023-03-05'),
  (4, 'Margaret Hamilton','mh@example.com', 'Boston',   'USA',    '2023-04-11'),
  (5, 'Alan Turing',   'alan@example.com',  'London',   'UK',     '2023-05-30'),
  (6, 'Hedy Lamarr',   NULL,                'Vienna',   'Austria','2023-06-18'),
  (7, 'Dennis Ritchie','dmr@example.com',   'New York', 'USA',    '2023-07-02'),
  (8, 'Barbara Liskov','liskov@example.com','Boston',   'USA',    '2023-08-21');

INSERT INTO products (id, name, category, price, stock) VALUES
  (1,  'Keyboard',      'Accessories', 49.90, 120),
  (2,  'Mouse',         'Accessories', 24.50, 200),
  (3,  'Monitor',       'Displays',   189.00,  35),
  (4,  'Laptop',        'Computers', 1299.00,  12),
  (5,  'USB Cable',     'Accessories',  7.99, 500),
  (6,  'Webcam',        'Accessories', 59.00,  0),
  (7,  'Desk Lamp',     'Office',      32.00,  60),
  (8,  'Office Chair',  'Office',     159.00,  18),
  (9,  'Headphones',    'Audio',       89.00,  75),
  (10, 'Speaker',       'Audio',       45.00,  40);

INSERT INTO orders (id, customer_id, order_date, status, total) VALUES
  (1,  1, '2024-01-05', 'delivered', 1348.90),
  (2,  2, '2024-01-12', 'delivered',   73.50),
  (3,  3, '2024-02-03', 'shipped',    189.00),
  (4,  1, '2024-02-14', 'delivered',   49.90),
  (5,  4, '2024-02-20', 'cancelled',  159.00),
  (6,  5, '2024-03-01', 'delivered',   89.00),
  (7,  2, '2024-03-09', 'pending',    121.00),
  (8,  7, '2024-03-15', 'shipped',     15.98),
  (9,  1, '2024-04-02', 'delivered',   45.00),
  (10, 8, '2024-04-18', 'delivered',  208.90),
  (11, 4, '2024-05-07', 'pending',     32.00),
  (12, 3, '2024-05-21', 'delivered',   24.50);

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES
  (1,  1, 4, 1, 1299.00),
  (2,  1, 1, 1,   49.90),
  (3,  2, 2, 3,   24.50),
  (4,  3, 3, 1,  189.00),
  (5,  4, 1, 1,   49.90),
  (6,  5, 8, 1,  159.00),
  (7,  6, 9, 1,   89.00),
  (8,  7, 7, 1,   32.00),
  (9,  7, 9, 1,   89.00),
  (10, 8, 5, 2,    7.99),
  (11, 9, 10, 1,  45.00),
  (12, 10, 3, 1, 189.00),
  (13, 10, 5, 1,   7.99),
  (14, 10, 6, 1,  11.91),
  (15, 11, 7, 1,  32.00),
  (16, 12, 2, 1,  24.50);

INSERT INTO employees (id, name, department, salary, manager_id, hire_date) VALUES
  (1,  'Priya Shah',    'Engineering', 145000, NULL, '2019-03-01'),
  (2,  'Tom Becker',    'Engineering', 120000, 1,    '2020-06-15'),
  (3,  'Mia Chen',      'Engineering', 110000, 1,    '2021-01-10'),
  (4,  'Omar Haddad',   'Sales',       105000, NULL, '2018-09-12'),
  (5,  'Lena Fischer',  'Sales',        72000, 4,    '2022-02-20'),
  (6,  'Jack Reyes',    'Sales',        68000, 4,    '2022-08-08'),
  (7,  'Nora Berg',     'Marketing',    90000, NULL, '2020-11-30'),
  (8,  'Sam Ito',       'Marketing',    64000, 7,    '2023-03-14'),
  (9,  'Zoe Park',      'Engineering',  98000, 2,    '2023-07-01'),
  (10, 'Ravi Menon',    'Sales',        70000, 4,    '2023-10-05');
