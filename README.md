# Policy Pilot

Policy Pilot is a Responsible AI policy assistant for reviewing governance documents. Users can upload a policy PDF, ask cited questions, generate a concise Responsible AI checklist, and produce a detailed gap analysis report.

## Frontend

This is the Next.js frontend for Policy Pilot. It connects to the Python FastAPI backend that handles document extraction, embeddings, vector retrieval, and model-generated responses.

## Features

- PDF upload and indexing status
- Cited policy assistant chat
- Responsible AI coverage checklist
- Detailed gap analysis report
- Source passage display
- Activity notifications
- PDF export for checklist reports

## Setup

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```bash
cp .env.local.example .env.local
```

Start the frontend:

```bash
pnpm dev
```

The backend should be running at:

```bash
http://localhost:8000
```

Configure a different backend URL with:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```
