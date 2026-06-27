from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
    
# Create the engine that manages connections to MariaDB
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create a session factory (used later to query the database)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# The base class that all our database models will inherit from
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
