# Music Collab

A collaborative music creation platform built with Next.js and Supabase. It allows users to work on projects together, share audio files, and use a real-time whiteboard for brainstorming.

## Features

*   **User Authentication:** Secure user sign-up and login (email/password and OAuth) powered by Supabase Auth.
*   **Project Management:** Create, manage, and switch between different collaboration projects.
*   **Real-time Collaborative Whiteboard:** A shared digital whiteboard using Tldraw for real-time brainstorming and visual planning. Snapshots are automatically saved to the database.
*   **Audio Handling:** Upload, play, and visualize audio waveforms with Wavesurfer.js.
*   **State Management:** Centralized and predictable state management using Zustand.

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/)
*   **Backend & Database:** [Supabase](https://supabase.io/) (PostgreSQL, Auth, Storage)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Languages:** [TypeScript](https://www.typescriptlang.org/)
*   **Whiteboard:** [Tldraw](https://tldraw.dev/)
*   **Audio Visualization:** [Wavesurfer.js](https://wavesurfer-js.org/)
*   **State Management:** [Zustand](https://github.com/pmndrs/zustand)
*   **Auth UI:** [Supabase Auth UI](https://supabase.com/docs/guides/auth/auth-helpers/nextjs-ui)

## Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   [Node.js](https://nodejs.org/en/) (v20 or later)
*   [npm](https://www.npmjs.com/get-npm), [yarn](https://classic.yarnpkg.com/en/docs/install), or [pnpm](https://pnpm.io/installation)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/music-collab.git
    cd music-collab
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

### Environment Variables

This project uses Supabase for its backend. You will need to create a Supabase project and obtain the necessary API keys.

1.  Go to [Supabase](https://supabase.io/) and create a new project.
2.  Navigate to your project's **Settings** > **API**.
3.  Find your **Project URL** and **anon public** key.
4.  Create a `.env.local` file in the root of your project.
5.  Add the following environment variables to your `.env.local` file:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```

    **Note:** The `NEXT_PUBLIC_` prefix is required for these variables to be exposed to the browser in a Next.js application.

## Running the Development Server

Once you have set up your environment variables, you can start the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Linting

This project uses ESLint for code quality and consistency. To run the linter, use the following command:

```bash
npm run lint
# or
yarn lint
```

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.