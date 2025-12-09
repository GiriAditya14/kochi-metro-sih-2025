import sys
from sqlalchemy import text, inspect
from app.models.database import engine


def main():
    inspector = inspect(engine)
    cols = [c["name"] for c in inspector.get_columns("users")]
    print("Columns:", cols)
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            if "password_hash" not in cols:
                print("Adding password_hash column...")
                conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR"))
            trans.commit()
            print("Done")
        except Exception as e:
            print("Error:", e)
            trans.rollback()
            sys.exit(1)


if __name__ == "__main__":
    main()

