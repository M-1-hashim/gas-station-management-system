const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow = null;
let nextProcess = null;

const isDev = !app.isPackaged;
const PORT = 3000;

// Start Next.js server
function startNextServer() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      // In dev mode, Next.js is already running
      resolve();
      return;
    }

    // In production, start the standalone Next.js server
    const serverPath = path.join(
      process.resourcesPath,
      "app",
      ".next",
      "standalone",
      "server.js"
    );

    const env = {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(PORT),
      DATABASE_URL: `file:${path.join(
        app.getPath("userData"),
        "gas-station.db"
      )}`,
    };

    nextProcess = spawn(process.execPath, [serverPath], {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    nextProcess.stdout.on("data", (data) => {
      const output = data.toString();
      console.log(`[Next.js] ${output}`);
      if (output.includes("Ready") || output.includes("started")) {
        resolve();
      }
    });

    nextProcess.stderr.on("data", (data) => {
      console.error(`[Next.js Error] ${data.toString()}`);
    });

    nextProcess.on("error", (err) => {
      console.error("Failed to start Next.js server:", err);
      reject(err);
    });

    // Resolve after timeout as fallback
    setTimeout(() => resolve(), 5000);
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
      devTools: isDev,
    },
    show: false,
    backgroundColor: "#f8faf9",
    titleBarStyle: "default",
    autoHideMenuBar: true,
  });

  // Load the app
  const url = isDev ? `http://localhost:${PORT}` : `http://localhost:${PORT}`;
  mainWindow.loadURL(url);

  // Show window when ready (prevents white flash)
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// App event handlers
app.whenReady().then(async () => {
  try {
    await startNextServer();
    createWindow();

    // On macOS, re-create window when dock icon is clicked
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    // Show error dialog
    const { dialog } = require("electron");
    dialog.showErrorBox(
      "Startup Error",
      `Failed to start the application:\n\n${error.message}\n\nPlease contact support.`
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

// Clean up on quit
app.on("before-quit", () => {
  if (nextProcess) {
    nextProcess.kill();
    nextProcess = null;
  }
});

// Handle process exit
process.on("exit", () => {
  if (nextProcess) {
    nextProcess.kill();
  }
});
