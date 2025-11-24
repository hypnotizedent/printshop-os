# Label Formatter Service Dockerfile
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies for PDF processing
RUN apt-get update && apt-get install -y \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir \
    Pillow>=10.2.0 \
    PyPDF2>=3.0.0 \
    reportlab>=4.0.0 \
    pdf2image>=1.16.3 \
    flask>=2.3.2 \
    flask-cors>=4.0.0

# Copy application code
COPY printshop_os /app/printshop_os

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:5001/health')"

# Set environment variables
ENV PYTHONPATH=/app
ENV FLASK_ENV=production

# Run the application
CMD ["python", "-m", "printshop_os.labels.api"]
