import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

logger = logging.getLogger("smart_pharma.database")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./pharma.db")

# Handle PostgreSQL prefix compatibility
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

def get_engine():
    global DATABASE_URL
    try:
        if DATABASE_URL.startswith("sqlite"):
            engine = create_engine(
                DATABASE_URL,
                connect_args={"check_same_thread": False}
            )
        else:
            engine = create_engine(
                DATABASE_URL,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20
            )
            # Test connection
            with engine.connect() as conn:
                pass
        return engine
    except Exception as e:
        logger.warning(
            f"Failed to connect to primary database '{DATABASE_URL}': {e}. "
            f"Falling back to local SQLite database 'sqlite:///./pharma.db' for seamless operation."
        )
        DATABASE_URL = "sqlite:///./pharma.db"
        return create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False}
        )

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
