<div align="center">

  <h1>PRIME — Backend Service</h1>

  <br>

  ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
  ![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat&logo=python&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
  ![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=flat&logo=sqlalchemy&logoColor=white)
  ![JWT](https://img.shields.io/badge/JWT-Auth-black?style=flat&logo=jsonwebtokens&logoColor=white)
  ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
  ![Render](https://img.shields.io/badge/Hosted%20on-Render-46E3B7?style=flat&logo=render&logoColor=white)

</div>

---

## Overview

This is the **FastAPI backend service** for the MPDO PRIME System. It handles all business logic, data persistence, authentication, and external integrations. The API follows a layered architecture — routers → services → models — and exposes a versioned REST API at `/api/v1/`.

Interactive API documentation is auto-generated and available at `/docs` (Swagger UI) once the server is running.

---

## Technologies Used

| Technology | Purpose |
|---|---|
| **FastAPI** | Easy REST API framework with auto-generated docs |
| **Python 3.10+** | Core programming language |
| **PostgreSQL** | Primary relational database (hosted via Supabase) |
| **SQLAlchemy** | ORM for database modeling and queries |
| **Pydantic** | Request/response schema validation |
| **JWT (python-jose)** | Stateless authentication via access tokens |
| **Passlib / bcrypt** | Secure password hashing |
| **Uvicorn** | ASGI server for running FastAPI |
| **Docker** | Containerized deployment |
| **Render** | Cloud hosting for the production API |

---

## Prerequisites

Before running the backend, make sure you have:

- **Docker & Docker Compose** *(recommended)* — [Install Docker](https://docs.docker.com/get-docker/)
- **OR** Python 3.10+ — [Install Python](https://www.python.org/downloads/)
- A running **PostgreSQL** instance (local or Supabase)

---

## Environment Setup

Create a `.env` file in the **project root** (next to `docker-compose.yml`):

```env
# Database
POSTGRES_DB=pme_db
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
DATABASE_URL=postgresql://your_db_user:your_db_password@db:5432/pme_db

# JWT Authentication
JWT_SECRET_KEY=your_super_secret_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# External Integrations (optional)
DTS_API_BASE_URL=http://your-dts-api-url
LCS_API_BASE_URL=http://your-lcs-api-url
```

### Generate a Secure JWT Secret

**Python:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## Running the Backend

### Option A — With Docker (Recommended)

From the **project root** directory:

```bash
# Build and start the backend + database
docker-compose up --build backend db

# Or run all services (frontend included)
docker-compose up --build
```

The API will be available at:
- **API Base URL** → `http://localhost:8000/api/v1`
- **Swagger UI (Docs)** → `http://localhost:8000/docs`

To run in the background:
```bash
docker-compose up -d backend db
```

To stop:
```bash
docker-compose down
```

---

### Option B — Without Docker (Manual Setup)

**Step 1: Navigate to the backend folder**
```bash
cd pme-backend
```

**Step 2: Create and activate a virtual environment**
```bash
# Create virtual environment
python -m venv venv

# Activate — Windows
venv\Scripts\activate

# Activate — macOS/Linux
source venv/bin/activate
```

**Step 3: Install dependencies**
```bash
pip install -r requirements.txt
```

**Step 4: Set environment variables**

Either export them manually or create a `.env` file in the project root as described above.

**Step 5: Start the development server**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

What to expect: You'll see output like:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

---

## API Overview

All routes are versioned under `/api/v1/`. Key endpoint groups:

| Prefix | Description |
|---|---|
| `/auth` | Login, token refresh |
| `/users` | User management & profile |
| `/projects` | Project CRUD & lifecycle |
| `/aip` | Annual Investment Program management |
| `/budget` | Budget allocation tracking |
| `/finance` | Finance records (allotment, obligation, disbursement) |
| `/progress` | Physical progress logs |
| `/issues` | Issue and risk logging |
| `/performance` | Performance monitoring |
| `/analytics` | Dashboard analytics and charts |
| `/reports` | Report generation |
| `/map` | Geolocation data for map view |
| `/audit` | Audit trail logs |
| `/phase-configs` | Phase configuration management |

> Browse the full interactive documentation at `http://localhost:8000/docs` after starting the server.

---

## Deployment

The backend is deployed on **[Render](https://render.com)**:

1. Connect your GitHub repository to Render
2. Set all environment variables in Render's dashboard
3. Set the start command to:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

---

<div align="center">

Part of the **MPDO PRIME System** · [Back to Root README](../README.md)

</div>