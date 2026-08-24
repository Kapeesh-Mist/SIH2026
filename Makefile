.PHONY: help install dev-backend dev-frontend test lint up down clean

help:
	@echo "FinTrack - Development & Automation Commands"
	@echo "---------------------------------------------"
	@echo "make install       - Install backend and frontend dependencies"
	@echo "make dev-backend   - Run FastAPI backend development server"
	@echo "make dev-frontend  - Run React/Vite frontend development server"
	@echo "make test          - Run backend pytest test suite"
	@echo "make lint          - Run linters (flake8 / mypy / eslint)"
	@echo "make up            - Launch all services using Docker Compose"
	@echo "make down          - Stop all Docker Compose services"
	@echo "make clean         - Clean cache directories and build artifacts"

install:
	cd backend && pip install -r requirements.txt -r requirements-dev.txt
	cd frontend && npm install

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000 --host 0.0.0.0

dev-frontend:
	cd frontend && npm run dev

test:
	cd backend && pytest -v

lint:
	cd backend && flake8 app tests --max-line-length=100 || true
	cd frontend && npm run lint || true

up:
	docker compose up --build -d

down:
	docker compose down

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	rm -rf frontend/dist
