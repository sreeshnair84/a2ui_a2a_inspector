# A2UI Enterprise Chat

A modern, agentic chat interface built with React, Vite, and A2UI.

## Features

-   **Rich Agentic UI**: Renders dynamic UI components (Cards, Streaming Text) from A2A agents.
-   **Session Management**: Create, rename, and delete chat sessions.
-   **Modern Aesthetics**: Glassmorphism, smooth animations, and a polished design system.
-   **File Upload**: Drag-and-drop file support.
-   **Responsive Design**: Mobile-friendly sidebar and layout.

## Tech Stack

-   **Frontend**: React, Vite, TypeScript
-   **Styling**: TailwindCSS, CSS Modules (for specific animations)
-   **Icons**: Lucide React
-   **State Management**: React Hooks (Custom `useChat` and `useSessions`)
-   **Protocol**: A2UI (Agent-to-UI) Protocol

## Getting Started

### Prerequisites

-   Node.js (v18+)
-   Running A2A Backend (usually on `http://localhost:8001`)

### Installation

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

-   `src/components/`: UI Components (`Sidebar`, `ChatInput`, `MessageBubble`, etc.)
-   `src/hooks/`: Custom hooks for logic (`useChat`, `useSessions`)
-   `src/pages/`: Main application pages
-   `src/services/`: API clients
