"""
database.py
-----------
Thin data-access layer. If MONGO_URI is configured, uses Motor
(async MongoDB driver). Otherwise falls back to a simple in-process
dictionary store, so the whole app is runnable on Replit with zero
external setup, and upgrading to real persistence later is a one-env-var
change with no code changes required by the routers.
"""

from __future__ import annotations

import itertools
import uuid
from typing import Any, Dict, List, Optional

from config import settings

_USE_MONGO = bool(settings.MONGO_URI)

if _USE_MONGO:
    from motor.motor_asyncio import AsyncIOMotorClient

    _client = AsyncIOMotorClient(settings.MONGO_URI)
    _db = _client[settings.MONGO_DB_NAME]


class InMemoryCollection:
    """Minimal Mongo-like async interface backed by an in-memory dict."""

    def __init__(self, name: str):
        self.name = name
        self._store: Dict[str, Dict[str, Any]] = {}

    async def insert_one(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        doc = dict(doc)
        doc.setdefault("_id", str(uuid.uuid4()))
        self._store[doc["_id"]] = doc
        return doc

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for doc in self._store.values():
            if all(doc.get(k) == v for k, v in query.items()):
                return doc
        return None

    async def find(self, query: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        query = query or {}
        return [
            doc for doc in self._store.values()
            if all(doc.get(k) == v for k, v in query.items())
        ]

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]) -> bool:
        doc = await self.find_one(query)
        if not doc:
            return False
        set_fields = update.get("$set", {})
        doc.update(set_fields)
        self._store[doc["_id"]] = doc
        return True

    async def count(self, query: Optional[Dict[str, Any]] = None) -> int:
        return len(await self.find(query))


class InMemoryDB:
    """Lazily creates a named in-memory collection on first access."""

    def __init__(self):
        self._collections: Dict[str, InMemoryCollection] = {}

    def __getitem__(self, name: str) -> InMemoryCollection:
        if name not in self._collections:
            self._collections[name] = InMemoryCollection(name)
        return self._collections[name]


_in_memory_db = InMemoryDB()


def get_db():
    """
    Returns a Mongo-like database handle. Routers call
    `db["users"]`, `db["sessions"]`, etc. and never need to know whether
    they're talking to real MongoDB or the in-memory fallback.
    """
    if _USE_MONGO:
        return _db
    return _in_memory_db


def is_using_real_mongo() -> bool:
    return _USE_MONGO
