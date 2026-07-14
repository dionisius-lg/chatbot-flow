# Chatbot Flow Builder

A visual drag-and-drop conversation flow builder Single Page Application (SPA) for designing, configuring, and managing chatbot conversation trees.

## Features

- **Template Management**: Complete CRUD operations for bot templates with pagination.
- **Visual Flow Canvas**: Drag-and-drop flow diagram designer built on top of `@xyflow/react`.
- **Interactive Inspector Panel**: Detail properties editor for flow states, conversation dialogs, and choice branching.
- **Comprehensive Error Handling**: Real-time validation and user-friendly error banners capturing backend validation and HTTP failures.
- **Robust Session & Security**: Automatic token refreshing, multi-server environment configuration, and AES-256-CBC session encryption.

---

## Tech Stack

| Layer            | Technology                       | Version |
| ---------------- | -------------------------------- | ------- |
| Framework        | **React**                        | 19.x    |
| Language         | **TypeScript**                   | 6.x     |
| Styling          | **Tailwind CSS**                 | 4.x     |
| Build Tool       | **Vite**                         | 8.x     |
| State Management | **Zustand**                      | 5.x     |
| Routing          | **React Router DOM**             | 7.x     |
| Flow Canvas      | **React Flow (`@xyflow/react`)** | 12.x    |
| HTTP Client      | **Axios**                        | 1.x     |

---

## Project Structure

```
src/
├── config/          # Axios client (api.ts), constants, and type mapping tables
├── store/           # Zustand global state stores (authStore, flowStore)
├── lib/             # Pure utility helpers (encryption, pagination, value parsing)
├── components/      # UI Components
│   ├── canvas/      # React Flow canvas wrapper and custom node renderer
│   ├── editor/      # Sidebar Inspector, DialogEditor, and OptionsEditor
│   └── ui/          # Generic reusable components (Pagination controls)
└── views/           # Page-level routing entry components (Login, Dashboard, Builder)
```

---

## Quick Start

### 1. Installation

Install project dependencies:

```bash
npm install
```

### 2. Environment Configuration

Copy the environment variables template and configure your ports:

```bash
cp .env.example .env
```

### 3. Running Development Server

Start the local hot-reloading development server (default port is `8082`):

```bash
npm run dev
```

### 4. Build for Production

Generate the production bundle inside the `dist` directory:

```bash
npm run build
```

---

## Architecture & Data Flow

### Communication Architecture

```
Component ──> Store Action ──> api.ts Wrapper ──> Axios ──> Backend API (Port 8000)
```

- **Axios Interceptor**: Automatically injects Bearer token credentials decrypted from `sessionStorage` via the Web Crypto API, sets the dynamic base URL, and implements queued token refresh on `401 Unauthorized` responses.
- **Error Propagation**: Mutations in `flowStore.ts` validate API responses. If `success === false` is returned, a descriptive `Error` is thrown containing the backend's validation message.
- **UI Error Banner**: Views and components (Dashboard, Inspector Panel, OptionsEditor, FlowCanvas popup) handle the thrown errors via `try-catch` blocks and display them in localized dismissible banners.
