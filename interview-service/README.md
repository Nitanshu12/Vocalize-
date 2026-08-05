# interview-service

The Python (FastAPI + LangGraph) brain for Vocalize **Interview Mode**. It holds
the interview-type configs and (from a later step) the agentic interview engine.
The Node backend is the gateway — the browser never calls this service directly.

## Why Python
This is the AI/agent part of the stack. LangGraph's Python ecosystem is the most
mature, so the interview agent, scoring, and configs live here.

## Setup (uses Python 3.12 — stable for LangGraph)

```bash
cd interview-service
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
# from interview-service/, with the venv active
uvicorn app.main:app --reload --port 8000
```

Then:
- http://localhost:8000/health
- http://localhost:8000/interview/types
- http://localhost:8000/docs  (auto-generated API docs)

## Inspect the config without the server

```bash
python3 app/interview_types.py
```

## Layout
```
app/
  interview_types.py   # config registry (the design pattern) — add a type = add an entry
  main.py              # FastAPI routes
```
