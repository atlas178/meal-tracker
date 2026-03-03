FROM node:20-slim

WORKDIR /app

# Install build tools for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy and build frontend
COPY frontend/package*.json frontend/
RUN cd frontend && npm install

COPY frontend/ frontend/
RUN cd frontend && npm run build

# Copy and build backend
COPY backend/package*.json backend/
RUN cd backend && npm install

COPY backend/ backend/

ENV PORT=3001
ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "backend/src/index.js"]
