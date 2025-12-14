import uuid

from app.models import User, UserRole
from app.services.users import UserService


class FakeRepo:
    def __init__(self):
        self.items = {}

    def list(self):
        return list(self.items.values())

    def add(self, user):
        self.items[user.email] = user

    def flush(self):
        pass

    def find_by_email(self, email):
        return self.items.get(email)

    def get(self, user_id):
        for user in self.items.values():
            if user.id == user_id:
                return user
        return None


class FakeAuditRepo:
    def __init__(self):
        self.logs = []

    def add(self, log):
        self.logs.append(log)


def test_create_user_adds_audit_log():
    user_repo = FakeRepo()
    audit_repo = FakeAuditRepo()
    service = UserService(user_repo, audit_repo)

    service.create_user(name="Test", email="test@example.com", role=UserRole.staff, password="pass")

    assert len(audit_repo.logs) == 1
    log = audit_repo.logs[0]
    assert log.entity_type == "user"
    assert log.action == "create"


def test_update_role_logs_changes():
    user_repo = FakeRepo()
    user = User(id=uuid.uuid4(), name="User", email="user@example.com", role=UserRole.staff, hashed_password="hash")
    user_repo.items[user.email] = user

    audit_repo = FakeAuditRepo()
    service = UserService(user_repo, audit_repo)

    service.update_role_status(user.id, role=UserRole.admin, disabled=True)

    assert len(audit_repo.logs) == 1
    log = audit_repo.logs[0]
    assert log.action == "role_update"
