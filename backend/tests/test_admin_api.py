import uuid

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user, get_maintenance_service
from app.main import create_app
from app.models import User, UserRole


class DummyMaintenanceService:
    def __init__(self):
        self.reset_called = False

    def reset_database(self):
        self.reset_called = True


def make_admin_user(role: UserRole = UserRole.admin) -> User:
    return User(
        id=uuid.uuid4(),
        email="admin@findash.com",
        name="Admin User",
        hashed_password="hash",
        role=role,
        disabled=False,
    )


def test_reset_database_endpoint_invokes_service():
    app = create_app()
    dummy_service = DummyMaintenanceService()
    app.dependency_overrides[get_current_user] = lambda: make_admin_user()
    app.dependency_overrides[get_maintenance_service] = lambda: dummy_service

    client = TestClient(app)
    response = client.post("/api/v1/admin/reset-database")

    assert response.status_code == 200
    assert response.json()["detail"].startswith("Database reset")
    assert dummy_service.reset_called


def test_reset_database_requires_admin_role():
    app = create_app()
    dummy_service = DummyMaintenanceService()
    app.dependency_overrides[get_current_user] = lambda: make_admin_user(role=UserRole.staff)
    app.dependency_overrides[get_maintenance_service] = lambda: dummy_service

    client = TestClient(app)
    response = client.post("/api/v1/admin/reset-database")

    assert response.status_code == 403
    assert not dummy_service.reset_called
