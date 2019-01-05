const electron = require('electron') //eslint-disable-line
const path = require('path')
const { join } = path
const dns = require('dns')
const { format } = require('url')
const { promisify } = require('util')
const dnsLookup = promisify(dns.lookup)
const { app, BrowserWindow, systemPreferences, ipcMain, Tray } = electron

const online = require('is-online')

// logs
const log = require('electron-log')

log.transports.console.level = false
log.transports.file.level = 'debug'

// autoupdater
const { autoUpdater } = require('electron-updater')
const { enforceMacOSAppLocation } = require('electron-util')
autoUpdater.logger = log

let win
let tray
const args = process.argv.slice(1)
const serve = args.some((val) => val === '--serve')
require('electron-debug')()

const setTheme = () => {
  const theme = systemPreferences.isDarkMode() ? 'dark' : 'light'
  if (systemPreferences.setAppLevelAppearance) {
    systemPreferences.setAppLevelAppearance(theme)
  }
  return theme
}
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })
}

app.setAppUserModelId('app.ratr.offline')

app.on('ready', async () => {
  setTheme()
  if (systemPreferences.subscribeNotification) {
    systemPreferences.subscribeNotification(
      'AppleInterfaceThemeChangedNotification',
      setTheme,
    )
  }
  autoUpdater.checkForUpdatesAndNotify()
  tray = new Tray(
    path.join(
      __dirname,
      (await online()) ? './images/ThumbsUp.png' : './images/ThumbsDown.png',
    ),
  )
  tray.setToolTip('Offline')
  tray.on('click', (_, bounds) => {
    if (!win) {
      createWindow(bounds.x - 150 + bounds.width / 2, bounds.y)
    } else {
      win.close()
    }
  })
  enforceMacOSAppLocation()
  app.setLoginItemSettings({
    openAtLogin: true,
  })
  updateStats()
})
const updateStats = async () => {
  let change = false
  let good = true
  if (await online()) {
    stats.internet = 0
    good = true
  } else {
    if (stats.internet === 0) {
      stats.internet = new Date()
      change = true
    }
    good = false
  }
  try {
    await dnsLookup('google.com')
    stats.dns = 0
  } catch (e) {
    if (stats.dns === 0) {
      stats.dns = new Date()
      change = true
    }
    good = false
  }
  if (good) {
    tray.setImage(path.join(__dirname, './images/ThumbsUp.png'))
  } else {
    tray.setImage(path.join(__filen__dirnameame, './images/ThumbsDown.png'))
  }
  if (change) {
    const bounds = tray.getBounds()
    createWindow(bounds.x - 150 + bounds.width / 2, bounds.y)
  }
  setTimeout(updateStats, 1000 * 10)
}
const stats = {
  internet: 0,
  dns: 0,
}
function createWindow(x, y) {
  const opts = {
    width: 300,
    height: 250,
    x,
    y,
    transparent: true,
    resizable: false,
    moveable: false,
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.js'),
    },
    frame: false,
    show: false,
  }
  win = new BrowserWindow(opts)
  win.webContents.on('did-finish-load', () => {
    win.show()
  })
  const url = serve
    ? 'http://localhost:3000/'
    : format({
        pathname: join(__dirname, '../renderer/out/index.html'),
        protocol: 'file:',
        slashes: true,
      })

  win.loadURL(url)

  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
  win.on('blur', () => {
    if (!serve) {
      //win.close()
    }
  })
}
app.on('window-all-closed', () => {
  //
})
ipcMain.on('stats', (e) => {
  e.returnValue = stats
})
