"""Generate mock data for the KMRL database"""
import sys
sys.path.insert(0, '.')

from app.models.database import SessionLocal, init_db
from app.services.mock_data import MockDataGenerator

print("Initializing database...")
init_db()

print("\nGenerating mock data...")
db = SessionLocal()
generator = MockDataGenerator(db)
counts = generator.generate_all(clear_existing=True)

print("\n=== Data Generated ===")
for key, value in counts.items():
    print(f"  {key}: {value}")

db.close()
print("\nDone! Backend is ready with sample data.")
