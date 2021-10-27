const {app, BrowserWindow} = require('electron')
const fs = require('fs');
const {spawn} = require('child_process')

let server_process

function createWindow() {
    const win = new BrowserWindow({width: 800, height: 600})
    const readCallBack = (err, data) => {
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
            win.loadURL(url).then(r => r)
        })
    }
    fs.readFile('server.json', readCallBack)
}

app.whenReady().then(() => {
    createWindow()
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})