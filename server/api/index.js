/**
 * Vercel serverless entry point.
 *
 * Vercel invokes this file as a Node.js function for every request that
 * vercel.json rewrites to /api/index. An Express app is already a valid
 * (req, res) handler, so we just re-export the one defined in server.js.
 * server.js skips app.listen() when VERCEL is set, so importing it here is safe.
 */
import app from "../server.js";

export default app;
