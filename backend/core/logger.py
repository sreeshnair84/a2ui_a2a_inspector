import logging
import sys
from typing import Optional

def configure_logging(level: int = logging.INFO, log_file: Optional[str] = None):
    """
    Configures the root logger with a standard format.
    
    Format includes:
    - Timestamp
    - Logger Name
    - Log Level
    - Filename and Line Number (Critical for debugging)
    - Message
    """
    
    # Define format
    log_format = '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
    formatter = logging.Formatter(log_format)

    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    
    # Remove existing handlers to avoid duplicates
    if root_logger.handlers:
        root_logger.handlers.clear()

    # Stream Handler (Console)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # File Handler (Optional)
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)
        
    logging.info("Logging configured successfully.")

def get_logger(name: str) -> logging.Logger:
    """Helper to get a logger with the module name."""
    return logging.getLogger(name)
