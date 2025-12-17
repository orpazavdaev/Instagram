# 📸 Instagram Clone

A beautiful, mobile-first Instagram clone built with **Next.js 14 Pages Router**, **TypeScript**, and **Tailwind CSS**.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ Features

- 👤 **Profile Page** - User profile with highlights, stats, and posts grid
- 💬 **Comments** - Comment list with likes and replies
- ⚙️ **Settings** - Comprehensive settings with Meta Accounts Center
- 📖 **Stories** - Full-screen story viewer with music info
- 🎬 **Reels** - Explore grid with search
- 📷 **Create Post** - Photo selection with POST/STORY/REEL tabs

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📁 Project Structure

```
src/
├── pages/
│   ├── _app.tsx          # App wrapper
│   ├── _document.tsx     # Document wrapper
│   ├── index.tsx         # Home page
│   ├── profile.tsx       # Profile page
│   ├── comments.tsx      # Comments page
│   ├── settings.tsx      # Settings page
│   ├── story.tsx         # Story viewer
│   ├── reels.tsx         # Reels/Explore
│   ├── create.tsx        # Create post
│   └── api/              # API Routes
│       ├── index.ts
│       ├── users/
│       └── posts/
├── components/
│   ├── layout/           # BottomNav
│   ├── profile/          # StoryHighlight, PostsGrid
│   └── shared/           # Avatar, Button
└── styles/
    └── globals.css
```

## 📡 API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api` | API info |
| GET | `/api/users` | List users |
| POST | `/api/users` | Create user |
| GET | `/api/posts` | List posts |
| POST | `/api/posts` | Create post |

## 📱 Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Navigation menu |
| Profile | `/profile` | User profile with highlights |
| Comments | `/comments` | Post comments |
| Settings | `/settings` | App settings |
| Story | `/story` | Story viewer |
| Reels | `/reels` | Explore grid |
| Create | `/create` | New post creation |

## 📄 License

This project is for educational purposes only. Instagram is a trademark of Meta Platforms, Inc.
