from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# The connection string format: dialect+driver://username:password@host:port/database
# Update 'root' and 'password' to match your Docker MariaDB credentials
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://spms_user:spms_secure_password@127.0.0.1:3307/spms_db"
    
# Create the engine that manages connections to MariaDB
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create a session factory (used later to query the database)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# The base class that all our database models will inherit from
Base = declarative_base()

# Paste this at the bottom of database.py
def get_db():
    db = SessionLocal() # Make sure SessionLocal is defined above in this file!
    try:
        yield db
    finally:
        db.close()