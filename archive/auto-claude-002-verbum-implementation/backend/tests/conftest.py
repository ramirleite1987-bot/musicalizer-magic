from unittest.mock import AsyncMock, MagicMock

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.main import app


@pytest_asyncio.fixture
async def async_engine():
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        echo=False,
        future=True,
    )
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def session(async_engine):
    async_session_factory = sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with async_session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def client(session):
    from httpx import ASGITransport, AsyncClient

    async def _override_get_session():
        yield session

    app.dependency_overrides[get_session] = _override_get_session

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def mock_ai_service():
    service = MagicMock()
    service.generate = AsyncMock(return_value="Generated content")
    service.generate_stream = AsyncMock()
    service.list_providers = MagicMock(return_value=["claude", "openai"])
    return service


@pytest.fixture
def mock_validation_service():
    service = MagicMock()
    service.validate = AsyncMock(
        return_value={
            "is_valid": True,
            "score": 0.95,
            "issues": [],
            "citations": [],
            "provider": "mock",
        }
    )
    return service
