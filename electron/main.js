const { app, BrowserWindow, Menu, shell, dialog } = require("electron");
const path = require("path");
const { spawn, execFile } = require("child_process");
const http = require("http");
const fs = require("fs");

let mainWindow = null;
let nextProcess = null;
const PORT = 3456;

// Check if server is ready
function waitForServer(maxRetries = 60) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const checkServer = () => {
      const req = http.get(`http://127.0.0.1:${PORT}`, (res) => {
        resolve();
      });
      req.on("error", () => {
        retries++;
        if (retries >= maxRetries) {
          reject(new Error("Server failed to start"));
        } else {
          setTimeout(checkServer, 1000);
        }
      });
      req.setTimeout(2000, () => {
        req.destroy();
        retries++;
        if (retries >= maxRetries) {
          reject(new Error("Server failed to start"));
        } else {
          setTimeout(checkServer, 1000);
        }
      });
    };
    checkServer();
  });
}

// Find Node.js executable
function findNodeExecutable() {
  const isPackaged = app.isPackaged;
  
  if (isPackaged) {
    // Look for bundled node.exe in resources/app/
    const resourcesPath = process.resourcesPath;
    const possiblePaths = [
      path.join(resourcesPath, "app", "node.exe"),
      path.join(resourcesPath, "node.exe"),
    ];
    
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        console.log("Found bundled Node.js:", p);
        return p;
      }
    }
    console.log("Bundled Node.js not found, using system node");
  }
  
  // Fallback: use system node
  return "node";
}

// Start Next.js server
function startNextServer() {
  return new Promise((resolve, reject) => {
    const isPackaged = app.isPackaged;
    
    let serverPath, cwd, env, nodeExe;
    
    if (isPackaged) {
      // Production: server is in resources/app/
      serverPath = path.join(process.resourcesPath, "app", "server.js");
      cwd = path.join(process.resourcesPath, "app");
      const dbPath = path.join(app.getPath("userData"), "gas-station.db");
      
      // Copy database if not exists
      if (!fs.existsSync(dbPath)) {
        const sourceDb = path.join(process.resourcesPath, "app", "db", "custom.db");
        if (fs.existsSync(sourceDb)) {
          try {
            fs.mkdirSync(path.dirname(dbPath), { recursive: true });
            fs.copyFileSync(sourceDb, dbPath);
            console.log("Database copied to:", dbPath);
          } catch (e) {
            console.error("Failed to copy database:", e);
          }
        }
      }
      
      env = {
        ...process.env,
        NODE_ENV: "production",
        PORT: String(PORT),
        DATABASE_URL: `file:${dbPath}`,
        NEXTAUTH_URL: `http://127.0.0.1:${PORT}`,
        HOSTNAME: "127.0.0.1",
        // Use Prisma WASM engine (cross-platform, no native binary needed)
        PRISMA_CLIENT_ENGINE_TYPE: "library",
        PRISMA_ENGINES_MIRROR: "",
      };
      
      nodeExe = findNodeExecutable();
    } else {
      // Development
      serverPath = path.join(__dirname, "..", ".next", "standalone", "server.js");
      cwd = path.join(__dirname, "..", ".next", "standalone");
      env = {
        ...process.env,
        NODE_ENV: "production",
        PORT: String(PORT),
        HOSTNAME: "127.0.0.1",
      };
      nodeExe = "node";
    }

    console.log(`Node executable: ${nodeExe}`);
    console.log(`Server path: ${serverPath}`);
    console.log(`Working dir: ${cwd}`);
    console.log(`Database: ${env.DATABASE_URL || "default"}`);

    // Kill any existing process on the port
    try {
      if (process.platform === "win32") {
        execFile("taskkill", ["/F", "/FI", `PID eq ${nextProcess?.pid}`], () => {});
      }
    } catch (e) {}

    nextProcess = spawn(nodeExe, [serverPath], {
      env,
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    let output = "";

    nextProcess.stdout.on("data", (data) => {
      const text = data.toString();
      output += text;
      console.log(`[Server] ${text.trim()}`);
    });

    nextProcess.stderr.on("data", (data) => {
      const text = data.toString();
      output += text;
      console.error(`[Server Error] ${text.trim()}`);
    });

    nextProcess.on("error", (err) => {
      console.error("Failed to start server:", err);
      reject(new Error(`${err.message}\n\nServer output:\n${output}`));
    });

    nextProcess.on("exit", (code) => {
      console.log(`Server exited with code ${code}`);
      if (code !== 0 && code !== null) {
        reject(new Error(`Server exited with code ${code}\n\nOutput:\n${output}`));
      }
    });

    // Wait for server to be ready
    waitForServer()
      .then(() => {
        console.log("Server is ready!");
        resolve();
      })
      .catch((err) => {
        reject(new Error(`${err.message}\n\nServer output:\n${output}`));
      });
  });
}

// Create main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "سیستم مدیریت تانک تیل",
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: false,
    },
    show: false,
    backgroundColor: "#f8faf9",
    autoHideMenuBar: true,
  });

  const url = `http://127.0.0.1:${PORT}`;
  console.log(`Loading URL: ${url}`);
  
  mainWindow.loadURL(url);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
    // Maximize window
    mainWindow.maximize();
  });

  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("Failed to load:", errorCode, errorDescription);
    // Retry after delay
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL(url);
      }
    }, 3000);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.startsWith("http://127.0.0.1") || targetUrl.startsWith("http://localhost")) {
      return { action: "allow" };
    }
    shell.openExternal(targetUrl);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  Menu.setApplicationMenu(null);
}

// App event handlers
app.whenReady().then(async () => {
  try {
    await startNextServer();
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    dialog.showErrorBox(
      "Startup Error / خطا در شروع برنامه",
      `Failed to start the application:\n\n${error.message}\n\nPlease contact support.`
    );
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    // Kill server before quitting
    if (nextProcess) {
      try {
        if (process.platform === "win32") {
          spawn("taskkill", ["/pid", nextProcess.pid, "/f", "/t"]);
        } else {
          nextProcess.kill("SIGTERM");
        }
      } catch (e) {}
    }
    app.quit();
  }
});

app.on("before-quit", () => {
  if (nextProcess) {
    try {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", nextProcess.pid, "/f", "/t"]);
      } else {
        nextProcess.kill("SIGKILL");
      }
    } catch (e) {}
    nextProcess = null;
  }
});

process.on("exit", () => {
  if (nextProcess) {
    try { nextProcess.kill("SIGKILL"); } catch (e) {}
  }
});

process.on("SIGINT", () => app.quit());
process.on("SIGTERM", () => app.quit());
