-- Insert initial marshal records
-- Update these with actual marshal IDs and names

INSERT INTO marshals (id, name) VALUES
('MAR001', 'Pradeep Kumar'),
('MAR002', 'Rajesh Singh'),
('MAR003', 'Amit Patel'),
('MAR004', 'Suresh Kumar'),
('MAR005', 'Vijay Sharma'),
('MAR006', 'Ramesh Reddy'),
('MAR007', 'Kiran Joshi'),
('MAR008', 'Sanjay Mehta'),
('MAR009', 'Anil Gupta'),
('MAR010', 'Deepak Verma');

-- Insert initial admin
INSERT INTO admins (email, password_hash) VALUES
('admin@mahe.edu', crypt('secureadminpassword', gen_salt('bf')));