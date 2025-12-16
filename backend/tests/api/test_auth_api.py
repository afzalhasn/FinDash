from app.models import UserRole
from app.services.auth import AuthService


def test_login_returns_tokens_for_valid_credentials(client, user_factory):
    user = user_factory(email="login@example.com", password="secret-pass", role=UserRole.admin)

    response = client.post("/api/v1/auth/login", json={"email": user.email, "password": "secret-pass"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["user"]["email"] == user.email
    assert payload["access_token"]
    assert payload["refresh_token"]


def test_login_rejects_invalid_password(client, user_factory):
    user = user_factory(email="wrongpwd@example.com", password="correct-password")

    response = client.post("/api/v1/auth/login", json={"email": user.email, "password": "bad"})

    assert response.status_code == 401


def test_refresh_issues_new_tokens(client, user_factory):
    user = user_factory(email="refresh@example.com", password="refresh-pass")
    login = client.post("/api/v1/auth/login", json={"email": user.email, "password": "refresh-pass"})
    refresh_token = login.json()["refresh_token"]

    response = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})

    assert response.status_code == 200
    refreshed = response.json()
    assert refreshed["access_token"] != login.json()["access_token"]
    assert refreshed["user"]["email"] == user.email


def test_logout_revokes_refresh_token(client, user_factory):
    user = user_factory(email="logout@example.com", password="logout-pass")
    login = client.post("/api/v1/auth/login", json={"email": user.email, "password": "logout-pass"})
    refresh_token = login.json()["refresh_token"]

    response = client.post("/api/v1/auth/logout", json={"refresh_token": refresh_token})

    assert response.status_code == 200
    assert response.json()["detail"] == "Logged out"
    assert refresh_token in AuthService.revoked_refresh_tokens


def test_me_returns_current_user(authorized_client, admin_user):
    response = authorized_client.get("/api/v1/auth/me")

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == admin_user.email
    assert data["role"] == admin_user.role.value
