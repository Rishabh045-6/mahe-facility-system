-- Insert initial marshal records
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
('MAR010', 'Deepak Verma'),
('MAR011', 'Manoj Kumar'),
('MAR012', 'Sunil Singh'),
('MAR013', 'Rahul Sharma'),
('MAR014', 'Ashok Patel'),
('MAR015', 'Naveen Reddy'),
('MAR016', 'Dinesh Joshi'),
('MAR017', 'Vikram Mehta'),
('MAR018', 'Harish Gupta'),
('MAR019', 'Rohit Verma'),
('MAR020', 'Arun Kumar');

-- Insert initial admin (password: Admin@123)
INSERT INTO admins (email, password_hash) VALUES
('admin@mahe.edu', crypt('Admin@123', gen_salt('bf')));

-- Optional: Insert sample issues for testing
-- INSERT INTO issues (block, floor, room_location, issue_type, description, marshal_id, status)
-- VALUES 
-- ('AB1', '1', 'Room 101', 'Electrical - Lights', 'Light not working in Room 101', 'MAR001', 'approved'),
-- ('AB2', '3', 'Corridor B', 'Fans/Ventilation', 'Fan making noise', 'MAR002', 'approved');