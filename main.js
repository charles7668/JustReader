const {app, BrowserWindow, dialog} = require('electron')
const fs = require('fs');
const {spawn} = require('child_process')

let server_process

function createWindow() {
    const win = new BrowserWindow({width: 500, height: 800, autoHideMenuBar: true})
    const readCallBack = (err, data) => {
        if (process.env.NODE_SERVER_PATH !== undefined) {
            const url = process.env.NODE_SERVER_PATH
            // noinspection JSIgnoredPromiseFromCall
            win.loadURL(url)
        } else {
            let url = '';
            if (err) {
                console.log(err)
            } else {
                let jsonData = JSON.parse(data)
                url = jsonData.url.toString()
                console.log(url)
            }
            // noinspection JSIgnoredPromiseFromCall
            win.loadURL(url)
        }
    }
    const runServer = () => {
        if (process.env.NODE_SERVER_PATH !== undefined) {
            const url = process.env.NODE_SERVER_PATH
            // noinspection JSIgnoredPromiseFromCall
            win.loadURL(url)
        } else {
            server_process = spawn("server.exe")
            server_process.on('spawn', () => {
                let counter = 0;
                const checkFile = setInterval(() => {
                    const exist = fs.existsSync('server.json')
                    if (exist) {
                        clearInterval(checkFile)
                        fs.readFile('server.json', readCallBack)
                    } else if (counter >= 10) {
                        clearInterval(checkFile)
                        // noinspection JSIgnoredPromiseFromCall
                        dialog.showMessageBox(new BrowserWindow({
                            type: "error",
                            title: "error",
                            message: "can't find server.json file",
                            buttons: ["OK"],
                        }), function (index) {
                            if (index === 0) {
                                app.quit()
                            }
                        })
                    }
                    counter++;
                }, 500)
            })
        }
    }
    runServer();
}

app.whenReady().then(() => {
    createWindow()
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})