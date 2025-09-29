# Use Python slim image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY app/ .

# Set environment variables (optional)
ENV FLASK_APP=main.py

# Run the app
CMD ["python", "main.py"]
