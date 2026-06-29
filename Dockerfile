FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential curl nodejs npm \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m spacy download en_core_web_sm

# Pre-download the HuggingFace model
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

# Build React frontend
COPY frontend/package.json ./frontend/
RUN cd frontend && npm install

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Copy backend
COPY backend/ ./backend/

# Move built frontend into backend to be served as static files
RUN mv frontend/dist backend/static

EXPOSE 7860

CMD ["uvicorn", "backend.api:app", "--host", "0.0.0.0", "--port", "7860"]
