# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY . /app

# Install dependencies
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi
# Manually install known dependencies if requirements.txt is missing or incomplete for Docker
RUN pip install --no-cache-dir a2a-sdk google-generativeai uvicorn[standard] python-multipart pydantic httpx starlette

# Make port 8001 available to the world outside this container
EXPOSE 8001

# Run the agent
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
