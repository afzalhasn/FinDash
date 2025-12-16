from app.models import UserRole


def test_list_users_returns_all(authorized_client, user_factory):
    user_factory(role=UserRole.partner, email="partner-one@example.com")
    user_factory(role=UserRole.staff, email="staff-one@example.com")

    response = authorized_client.get("/api/v1/users/")

    assert response.status_code == 200
    users = response.json()
    emails = [user["email"] for user in users]
    assert "partner-one@example.com" in emails
    assert "staff-one@example.com" in emails


def test_create_user_persists_new_record(authorized_client):
    payload = {
        "name": "Created User",
        "email": "new-user@example.com",
        "role": UserRole.staff.value,
        "password": "pass1234",
    }

    response = authorized_client.post("/api/v1/users/", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == payload["email"]
    assert body["role"] == payload["role"]


def test_create_user_rejects_duplicate_email(authorized_client, user_factory):
    existing = user_factory(email="duplicate@example.com")

    payload = {"name": "Dup", "email": existing.email, "role": UserRole.staff.value, "password": "dup-pass"}
    response = authorized_client.post("/api/v1/users/", json=payload)

    assert response.status_code == 400


def test_update_user_changes_fields(authorized_client, user_factory):
    target = user_factory(name="Original Name", email="update@example.com")
    payload = {"name": "Updated Name", "email": "updated-email@example.com"}

    response = authorized_client.patch(f"/api/v1/users/{target.id}", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == payload["name"]
    assert body["email"] == payload["email"]


def test_update_user_role_and_status(authorized_client, user_factory, db_session):
    target = user_factory(role=UserRole.staff, email="role-update@example.com")
    payload = {"role": UserRole.partner.value, "disabled": True}

    response = authorized_client.patch(f"/api/v1/users/{target.id}/role", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["role"] == payload["role"]
    db_session.refresh(target)
    assert target.disabled is True
