package main

import (
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/charles7668/novel-reader/services/file_operation"
	"github.com/charles7668/novel-reader/services/novel"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

var logger *log.Logger

type Message struct {
	Status  ErrorCode `json:"status"`
	Message string    `json:"message"`
}

type ErrorCode int

const (
	Success = 0
	ParamError
	DatabaseOperationError
)

//getNovels url : /novels/, Method : GET
func getNovels(c *gin.Context) {
	logger.Println("func enter : main getNovels")
	novels, err := novel.GetNovelList()
	if err != nil {
		logger.Fatalln(err)
		c.IndentedJSON(http.StatusNotFound, novels)
		return
	}
	c.IndentedJSON(http.StatusOK, novels)
	logger.Println("func exit : main getNovels")
}

//getNovelChapterByID	using MD5 string to select novel
func getNovelChapterByID(c *gin.Context) {
	md5 := c.Param("id")
	chapters := novel.GetChapters(md5)
	if chapters[0].ChapterName == "error" {
		c.IndentedJSON(http.StatusBadRequest, chapters)
		return
	}
	c.IndentedJSON(http.StatusOK, chapters)
}

//addNovels url : /novels/ , Method : POST
//add novel file to database
func addNovels(c *gin.Context) {
	logger.Println("POST : add novels")
	file, err := c.FormFile("file")
	if err != nil {
		logger.Fatalln(err)
		c.IndentedJSON(http.StatusBadRequest, novel.Information{})
		return
	}
	fileName := file.Filename
	exist := novel.CheckNovelExist(fileName)
	if exist {
		logger.Println(fileName + " is exist")
		c.IndentedJSON(http.StatusAlreadyReported, novel.Information{})
		return
	}
	logger.Println(fileName)
	err = c.SaveUploadedFile(file, fileName)
	if err != nil {
		logger.Fatalln(err)
		c.IndentedJSON(http.StatusBadRequest, novel.Information{})
		return
	}
	information, err := novel.AddNovel(fileName)
	fileErr := file_operation.DeleteFile(fileName)
	logger.Print("delete file err : ")
	logger.Println(fileErr)
	if err != nil {
		c.IndentedJSON(http.StatusMethodNotAllowed, novel.Information{})
		return
	}
	logger.Println("POST novels success")
	c.IndentedJSON(http.StatusOK, information)
}

//updateAccessTimeByID update access time by id
func updateAccessTimeByID(c *gin.Context) {
	logger.Println("func enter : main updateAccessTimeByID")
	rowID, err := strconv.Atoi(c.Param("rowID"))
	if err != nil {
		logger.Fatalln(err)
		c.String(http.StatusBadRequest, "param error")
		return
	}
	result, err := novel.UpdateAccessTime(rowID)
	if err != nil {
		logger.Fatalln(err)
		c.String(http.StatusBadRequest, "error")
		return
	}
	logger.Println("func exit : main updateAccessTimeByID")
	c.String(http.StatusOK, result)
}

//updateReadingByID update reading progress
func updateReadingByID(c *gin.Context) {
	logger.Println("func enter : main updateReadingByID")
	requestBody, _ := ioutil.ReadAll(c.Request.Body)
	var information novel.Information
	err := json.Unmarshal(requestBody, &information)
	if err != nil {
		logger.Fatalln(err)
		c.String(http.StatusBadRequest, "param error")
		return
	}
	err = novel.UpdateReading(information)
	if err != nil {
		logger.Fatalln(err)
		c.String(http.StatusBadRequest, "db operation error")
		return
	}
	c.String(http.StatusOK, "success")
	logger.Println("func exit : main updateReadingByID")
}

//deleteNovelByID using row id to delete time
func deleteNovelByID(c *gin.Context) {
	logger.Println("func enter : main deleteNovelByID")
	rowID, err := strconv.Atoi(c.Param("rowID"))
	if err != nil {
		message := Message{Status: ParamError, Message: "param error"}
		c.IndentedJSON(http.StatusBadRequest, message)
		return
	}
	err = novel.DeleteNovel(rowID)
	if err != nil {
		message := Message{Status: DatabaseOperationError, Message: "database operation error"}
		c.IndentedJSON(http.StatusBadRequest, message)
		return
	}
	logger.Println("func exit : main deleteNovelByID")
	c.IndentedJSON(http.StatusOK, Message{Status: Success, Message: "success"})
}

//addImageByID add image using row id
func addImageByID(c *gin.Context) {
	logger.Println("func enter : main addImageByID")
	rowID, err := strconv.Atoi(c.Param("rowID"))
	if err != nil {
		logger.Fatalln(err)
		c.IndentedJSON(http.StatusBadRequest, Message{Status: ParamError, Message: "Param error"})
		return
	}
	file, err := c.FormFile("file")
	allowExt := []string{".png", ".jpg", ".jpeg", ".ico"}
	ext := path.Ext(file.Filename)
	isAllow := false
	for _, allow := range allowExt {
		if ext == allow {
			isAllow = true
			break
		}
	}
	if err != nil {
		logger.Fatalln(err)
		c.IndentedJSON(http.StatusBadRequest, Message{Status: ParamError, Message: "Param error"})
		return
	}
	if !isAllow {
		logger.Fatalln(file.Filename + " not allow file format")
		c.IndentedJSON(http.StatusBadRequest, Message{Status: ParamError, Message: file.Filename + " not allow file format"})
		return
	}
	err = c.SaveUploadedFile(file, file.Filename)
	if err != nil {
		logger.Fatalln(err)
		c.IndentedJSON(http.StatusBadRequest, Message{Status: ParamError, Message: "Param error"})
		return
	}
	open, _ := os.Open(file.Filename)
	defer file_operation.DeleteFile(file.Filename)
	defer open.Close()
	buf, _ := ioutil.ReadAll(open)
	base64String := base64.StdEncoding.EncodeToString(buf)
	err = novel.AddImage(rowID, base64String)
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, Message{Status: DatabaseOperationError, Message: "database error"})
		return
	}
	c.IndentedJSON(http.StatusOK, Message{Status: Success, Message: base64String})
	logger.Println("func exit : main addImageByID")
}

//main entry point
func main() {
	date := time.Now().Format("060102")
	logWriter, err := os.OpenFile("./log"+date+".log", os.O_WRONLY|os.O_CREATE|os.O_APPEND, 0666)
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
								Cover      text
							)`)
		if err != nil {
			logger.Fatalln(err)
		}
	}
	novel.Init(novel.InitStructure{DBHandle: db, Logger: logger})
	router := gin.Default()
	router.Use(Cors())
	router.GET("/novels", getNovels)
	router.GET("/novels/:id", getNovelChapterByID)
	router.POST("/update_time/:rowID", updateAccessTimeByID)
	router.POST("/update_reading/:rowID", updateReadingByID)
	router.POST("/delete/:rowID", deleteNovelByID)
	router.POST("/novels", addNovels)
	router.POST("/cover/:rowID", addImageByID)
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
