from app.api.dependencies import get_maintenance_service


class StubMaintenanceService:
    def __init__(self):
        self.invoked = False

    def reset_database(self):
        self.invoked = True


def test_reset_database_invokes_service(authorized_client):
    stub = StubMaintenanceService()
    authorized_client.app.dependency_overrides[get_maintenance_service] = lambda: stub

    response = authorized_client.post("/api/v1/admin/reset-database")

    assert response.status_code == 200
    assert response.json()["detail"] == "Database reset and seeded"
    assert stub.invoked
