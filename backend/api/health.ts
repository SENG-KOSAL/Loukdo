import type { IncomingMessage, ServerResponse } from "node:http"
import prisma from "../src/services/prisma"

// Health check for the backend deployment.
// GET /api/health (or /health) -> confirms the function runs and the database is reachable.
export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json")

  try {
    await prisma.$queryRaw`SELECT 1`
    res.statusCode = 200
    res.end(JSON.stringify({ status: "ok", database: "connected" }))
  } catch (error) {
    res.statusCode = 500
    res.end(
      JSON.stringify({
        status: "error",
        database: "unreachable",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    )
  }
}
