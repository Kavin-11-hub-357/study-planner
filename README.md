# Studyflow

A responsive, client-side study planner built with React, Vite, Tailwind CSS, and Recharts.

## Features

- Dashboard with study activity, subject progress, upcoming exams, and today's tasks
- Subject, task, study-session, and exam management
- Day and week timetable views
- Focus and break timer
- Dark and light themes
- Browser LocalStorage persistence; no backend, API keys, or account required

## Getting started

```bash
npm install
npm run dev
```

Create a production build with `npm run build`, then preview it with `npm run preview`.

## Deploying

Import the repository into Vercel or run `vercel` from the project directory. The included `vercel.json` rewrite supports direct navigation to client-side routes.

All planner data is stored in the current browser on the current device. Clearing browser storage removes that data.
