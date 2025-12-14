from sqlalchemy.orm import DeclarativeBase, declared_attr


class Base(DeclarativeBase):
    """Declarative base class providing automatic table naming."""

    @declared_attr.directive
    def __tablename__(cls) -> str:  # type: ignore[override]
        return cls.__name__.lower()
