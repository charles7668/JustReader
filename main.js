const {app, BrowserWindow} = require('electron')
const fs = require('fs');
const {spawn} = require('child_process')

let server_process

function createWindow() {
    const win = new BrowserWindow({width: 800, height: 600 , autoHideMenuBar:true})
    const readCallBack = (err, data) => {
        if (process.env.NODE_SERVER_PATH !== undefined) {
            const url = process.env.NODE_SERVER_PATH
            // noinspection JSIgnoredPromiseFromCall
            win.loadURL(url)
        } else {
            server_process = spawn("server.exe")
            server_process.on('spawn', () => {
                let url = ''
                if (err) {
                    console.log(err)
                } else {
                    let jsonData = JSON.parse(data)
                    url = jsonData.url.toString()
                    console.log(url)
                }
                // noinspection JSIgnoredPromiseFromCall
                win.loadURL(url)
            })
        }
    }
    fs.readFile('server.json', readCallBack)
}

app.whenReady().then(() => {
    createWindow()
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})