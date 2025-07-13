import { ViteDevServer } from "vite";
import express, { Request, Response } from "express";
import { Server } from "http";

let vite: ViteDevServer;

const isDev = process.env.NODE_ENV === "development";

export async function setupVite(app: express.Application, server: Server) {
  if (isDev) {
    const { createServer } = await import("vite");
    vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: { server },
        allowedHosts: ['localhost', '127.0.0.1'],
      },
      appType: "spa",
      root: "client",
      base: "/",
    });
    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);
  } else {
    const compression = (await import("compression")).default;
    const sirv = (await import("sirv")).default;
    app.use(compression());
    app.use(sirv("client/dist", { extensions: ["html"] }));
  }
}

export function log(message: string, source: string = "express") {
  const now = new Date();
  const timestamp = now.toLocaleTimeString("en-US", { hour12: false });
  console.log(`${timestamp} [${source}] ${message}`);
}

export function serveStatic(path: string) {
  return express.static(path);
}