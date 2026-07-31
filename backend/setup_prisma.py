"""
AIOS Setup Script — Run Prisma generate and db push
Convenience script to set up the PostgreSQL database schema.

Usage:
    python backend/setup_prisma.py

Requirements:
    - PostgreSQL running at PRISMA_DATABASE_URL
    - prisma package installed: pip install prisma
"""
import os
import sys
import subprocess
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aios.setup")

PRISMA_SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "prisma", "schema.prisma")


def run_prisma_generate():
    """Run prisma generate to create the Python client from schema."""
    logger.info("🔧 Running: prisma generate ...")
    result = subprocess.run(
        [sys.executable, "-m", "prisma", "generate", "--schema", PRISMA_SCHEMA_PATH],
        capture_output=True,
        text=True,
        cwd=os.path.dirname(__file__),
    )
    if result.returncode != 0:
        logger.error(f"❌ prisma generate failed:\n{result.stderr}")
        return False
    logger.info(f"✅ prisma generate complete:\n{result.stdout}")
    return True


def run_prisma_db_push():
    """Run prisma db push to sync schema to PostgreSQL (no migration history)."""
    logger.info("🔧 Running: prisma db push ...")
    result = subprocess.run(
        [sys.executable, "-m", "prisma", "db", "push",
         "--schema", PRISMA_SCHEMA_PATH, "--accept-data-loss"],
        capture_output=True,
        text=True,
        cwd=os.path.dirname(__file__),
        env={**os.environ, "PRISMA_DATABASE_URL": os.getenv(
            "PRISMA_DATABASE_URL",
            "postgresql://aios_admin:secure_aios_db_pass@localhost:5432/aios_db"
        )},
    )
    if result.returncode != 0:
        logger.error(f"❌ prisma db push failed:\n{result.stderr}")
        return False
    logger.info(f"✅ prisma db push complete:\n{result.stdout}")
    return True


def run_prisma_migrate():
    """Alternative: run prisma migrate dev (creates migration history)."""
    logger.info("🔧 Running: prisma migrate dev ...")
    result = subprocess.run(
        [sys.executable, "-m", "prisma", "migrate", "dev",
         "--schema", PRISMA_SCHEMA_PATH,
         "--name", "aios_initial_schema",
         "--skip-generate"],
        capture_output=True,
        text=True,
        cwd=os.path.dirname(__file__),
        env={**os.environ, "PRISMA_DATABASE_URL": os.getenv(
            "PRISMA_DATABASE_URL",
            "postgresql://aios_admin:secure_aios_db_pass@localhost:5432/aios_db"
        )},
    )
    if result.returncode != 0:
        logger.error(f"❌ prisma migrate dev failed:\n{result.stderr}")
        return False
    logger.info(f"✅ prisma migrate dev complete:\n{result.stdout}")
    return True


async def seed_database():
    """Seed the AIOS agents and system settings after schema creation."""
    from prisma import Prisma
    from backend.database.seed_aios import run_seed

    db_url = os.getenv(
        "PRISMA_DATABASE_URL",
        "postgresql://aios_admin:secure_aios_db_pass@localhost:5432/aios_db"
    )
    prisma = Prisma(datasource={"url": db_url})
    try:
        await prisma.connect()
        result = await run_seed(prisma)
        logger.info(f"✅ Seed complete: {result}")
    except Exception as e:
        logger.error(f"❌ Seed failed: {e}")
    finally:
        await prisma.disconnect()


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("  AIOS PostgreSQL + Prisma Setup")
    logger.info("=" * 60)

    # Step 1: Generate Prisma client
    if not run_prisma_generate():
        sys.exit(1)

    # Step 2: Push schema to PostgreSQL
    if not run_prisma_db_push():
        logger.warning("⚠️  db push failed. Trying migrate dev...")
        if not run_prisma_migrate():
            sys.exit(1)

    # Step 3: Seed the database
    logger.info("🌱 Seeding AIOS database...")
    asyncio.run(seed_database())

    logger.info("\n✅ AIOS PostgreSQL setup complete!")
    logger.info("   Start the API: uvicorn backend.main:app --reload")
