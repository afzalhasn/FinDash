from typing import Generic, Optional, Sequence, TypeVar

from sqlalchemy.orm import Session


ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    """Simple repository wrapper around a SQLAlchemy session and model."""

    model: type[ModelType]

    def __init__(self, session: Session):
        self.session = session

    def add(self, instance: ModelType) -> ModelType:
        self.session.add(instance)
        return instance

    def get(self, id_) -> Optional[ModelType]:
        return self.session.get(self.model, id_)

    def list(self) -> Sequence[ModelType]:
        return self.session.query(self.model).all()

    def delete(self, instance: ModelType) -> None:
        self.session.delete(instance)

    def flush(self) -> None:
        self.session.flush()

    def commit(self) -> None:
        self.session.commit()

    def refresh(self, instance: ModelType) -> None:
        self.session.refresh(instance)
