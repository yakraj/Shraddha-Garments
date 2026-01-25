# Full-Stack TypeScript Project on Vercel

This guide explains how to deploy a full-stack TypeScript project with client (React/Vite), server (Express), and Prisma database to Vercel.

## Project Structure

```
project-root/
├── package.json              # Root package.json for managing both apps
├── vercel.json               # Vercel deployment configuration
├── api/
│   └── index.ts             # Vercel serverless function entry point
├── client/                  # Frontend React/Vite app
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
├── server/                  # Backend Express app
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       └── index.ts         # Express app entry point
```

## Key Configuration Files

### 1. Root `package.json`

```json
{
  "name": "your-project-name",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "concurrently \"npm run dev --prefix client\" \"npm run dev --prefix server\"",
    "vercel-build": "npm --prefix client run build && npm --prefix server run build"
  },
  "devDependencies": {
    "concurrently": "^8.0.0"
  }
}
```

### 2. `vercel.json` Configuration

```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    },
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.ts" },
    {
      "src": "/(.*\\.(ico|js|css|png|jpg|jpeg|svg|webp|ttf|woff2?))$",
      "dest": "/client/$1"
    },
    { "src": "/(.*)", "dest": "/client/index.html" }
  ]
}
```

### 3. `api/index.ts` - Serverless Function Entry Point

```typescript
// Use dynamic import to handle ESM/CJS interop for Vercel
export default async function handler(req: any, res: any) {
  const app = (await import("../server/src/index.js")).default;
  return app(req, res);
}
```

### 4. Server `package.json`

```json
{
  "name": "your-server",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "npx prisma generate",
    "vercel-build": "npx prisma generate",
    "postinstall": "npx prisma generate"
  },
  "dependencies": {
    "@prisma/client": "5.10.0",
    "express": "^4.18.2",
    "tsx": "^4.7.1",
    "prisma": "5.10.0"
  }
}
```

### 5. Server Express App (`server/src/index.ts`)

```typescript
import express from "express";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(express.json());

// Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server only when not running on Vercel
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;
```

## Deployment Process

### 1. Environment Variables Setup

In Vercel Dashboard → Project → Settings → Environment Variables, add:

```
DATABASE_URL=postgresql://username:password@host:port/database?schema=schema_name
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
```

### 2. Prisma Configuration

- Ensure `prisma/schema.prisma` uses environment variable for database URL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

- Move `tsx` to production dependencies in server package.json for Vercel to run TypeScript

### 3. Build Process

1. **Client Build**: Vite builds static files to `client/dist/`
2. **Server Build**: Prisma generates client during build
3. **API Deployment**: Vercel deploys server as serverless function via `api/index.ts`

### 4. Routing

- `/api/*` → Routes to Express server (serverless function)
- Static files → Served from client build
- All other routes → Client `index.html` (SPA routing)

## Common Issues & Solutions

### 1. ESM Module Errors

**Problem**: `require() of ES Module not supported`
**Solution**: Use dynamic imports in `api/index.ts` and ensure `"type": "module"` in package.json

### 2. Prisma Client Not Found

**Problem**: Database queries fail on Vercel
**Solution**:

- Add environment variables in Vercel Dashboard
- Ensure `npx prisma generate` runs in build scripts
- Move `tsx` to production dependencies

### 3. Camera/Media Access Issues

**Problem**: Camera permission errors on deployed site
**Solution**: Implement proper error handling with retry logic for `NotReadableError`

### 4. Mobile Navigation UX

**Problem**: Sidebar doesn't close on mobile after navigation
**Solution**: Add onClick handlers to close sidebar when nav items are clicked

## Local Development

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install

# Set up environment variables
cp server/.env.example server/.env
# Edit server/.env with your database credentials

# Run database migrations
cd server && npx prisma migrate dev

# Seed database (optional)
cd server && npx prisma db seed

# Start both client and server
cd .. && npm run start
```

## Database Seeding

```bash
cd server
npx tsx prisma/seed.ts
```

## Production Deployment

1. **Push to Git**: Commit all changes to your repository
2. **Connect to Vercel**: Link your GitHub repo in Vercel Dashboard
3. **Add Environment Variables**: Set DATABASE_URL, JWT_SECRET, etc.
4. **Deploy**: Vercel automatically builds and deploys
5. **Test**: Visit `/api/health` to verify server is running

## Tips for Future Projects

1. **Always use ES modules** (`"type": "module"`) for consistency
2. **Keep TypeScript runtime dependencies** (tsx) in production deps for Vercel
3. **Use dynamic imports** in Vercel API routes for Express apps
4. **Set up environment variables** before first deployment
5. **Test API routes** with `/api/health` endpoint
6. **Use proper error handling** for browser APIs (camera, geolocation)
7. **Implement mobile-friendly navigation** with auto-close functionality

## Project Benefits

- ✅ **Single Repository**: Client and server in one repo
- ✅ **TypeScript Throughout**: Full type safety
- ✅ **Serverless Backend**: Express runs as Vercel functions
- ✅ **Database Integration**: Prisma works seamlessly with Vercel
- ✅ **Static Frontend**: Optimized client builds
- ✅ **Environment Management**: Separate dev/prod configs
- ✅ **Easy Local Development**: Single command starts everything
