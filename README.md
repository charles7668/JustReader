# Novel-Reader

小說閱讀器

# Feature

- [x] 載入txt格式的小說
- [x] 爬取特定網站的小說(目前支援 飄天,妙筆閣)
- [x] 閱讀頁面 顏色,字體大小 可自定義
- [x] 簡繁切換

# 注意

1. 目前使用 port 為 8088 , 如此port使用中則無法正常使用

# Requirement

1. [Node.js](https://nodejs.org/en/)
2. [Golang](https://golang.org/)

# build app

1. install dependency
    1. run `npm install`
    2. cd to go folder
    3. run go mod tiny
2. run `node build.js` in terminal , output folder is `build_electron`

[React build](React.md)  
[Go build](go%20build.md)

# 目前支援本地小說格式說明

[點我](docs/novel%20format.md)