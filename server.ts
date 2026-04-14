import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { spawn } from "child_process";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  const PORT = 3000;

  // Gerenciamento do Processo Python
  let scanProcess: any = null;

  io.on("connection", (socket) => {
    console.log("Cliente conectado:", socket.id);

    socket.on("start-scan", (network) => {
      if (scanProcess) {
        socket.emit("status", { msg: "Um scan já está em andamento" });
        return;
      }

      console.log("Iniciando scan para:", network);
      scanProcess = spawn("python3", ["scanner_core.py", network]);

      scanProcess.stdout.on("data", (data: Buffer) => {
        const lines = data.toString().split("\n");
        lines.forEach(line => {
          if (!line.trim()) return;
          try {
            const json = JSON.parse(line);
            io.emit(json.type, json.data || json);
          } catch (e) {
            console.log("Log Python:", line);
            io.emit("log", line);
          }
        });
      });

      scanProcess.on("close", () => {
        scanProcess = null;
        io.emit("status", { msg: "Processo finalizado" });
      });
    });

    socket.on("stop-scan", () => {
      if (scanProcess) {
        scanProcess.kill();
        scanProcess = null;
        io.emit("status", { msg: "Scan interrompido pelo usuário" });
      }
    });
  });

  // Integração com Vite
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
