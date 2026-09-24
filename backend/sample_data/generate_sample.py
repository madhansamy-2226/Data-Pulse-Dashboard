import csv
import random
from datetime import datetime, timedelta
import os

CATEGORIES = {
    'Electronics': [
        ('MacBook Pro 16', 2499.00),
        ('Dell XPS 15', 1899.00),
        ('Sony WH-1000XM5 Headphones', 399.00),
        ('Logitech MX Master 3S', 99.00),
        ('Samsung 4K 32-inch Monitor', 499.00),
        ('Apple iPad Air M2', 599.00),
    ],
    'Furniture': [
        ('Ergonomic Mesh Chair', 350.00),
        ('Electric Standing Desk 60x30', 580.00),
        ('LED Desk Lamp with Wireless Charger', 45.00),
        ('Dual Monitor Arm Mount', 75.00),
        ('Under-desk Footrest', 35.00),
    ],
    'Office Supplies': [
        ('Premium Hardcover Notebooks (Pack of 3)', 24.99),
        ('Gel Pen Set (12-pack)', 14.50),
        ('Heavy-Duty Desktop Stapler', 18.00),
        ('Cable Management Kit', 19.99),
        ('Dry Erase Magnetic Whiteboard', 89.00),
    ],
    'Software & Cloud': [
        ('SalesPulse Enterprise Annual License', 1200.00),
        ('Team Workspace Cloud Storage (1TB)', 120.00),
        ('Security Audit Suite Pro', 450.00),
        ('API Gateway Developer Pass', 299.00),
    ]
}

REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East']
STATUSES = ['Completed', 'Completed', 'Completed', 'Completed', 'Pending', 'Refunded']
CUSTOMERS = [
    ('Alice Walker', 'alice.w@example.com'),
    ('Bob Martinez', 'bob.m@example.com'),
    ('Charlie Zhang', 'charlie.z@example.com'),
    ('Diana Prince', 'diana.p@example.com'),
    ('Evan Hughes', 'evan.h@example.com'),
    ('Fiona Gallagher', 'fiona.g@example.com'),
    ('George Clark', 'george.c@example.com'),
    ('Hannah Abbott', 'hannah.a@example.com'),
    ('Ian Malcolm', 'ian.m@example.com'),
    ('Julia Roberts', 'julia.r@example.com'),
]

def generate_csv(file_path: str, num_rows: int = 10000, inject_errors: bool = False):
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    start_date = datetime.now() - timedelta(days=180)
    
    with open(file_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'order_id', 'date', 'customer_name', 'customer_email',
            'product_name', 'category', 'region', 'quantity',
            'unit_price', 'discount_percent', 'total_revenue', 'status'
        ])
        
        for i in range(1, num_rows + 1):
            # Error injection for demonstration of row-level error handling
            if inject_errors and (i == 15 or i == 142 or i == 512):
                writer.writerow([
                    f"ORD-ERR-{i:06d}",
                    "INVALID_DATE_FORMAT",
                    "Bad Record User",
                    "bad@test",
                    "Corrupted Item",
                    "ErrorCategory",
                    "Nowhere",
                    "-5", # invalid negative quantity
                    "N/A", # invalid price
                    "0",
                    "0",
                    "Completed"
                ])
                continue

            category = random.choice(list(CATEGORIES.keys()))
            product_name, unit_price = random.choice(CATEGORIES[category])
            
            # Vary unit price slightly (discounts or bulk pricing)
            customer_name, customer_email = random.choice(CUSTOMERS)
            region = random.choice(REGIONS)
            quantity = random.choices([1, 2, 3, 4, 5, 10], weights=[50, 25, 12, 8, 3, 2])[0]
            discount = random.choices([0.0, 5.0, 10.0, 15.0, 20.0], weights=[60, 15, 12, 8, 5])[0]
            
            order_date = start_date + timedelta(days=random.randint(0, 180))
            date_str = order_date.strftime('%Y-%m-%d')
            
            total_rev = round(float(unit_price) * quantity * (1.0 - (discount / 100.0)), 2)
            status = random.choice(STATUSES)
            
            writer.writerow([
                f"ORD-{i:06d}",
                date_str,
                customer_name,
                customer_email,
                product_name,
                category,
                region,
                quantity,
                f"{unit_price:.2f}",
                f"{discount:.1f}",
                f"{total_rev:.2f}",
                status
            ])
            
    print(f"Generated {num_rows} rows dataset at: {file_path}")

if __name__ == '__main__':
    base_dir = os.path.dirname(__file__)
    clean_csv = os.path.join(base_dir, 'sample_sales_10k.csv')
    dirty_csv = os.path.join(base_dir, 'sample_sales_with_errors.csv')
    
    generate_csv(clean_csv, num_rows=10000, inject_errors=False)
    generate_csv(dirty_csv, num_rows=2000, inject_errors=True)
