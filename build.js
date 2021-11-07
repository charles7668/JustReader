const path = require('path');
const builder = require('electron-builder');
const exec = require('child_process').exec;

const buildElectron = () => {
    builder.build({

        projectDir: path.resolve(__dirname),  // 專案路徑

        win: ['nsis', 'portable'],  // nsis . portable
        config: {
            "appId": "com.electron.novel_reader",
            "productName": "novel-reader", // 應用程式名稱 ( 顯示在應用程式與功能 )
            "directories": {
                "output": "build_electron"
            },
            "extraResources": [
                {
                    "from": "./build",
                    "to": "./static"
                },
                {
                    "from": "./go/server.exe",
                    "to": "../server.exe"
                },
                {
                    "from": "./go/scraper",
                    "to": "../scraper"
                }
            ],
            "files": [
                "**/*",
                "!.git/*",
                "!.idea/*",
                "!build/*",
                "!build_electron/*",
                "!docs/*",
                "!go/*",
                "!node_modules/*",
                "!public/*",
                "!src/*",
                "!*.md"
            ],
            "win": {},
            "extends": null
        },
    }).then(
        data => console.log(data),
        err => console.error(err)
    );
}

const buildGoApp = () => {
    console.log('start build go app')
    exec("set GIN_MODE=release && cd go && go build -o server.exe -ldflags=\"-X 'main.StaticFilePath=resources/static' -X 'main.BuildMode=RELEASE'\"", (error) => {
        if (error !== null) {
            console.log(`exec error: ${error}`);
        }
        console.log('go build end')
        buildElectron()
    })
}

const buildReact = () => {
    console.log('start build react')
    exec("npm run build", (err, stdout, stderr) => {
            console.log(`${stdout}`)
            console.log(`${stderr}`)
            if (err !== null) {
                console.log(`exec error: ${err}`);
            }
            console.log('build react end')
            buildGoApp()
        }
    )
}

buildReact()