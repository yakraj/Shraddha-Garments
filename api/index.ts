import app from "../server/src/index";

// Vercel serverless function handler
export default async function handler(req, res) {
  // We can add any pre-processing here similar to ujiyala-foundation
  // For Prisma, we don't necessarily need an ensureDB like Mongoose
  // but we can log for diagnostics
  if (req.url === "/api/vercel-check") {
    return res.json({
      message: "Vercel API function is working!",
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  }

  // Pass it to the express app
  return app(req, res);
}
