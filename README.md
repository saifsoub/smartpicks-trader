# SmartPicks Trader

AI-powered cryptocurrency trading bot dashboard. Connects to the Binance API to run automated strategies in **Demo**, **Paper**, or **Live** mode with full safety rails.

## PaperclipAI Onboarding

This repository ships a [Paperclip](https://paperclip.ing) company manifest. Import it into any Paperclip instance to spin up the SmartPicks Trader AI company — complete with a Trading Strategist (CEO), Lead Developer (CTO), Market Analyst, Frontend Engineer, and Risk Manager. All agents run on **Gemini 2.5 Pro** via the `gemini_local` adapter.

```bash
# 1. Set up a local Paperclip instance (first time only)
npx paperclipai onboard --yes

# 2. Import the SmartPicks Trader company
npx paperclipai company import --from https://github.com/saifsoub/smartpicks-trader
```

The manifest (`paperclip.manifest.json`) and agent system-prompts (`paperclip/`) are committed to this repository. See [Paperclip docs](https://paperclip.ing/docs) for more.

---

# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/f2fd55cb-f731-4c04-9872-9ca7a65be347

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/f2fd55cb-f731-4c04-9872-9ca7a65be347) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f2fd55cb-f731-4c04-9872-9ca7a65be347) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
