import logging
from logging.config import dictConfig
from pathlib import Path

from .config import Settings


class CorrelationIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "correlation_id"):
            record.correlation_id = "-"
        return True


def configure_logging(settings: Settings) -> None:
    """Configure structured logging for the application."""

    log_dir = Path("logs")
    log_dir.mkdir(parents=True, exist_ok=True)
    file_path = log_dir / "app.log"

    logging_config = {
        "version": 1,
        "formatters": {
            "default": {
                "format": "%(asctime)s %(levelname)s %(name)s %(correlation_id)s %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
        },
        "filters": {"correlation": {"()": CorrelationIdFilter}},
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "default",
                "filters": ["correlation"],
            },
            "file": {
                "class": "logging.handlers.TimedRotatingFileHandler",
                "formatter": "default",
                "filters": ["correlation"],
                "filename": str(file_path),
                "when": "midnight",
                "backupCount": 14,
                "encoding": "utf-8",
            },
        },
        "root": {
            "level": settings.log_level.upper(),
            "handlers": ["console", "file"],
        },
        "disable_existing_loggers": False,
    }

    dictConfig(logging_config)
