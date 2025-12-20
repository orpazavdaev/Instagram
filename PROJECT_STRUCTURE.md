# Instagram Clone - Next.js Project (Pages Router)

## 📱 תיאור הפרויקט

פרויקט זה הוא שכפול עיצובי של אפליקציית אינסטגרם, בנוי ב-Next.js 14 עם **Pages Router**.
הפרויקט מותאם למובייל ומתמקד בעיצוב לפי Figma.

## 🎨 טכנולוגיות

- **Next.js 14** - Pages Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 📁 מבנה הקבצים

```
instagram/
├── src/
│   ├── pages/
│   │   ├── _app.tsx            # App wrapper
│   │   ├── _document.tsx       # Document wrapper
│   │   ├── index.tsx           # דף הבית
│   │   ├── profile.tsx         # דף פרופיל
│   │   ├── comments.tsx        # דף תגובות
│   │   ├── settings.tsx        # הגדרות
│   │   ├── story.tsx           # צפייה בסטורי
│   │   ├── reels.tsx           # רילס / חיפוש
│   │   ├── create.tsx          # יצירת פוסט
│   │   └── api/                # API Routes
│   │       ├── index.ts        # Main API endpoint
│   │       ├── users/
│   │       │   └── index.ts    # Users API
│   │       └── posts/
│   │           └── index.ts    # Posts API
│   ├── components/
│   │   ├── layout/
│   │   │   └── BottomNav.tsx   # ניווט תחתון
│   │   ├── profile/
│   │   │   ├── StoryHighlight.tsx
│   │   │   └── PostsGrid.tsx
│   │   └── shared/
│   │       ├── Avatar.tsx
│   │       └── Button.tsx
│   └── styles/
│       └── globals.css         # סגנונות גלובליים
├── public/
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

## 📄 דפים

### 1. פרופיל - `/profile`
- תמונת פרופיל עם סטטיסטיקות
- ביוגרפיה
- היילייטס של סטוריז
- כפתורי Edit Profile ו-Share Profile
- טאבים: Grid / Reels / Tagged
- גריד תמונות 3x3

### 2. תגובות - `/comments`
- כרטיס פוסט עם הזכרות
- רשימת תגובות עם אווטארים
- לייקים ותשובות

### 3. הגדרות - `/settings`
- Meta Accounts Center
- How to use Instagram
- Who can see your content

### 4. סטורי - `/story`
- תצוגת סטורי מלא מסך
- פס התקדמות
- פרטי מוזיקה

### 5. רילס - `/reels`
- שורת חיפוש
- גריד תמונות 3x3

### 6. יצירת פוסט - `/create`
- תצוגת תמונה נבחרת
- גלריה
- טאבים: POST / STORY / REEL

## 📡 API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api` | מידע על ה-API |
| GET | `/api/users` | רשימת משתמשים |
| POST | `/api/users` | יצירת משתמש |
| GET | `/api/posts` | רשימת פוסטים |
| POST | `/api/posts` | יצירת פוסט |

## 🚀 התקנה והרצה

```bash
npm install
npm run dev
```
