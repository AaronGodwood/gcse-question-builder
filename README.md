# Markr -- This project has been migrated onto my personal site and all further changes are now made there -- 16/04/2026

A purpose-built web app for creating, storing, and exporting AQA-style GCSE Mathematics questions and worksheets.

## Overview

Markr provides a canvas-based question builder, a searchable question database, and a worksheet generator that exports AQA-styled PDFs. Designed for maths tutors and teachers who want to build high-quality, exam-ready resources without manual layout work.

## Features

### Question Builder

- Canvas editor with zoom, pan, grid, marquee select, and full undo/redo
- Object palette with 30+ diagram types across 7 categories
- Per-object property panel with live editing
- Keyboard shortcuts: `Ctrl+Z/Y` undo/redo, `Ctrl+D` duplicate, `Del` delete, `Ctrl+S` save

### Diagram Objects

| Category | Types |
| --- | --- |
| Triangles | Right, isosceles, equilateral, scalene |
| Quadrilaterals | Rectangle, square, parallelogram, trapezium, rhombus |
| Circles | Circle, semicircle, sector, circle theorem diagram |
| Compound | L-shape, T-shape, step |
| 3D Shapes | Cuboid, cone, frustum, cylinder, triangular prism |
| Charts | Bar chart, histogram, pie chart, probability tree, bearing |
| Other | Coordinate graph, text, mark box, table, number line, Venn diagram |

### Question Database

- Save questions with metadata: title, topic, subtopic, marks, grade, calculator type, paper, tags
- Filter and search across all saved questions
- Grid and list views, bulk select, export (JSON), and delete
- One-click open in builder from any question card

### Worksheet Generator

- Add questions from the database, drag to reorder
- Per-question settings: answer lines, answer space
- Worksheet settings: title, date, class, total marks
- Exports AQA-styled PDF with header, question numbers, mark allocations, answer lines, and page numbers

### PDF Export

- Tight-cropped canvas diagrams rendered as PNG and embedded in the PDF
- NotoSans font for full Unicode superscript support (`x²`, `f⁻¹`)
- "Diagram NOT accurately drawn" note applied automatically where set

## Tech Stack

| | |
| --- | --- |
| Framework | React 19 + TypeScript, Vite |
| Canvas | react-konva (Konva.js) |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Database | Supabase (PostgreSQL + Row Level Security) |
| PDF | jsPDF |
| Maths | math.js, KaTeX |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

```bash
npm install
```

Create `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Apply the database migrations via the Supabase SQL editor, then:

```bash
npm run dev
```

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## Project Structure

```text
src/
  components/
    builder/        # Canvas, toolbar, palette, property panel, object renderers
    database/       # Question browser, filter panel, cards
    worksheet/      # Worksheet builder UI
  hooks/            # useQuestion, useQuestions, useWorksheet, useTopics, useAuth
  lib/              # pdfExport, defaultObjects, shapeGeometry, equations
  pages/            # BuilderPage, QuestionsPage, WorksheetsPage, AuthPage
  stores/           # canvasStore, questionStore, worksheetStore
  types/            # canvas.ts, question.ts
```
