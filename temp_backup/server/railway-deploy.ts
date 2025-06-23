import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting Railway deployment server...');

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
    console.log(`${time} [railway] ${req.method} ${path} ${res.statusCode} ${responseTime}ms`);
  });
  
  next();
});

// Serve a simple static HTML file for the frontend
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Disney Pin Checker</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { color: #1e40af; }
        p { margin: 20px 0; }
        .status { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Disney Pin Checker</h1>
        <p>The mobile application API is running successfully!</p>
        <div class="status">
          <h3>API Status: Active</h3>
          <p>Ready to authenticate Disney pins</p>
          <p>Connected to: https://master.pinauth.com</p>
        </div>
        <p>This service provides pin authentication for the mobile app.</p>
      </div>
    </body>
    </html>
  `);
});

// Register API routes
registerRoutes(app).then((server) => {
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, '0.0.0.0', () => {
    console.log(`${new Date().toLocaleTimeString()} [railway] Disney Pin Checker API serving on port ${port}`);
    console.log(`Connected to PIM service at: https://master.pinauth.com`);
  });
}).catch(console.error);

// Error handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error(`[railway] Error ${status}: ${message}`);
  res.status(status).json({ message });
});