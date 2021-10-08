package main

import (
	"database/sql"
	"fmt"
	"github.com/charles7668/novel-reader/services/file_operation"
	"github.com/charles7668/novel-reader/services/novel"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

var logger *log.Logger

//getNovels url : /novels/, Method : GET
func getNovels(c *gin.Context) {
	logger.Println("GET : get novels")
	novels, err := novel.GetNovelList()
	if err != nil {
		c.IndentedJSON(http.StatusNotFound, novels)
		return
	}
	c.IndentedJSON(http.StatusOK, novels)
}

//addNovels url : /novels/ , Method : POST
//add novel file to database
func addNovels(c *gin.Context) {
	logger.Println("POST : add novels")
	file, err := c.FormFile("file")
	if err != nil {
		logger.Fatalln(err)
		c.String(http.StatusBadRequest, "request fail")
		return
	}
	fileName := file.Filename
	exist := novel.CheckNovelExist(fileName)
	if exist {
		logger.Println(fileName + " is exist")
		c.String(http.StatusAlreadyReported, "file exist")
		return
	}
	logger.Println(fileName)
	err = c.SaveUploadedFile(file, fileName)
	if err != nil {
		logger.Fatalln(err)
		c.String(http.StatusBadRequest, "save fail")
		return
	}
	err = novel.AddNovel(fileName)
	fileErr := file_operation.DeleteFile(fileName)
	logger.Print("delete file err : ")
	logger.Println(fileErr)
	if err != nil {
		c.String(http.StatusMethodNotAllowed, "file format error")
		return
	}
	logger.Println("POST novels success")
	c.String(http.StatusOK, "success")
}

//main entry point
func main() {
	logWriter, err := os.OpenFile("./log.log", os.O_WRONLY|os.O_CREATE|os.O_APPEND, 0666)
	logger = log.New(logWriter, "", log.Ldate|log.Ltime)
	defer logWriter.Close()
	_, _ = file_operation.CreateFileIfNotExist("novel-reader.db")
	logger.Println("open novel-reader.db")
	db, err := sql.Open("sqlite3", "novel-reader.db")
	if err != nil {
		logger.Fatalln(err)
	} else {
		defer db.Close()
		logger.Println("create NovelInformation table if not exist")
		_, err := db.Exec(`CREATE TABLE IF NOT EXISTS NovelInformation
							(
							    Author     text,
							    Brief      text,
							    Name       text,
							    CurrentChapter text,
							    LastChapter text,
							    FileName   text,
							    LastAccess text,
							    CreateTime text,
							    MD5		   text,
								Cover      blob
							)`)
		if err != nil {
			logger.Fatalln(err)
		}
	}
	novel.Init(novel.InitStructure{DBHandle: db, Logger: logger})
	router := gin.Default()
	router.Use(Cors())
	router.GET("/novels", getNovels)
	router.POST("/novels", addNovels)
	router.Run("localhost:8088")
}

// Cors setting cross-origin
func Cors() gin.HandlerFunc {
	return func(c *gin.Context) {
		method := c.Request.Method
		origin := c.Request.Header.Get("Origin")
		var headerKeys []string
		for k, _ := range c.Request.Header {
			headerKeys = append(headerKeys, k)
		}
		headerStr := strings.Join(headerKeys, ", ")
		if headerStr != "" {
			headerStr = fmt.Sprintf("access-control-allow-origin, access-control-allow-headers, %s", headerStr)
		} else {
			headerStr = "access-control-allow-origin, access-control-allow-headers"
		}
		if origin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
			c.Header("Access-Control-Allow-Origin", "*")
			c.Header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE,UPDATE")
			c.Header("Access-Control-Allow-Headers", "Authorization, Content-Length, X-CSRF-Token, Token,session,X_Requested_With,Accept, Origin, Host, Connection, Accept-Encoding, Accept-Language,DNT, X-CustomHeader, Keep-Alive, User-Agent, X-Requested-With, If-Modified-Since, Cache-Control, Content-Type, Pragma")
			c.Header("Access-Control-Expose-Headers", "Content-Length, Access-Control-Allow-Origin, Access-Control-Allow-Headers,Cache-Control,Content-Language,Content-Type,Expires,Last-Modified,Pragma,FooBar")
			c.Header("Access-Control-Max-Age", "172800")
			c.Header("Access-Control-Allow-Credentials", "false")
			c.Set("content-type", "application/json,multipart/form-data")
		}

		if method == "OPTIONS" {
			c.JSON(http.StatusOK, "Options Request!")
		}
		c.Next()
	}
}
