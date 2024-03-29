import { app, BrowserWindow, shell, ipcMain } from "electron"
import { release } from "os"
import { join } from "path"

// Disable GPU Acceleration for Windows 7
if (release().startsWith("6.1")) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
	app.quit()
	process.exit(0)
}

// Remove electron security warnings in development mode (these only show up in development mode) (see: https://www.electronjs.org/docs/latest/tutorial/security)
if (!app.isPackaged) process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true"

export const ROOT_PATH = {
	// /dist
	dist: join(__dirname, "../.."),
	// /dist or /public
	public: join(__dirname, app.isPackaged ? "../.." : "../../../public"),
}

let window: BrowserWindow | null = null
// 🚧 Use ["ENV_NAME"] avoid vite:define plugin
const url = `http://${process.env["VITE_DEV_SERVER_HOST"]}:${process.env["VITE_DEV_SERVER_PORT"]}`
const indexHtml = join(ROOT_PATH.dist, "index.html")

async function createWindow() {
	window = new BrowserWindow({
		title: "Main window",
		icon: join(ROOT_PATH.public, "favicon.ico"),
		fullscreen: true, // start in fullscreen
		webPreferences: {
			preload: join(__dirname, "../preload/index.js"),
		},
	})
	
	if (app.isPackaged) {
		window.loadFile(indexHtml)
	} else {
		window.loadURL(url)
		// Open devTool if the app is not packaged
		window.webContents.openDevTools()
	}
	
	// Test actively push message to the Electron-Renderer
	window.webContents.on("did-finish-load", () => {
		window?.webContents.send("main-process-message", new Date().toLocaleString())
	})
	
	// Make all links open with the browser, not with the application
	window.webContents.setWindowOpenHandler(({ url }) => {
		if (url.startsWith("https:")) shell.openExternal(url)
		return { action: "deny" }
	})
}

app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
	window = null
	if (process.platform !== "darwin") app.quit()
})

app.on("second-instance", () => {
	if (window) {
		// Focus on the main window if the user tried to open another
		if (window.isMinimized()) window.restore()
		window.focus()
	}
})

app.on("activate", () => {
	const allWindows = BrowserWindow.getAllWindows()
	if (allWindows.length) {
		allWindows[0].focus()
	} else {
		createWindow()
	}
})

// new window example arg: new windows url
ipcMain.handle("open-window", (event, arg) => {
	const childWindow = new BrowserWindow({
		webPreferences: {
			preload,
		},
	})
	
	if (app.isPackaged) {
		childWindow.loadFile(indexHtml, { hash: arg })
	} else {
		childWindow.loadURL(`${url}/#${arg}`)
		// childWindow.webContents.openDevTools({ mode: "undocked", activate: true })
	}
})
