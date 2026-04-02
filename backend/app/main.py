from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import content, dashboard, generation, schedule, seo, validation
from app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Verbum API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(content.router, prefix="/api/content", tags=["content"])
app.include_router(generation.router, prefix="/api/generation", tags=["generation"])
app.include_router(validation.router, prefix="/api/validation", tags=["validation"])
app.include_router(schedule.router, prefix="/api/schedule", tags=["schedule"])
app.include_router(seo.router, prefix="/api/seo", tags=["seo"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
