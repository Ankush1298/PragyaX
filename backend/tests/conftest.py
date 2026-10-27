"""
Pytest configuration for PragyaX backend tests.
Configures default SQLite contract factories for gamification and battle contracts.
"""

import os


def pytest_configure(config):
    """Sets default SQLite contract factories for gamification and battle repositories if not set."""
    os.environ.setdefault(
        "PRAGYAX_CONTRACT_SQLITE_FACTORY",
        "backend.app.database.sqlite_gamification_repository:make_sqlite_gamification_repository"
    )
    os.environ.setdefault(
        "PRAGYAX_BATTLE_CONTRACT_SQLITE_FACTORY",
        "backend.app.database.sqlite_battle_repository:make_sqlite_battle_repository"
    )
