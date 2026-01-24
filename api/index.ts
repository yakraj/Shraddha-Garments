// Use dynamic import to handle ESM/CJS interop for Vercel
export default async function handler(req: any, res: any) {
  const app = (await import("../server/src/index.js")).default;
  return app(req, res);
}
