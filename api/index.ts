import app from "../server/src/index.js";
// Vercel diagnostic route
app.get('/api/vercel-check', (req, res) => {
  res.json({ 
    message: 'Vercel API function is working!',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});
export default app;
