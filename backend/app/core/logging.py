import logging
from logging.config import dictConfig

from .config import Settings


def configure_logging(settings: Settings) -> None:
    """Configure structured logging for the application."""

    logging_config = {
        "version": 1,
        "formatters": {
            "default": {
                "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "default",
            },
        },
        "root": {
            "level": settings.log_level.upper(),
            "handlers": ["console"],
        },
        "disable_existing_loggers": False,
    }

    dictConfig(logging_config)
