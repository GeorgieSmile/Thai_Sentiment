# --- Thai_Sentiment_API/Dockerfile ---
FROM python:3.10-slim

# 1. Set working dir
WORKDIR /app

# 2. Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. Copy app code & models
COPY . .

# 4. Expose port and launch Uvicorn
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]