<div align="center">

  <h1>PRIME — Frontend Application</h1>
  <h3>pme-frontend · React + Vite + TypeScript</h3>

  <br>

  ![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
  ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
  ![Recharts](https://img.shields.io/badge/Recharts-Charts-FF6384?style=flat)
  ![Leaflet](https://img.shields.io/badge/Leaflet.js-Map-199900?style=flat&logo=leaflet&logoColor=white)
  ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
  ![Netlify](https://img.shields.io/badge/Hosted%20on-Netlify-00C7B7?style=flat&logo=netlify&logoColor=white)

</div>

---

## Overview

This is the **React frontend application** for the MPDO PRIME System. It provides a responsive, role-based web interface for MPDO staff and administrators to monitor municipal projects, track budgets, visualize analytics, and manage system data.

The application communicates with the `pme-backend` FastAPI service through a typed service layer, and renders interactive dashboards, maps, charts, and data tables for real-time project oversight.

---

## Technologies Used

| Technology | Purpose |
|---|---|
| **React 18** | Component-based UI framework |
| **TypeScript** | Type-safe JavaScript for maintainability |
| **Vite** | Fast development server and build tooling |
| **TailwindCSS** | Utility-first CSS styling |
| **shadcn/ui** | Accessible, pre-built UI component library |
| **Recharts** | Declarative data visualization (bar, pie, line charts) |
| **Leaflet.js** | Interactive project location map |
| **TanStack Table** | Powerful data table management |
| **React Router** | Client-side routing and navigation |
| **Docker** | Containerized deployment |
| **Netlify** | Cloud hosting for the production build |

---

## Prerequisites

Before running the frontend, make sure you have:

- **Docker & Docker Compose** *(recommended)* — [Install Docker](https://docs.docker.com/get-docker/)
- **OR** Node.js 18+ — [Install Node.js](https://nodejs.org/)
- The **`pme-backend` service** must be running and accessible

---

## Environment Setup

Create a `.env` file inside the `pme-frontend/` folder:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

> Change the URL to point to your backend's deployed address when working against staging or production.

---

## Running the Frontend

### Option A — With Docker (Recommended)

From the **project root** directory:

```bash
# Start all services (backend + frontend + database)
docker-compose up --build

# Or start frontend only (assumes backend is already running)
docker-compose up --build frontend
```

The application will be available at:
- **Frontend App** → `http://localhost:5173`

To run in the background:
```bash
docker-compose up -d frontend
```

To stop:
```bash
docker-compose down
```

---

### Option B — Without Docker (Manual Setup)

**Step 1: Navigate to the frontend folder**
```bash
cd pme-frontend
```

**Step 2: Install dependencies**
```bash
npm install
```

**Step 3: Set up the environment file**

Create a `.env` file in the `pme-frontend/` directory:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

**Step 4: Start the development server**
```bash
npm run dev
```

What to expect: You'll see output like:
```
  VITE v5.x.x  ready in 300ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open your browser and go to **http://localhost:5173** — the PRIME landing page will appear.

> **Important:** Keep the backend server running in a separate terminal. The frontend will not function without a live connection to the API.

---

## Available Scripts

Run these from inside the `pme-frontend/` directory:

| Command | Description |
|---|---|
| `npm run dev` | Start the local development server with hot reload |
| `npm run build` | Build the production-optimized bundle |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint to check for code issues |

---

## Pages & Navigation

| Route | Page | Access |
|---|---|---|
| `/` | Landing Page / Login | Public |
| `/overview` | Dashboard & KPI Overview | Staff, Admin |
| `/projects` | Project List | Staff, Admin |
| `/projects/create` | Create New Project | Staff, Admin |
| `/aip` | AIP Management | Staff, Admin |
| `/budget` | Budget & Financials | Staff, Admin |
| `/monitoring` | Progress Monitoring | Staff, Admin |
| `/issues` | Issues & Risks | Staff, Admin |
| `/gantt` | Gantt Chart View | Staff, Admin |
| `/map` | Project Map | Staff, Admin |
| `/program` | Program Management | Staff, Admin |
| `/audit` | Audit Logs | Staff, Admin |
| `/profile` | User Profile | Staff, Admin |
| `/accounts` | User Account Management | Admin only |
| `/settings` | System Settings | Admin only |

---

## Deployment

The frontend is deployed on **[Netlify](https://netlify.com)**:

1. Connect your GitHub repository to Netlify
2. Set the build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Add environment variable in Netlify's dashboard:
   ```
   VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
   ```

---

<div align="center">

Part of the **MPDO PRIME System** · [Back to Root README](../README.md)

</div>