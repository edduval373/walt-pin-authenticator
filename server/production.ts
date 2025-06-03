import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Increase JSON body size limit to handle larger image payloads (100MB)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: false, limit: '100mb' }));

// Simple logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  res.on("finish", () => {
    const responseTime = Date.now() - start;
    const time = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit", 
      second: "2-digit",
      hour12: true,
    });
    console.log(`${time} [express] ${req.method} ${path} ${res.statusCode} ${responseTime}ms`);
  });
  
  next();
});

// Serve static files from dist/public
const publicPath = path.resolve(__dirname, '../dist/public');
app.use(express.static(publicPath));

// Register API routes
registerRoutes(app).then((server) => {
  // Serve index.html for all non-API routes (SPA fallback)
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, '0.0.0.0', () => {
    console.log(`${new Date().toLocaleTimeString()} [express] serving on port ${port}`);
  });
}).catch(console.error);

// Error handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error(`Error ${status}: ${message}`);
  res.status(status).json({ message });
});