FROM python:3.10-slim

WORKDIR /app

# Install compilation tools (required for faiss-cpu or matching libs on slim images)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Pre-download and bake in the embedding model so it's not fetched at
# runtime — keeps cold starts fast and avoids a network dependency after
# every restart (Render free tier spins the service down when idle).
RUN python -c "from fastembed import TextEmbedding; TextEmbedding(model_name='sentence-transformers/all-MiniLM-L6-v2')"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
