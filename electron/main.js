const { app, BrowserWindow, Menu, shell, dialog } = require("electron");
const path = require("path");
const { spawn, exec } = require("child_process");
const http = require("http");

let mainWindow = null;
let nextProcess = null;
const PORT = 3456; // Use non-standard port to avoid conflicts

// Check if server is ready
function waitForServer(maxRetries = 30) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const checkServer = () => {
      const req = http.get(`http://127.0.0.1:${PORT}`, (res) => {
        if (res.statusCode === 200 || res.statusCode === 307) {
          resolve();
        } else {
          retry();
        }
      });
      req.on("error", () => retry());
      req.setTimeout(2000, () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      retries++;
      if (retries >= maxRetries) {
        reject(new Error("Server failed to start within timeout"));
      } else {
        setTimeout(checkServer, 1000);
      }
    };
    checkServer();
  });
}

// Start Next.js standalone server
function startNextServer() {
  return new Promise((resolve, reject) => {
    // In production (packaged app), start the bundled server
    const isPackaged = app.isPackaged;
    
    let serverPath, env, cwd;
    
    if (isPackaged) {
      // Production: server is in resources/app/server/
      serverPath = path.join(process.resourcesPath, "app", "server.js");
      cwd = path.join(process.resourcesPath, "app");
      const dbPath = path.join(app.getPath("userData"), "gas-station.db");
      env = {
        ...process.env,
        NODE_ENV: "production",
        PORT: String(PORT),
        DATABASE_URL: `file:${dbPath}`,
        NEXTAUTH_URL: `http://127.0.0.1:${PORT}`,
      };
    } else {
      // Development: server is in .next/standalone/
      serverPath = path.join(__dirname, "..", ".next", "standalone", "server.js");
      cwd = path.join(__dirname, "..", ".next", "standalone");
      env = {
        ...process.env,
        NODE_ENV: "production",
        PORT: String(PORT),
      };
    }

    console.log(`Starting server: ${serverPath}`);
    console.log(`Working dir: ${cwd}`);

    // Use the electron's node to run the server
    nextProcess = spawn(process.execPath, [serverPath], {
      env,
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });

    nextProcess.stdout.on("data", (data) => {
      const output = data.toString();
      console.log(`[Server] ${output.trim()}`);
    });

    nextProcess.stderr.on("data", (data) => {
      console.error(`[Server Error] ${data.toString().trim()}`);
    });

    nextProcess.on("error", (err) => {
      console.error("Failed to start server:", err);
      reject(err);
    });

    nextProcess.on("exit", (code) => {
      console.log(`Server exited with code ${code}`);
    });

    // Wait for server to be ready
    waitForServer()
      .then(() => {
        console.log("Server is ready!");
        resolve();
      })
      .catch(reject);
  });
}

// Copy database to user data folder on first run
function setupDatabase() {
  const userDataPath = app.getPath("userData");
  const dbPath = path.join(userDataPath, "gas-station.db");
  
  if (!require("fs").existsSync(dbPath)) {
    // Try to copy from resources
    const isPackaged = app.isPackaged;
    let sourceDbPath;
    
    if (isPackaged) {
      sourceDbPath = path.join(process.resourcesPath, "app", "db", "custom.db");
    } else {
      sourceDbPath = path.join(__dirname, "..", "db", "custom.db");
    }
    
    if (require("fs").existsSync(sourceDbPath)) {
      try {
        // Create directory if needed
        require("fs").mkdirSync(userDataPath, { recursive: true });
        require("fs").copyFileSync(sourceDbPath, dbPath);
        console.log("Database copied to:", dbPath);
      } catch (e) {
        console.error("Failed to copy database:", e);
      }
    }
  }
  
  return dbPath;
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
    frame: true,
    titleBarStyle: "default",
  });

  // Load the app - NO BROWSER NEEDED, Electron IS the browser
  const url = `http://127.0.0.1:${PORT}`;
  console.log(`Loading URL: ${url}`);
  
  mainWindow.loadURL(url);

  // Show window when ready (prevents white flash)
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Handle loading errors
  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("Failed to load:", errorCode, errorDescription);
    setTimeout(() => {
      mainWindow.loadURL(url);
    }, 2000);
  });

  // Handle external links - open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.startsWith("http://127.0.0.1") || targetUrl.startsWith("http://localhost")) {
      return { action: "allow" };
    }
    shell.openExternal(targetUrl);
    return { action: "deny" };
  });

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Remove menu bar completely
  Menu.setApplicationMenu(null);
}

// App event handlers
app.whenReady().then(async () => {
  try {
    // Setup database
    setupDatabase();
    
    // Start the internal server
    await startNextServer();
    
    // Create the window
    createWindow();

    // On macOS, re-create window when dock icon is clicked
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    dialog.showErrorBox(
      "خطا در شروع برنامه / Startup Error",
      `Failed to start the application:\n\n${error.message}\n\nPlease ensure Node.js is installed and try again.`
    );
    app.quit();
  }
});

// Quit when all windows are closed (except on macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Clean up server on quit
app.on("before-quit", () => {
  if (nextProcess) {
    try {
      // Kill the process tree
      if (process.platform === "win32") {
        exec(`taskkill /pid ${nextProcess.pid} /f /t`);
      } else {
        nextProcess.kill("SIGTERM");
      }
    } catch (e) {
      console.error("Error killing server:", e);
    }
    nextProcess = null;
  }
});

// Handle process exit
process.on("exit", () => {
  if (nextProcess) {
    try {
      nextProcess.kill("SIGKILL");
    } catch (e) {}
  }
});

process.on("SIGINT", () => {
  app.quit();
});

process.on("SIGTERM", () => {
  app.quit();
});
