"""
Prisma Client Singleton — AIOS PostgreSQL Layer
Provides an async Prisma client for the FastAPI application.
"""
import logging
from prisma import Prisma
from backend.config import settings

logger = logging.getLogger("aios.prisma")

# Global Prisma client instance (singleton)
_prisma_client: Prisma = None


async def connect_prisma() -> None:
    """Connect the Prisma client to PostgreSQL. Called on FastAPI startup."""
    global _prisma_client
    try:
        _prisma_client = Prisma(datasource={"url": settings.PRISMA_DATABASE_URL})
        await _prisma_client.connect()
        logger.info("✅ Prisma client connected to PostgreSQL successfully.")
    except Exception as e:
        logger.error(f"❌ Failed to connect Prisma client: {e}")
        # Set to None so the app can still start with SQLite fallback
        _prisma_client = None


async def disconnect_prisma() -> None:
    """Disconnect the Prisma client. Called on FastAPI shutdown."""
    global _prisma_client
    if _prisma_client and _prisma_client.is_connected():
        await _prisma_client.disconnect()
        logger.info("🔌 Prisma client disconnected.")


def get_prisma() -> Prisma:
    """
    FastAPI dependency that returns the Prisma client.
    Raises RuntimeError if client is not connected.
    """
    if _prisma_client is None:
        raise RuntimeError(
            "Prisma client is not initialized. "
            "Ensure PostgreSQL is running and PRISMA_DATABASE_URL is configured correctly."
        )
    return _prisma_client


def is_prisma_connected() -> bool:
    """Returns True if the Prisma client is active and connected."""
    return _prisma_client is not None and _prisma_client.is_connected()
