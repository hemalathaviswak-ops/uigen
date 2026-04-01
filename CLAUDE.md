# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run start        # Run production server
npm run lint         # Run ESLint

# Testing
npm run test         # Run all Vitest tests
npx vitest run src/path/to/file.test.tsx  # Run a single test file
npx vitest --watch   # Watch mode

# Database
npm run setup        # Install deps + generate Prisma client + run migrations
npm run db:reset     # Reset database (destructive)
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma migrate dev  # Apply pending migrations
```

## Architecture Overview

UIGen is an AI-powered React component generator. Users describe components in natural language; Claude generates code via tool calls; results are rendered in a live iframe preview.

### Request Flow

```
User prompt → /api/chat/route.ts (streaming)
    → Claude with system prompt (src/lib/prompts/generation.tsx)
    → Tool calls: str_replace_editor, file_manager (src/lib/tools/)
    → VirtualFileSystem updates (src/lib/file-system.ts)
    → FileSystemContext broadcasts (src/lib/contexts/file-system-context.tsx)
    → PreviewFrame recompiles with Babel (src/components/preview/PreviewFrame.tsx)
    → iframe renders the component
    → Authenticated users: files + messages serialized to SQLite via Prisma
```

### Key Modules

- **`src/lib/file-system.ts`** — `VirtualFileSystem` class: in-memory FS with full CRUD, serializes to/from JSON for database persistence. The central data structure for all generated code.
- **`src/lib/contexts/`** — Two React contexts: `ChatContext` (wraps Vercel AI SDK's `useChat`) and `FileSystemContext` (VirtualFileSystem state). Most components consume these instead of receiving props.
- **`src/lib/tools/`** — Claude tool definitions (`str_replace_editor`, `file_manager`) that the AI uses to write/modify files in the VirtualFileSystem.
- **`src/lib/provider.ts`** — Abstracts the language model; falls back to `MockLanguageModel` when `ANTHROPIC_API_KEY` is absent (returns pre-built component templates).
- **`src/lib/transform/jsx-transformer.ts`** — Client-side JSX compilation via `@babel/standalone`; runs in the browser to transform generated code before iframe rendering.
- **`src/actions/`** — Server Actions for auth (`signUp`, `signIn`, `signOut`) and project CRUD. Auth uses JWT (jose) + bcrypt with HTTP-only cookies.
- **`src/middleware.ts`** — Protects routes, redirects unauthenticated users.

### State Management

- Global state lives in Context providers (`ChatProvider`, `FileSystemProvider`) wrapping the app
- No Redux or Zustand — React Context + Vercel AI SDK's `useChat` hook handles everything
- Anonymous users get full functionality without persistence; authenticated users get project saved to SQLite

### Database

Prisma ORM with SQLite. Two models: `User` (bcrypt-hashed password) and `Project` (stores chat messages as JSON string + serialized VirtualFileSystem as JSON string). Schema at `prisma/schema.prisma`.

### UI

shadcn/ui components (New York style, auto-generated into `src/components/ui/`). Tailwind CSS v4. Do not manually edit files in `src/components/ui/` — regenerate via shadcn CLI.

## Environment

Requires `ANTHROPIC_API_KEY` in `.env`. Without it, the app uses `MockLanguageModel` for demo purposes.

## Testing

Tests use Vitest + React Testing Library with jsdom. Test files live in `__tests__/` subdirectories next to the code they test (e.g., `src/components/chat/__tests__/`). Config in `vitest.config.mts`.
