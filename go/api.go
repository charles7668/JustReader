package main

import (
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/charles7668/novel-reader/services/AppSetting"
	"github.com/charles7668/novel-reader/services/Scraper"
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

	"github.com/gin-gonic/contrib/static"
	"github.com/gin-gonic/gin"
)

var logger *log.Logger

type Message struct {
	Status  ErrorCode `json:"status"`
	Message string    `json:"message"`
}

type ErrorCode int

const (
	Success = iota
	ParamError
	DatabaseOperationError
	SearchCoverProcessing
	SearchCoverReadyToGet
	Other
)

type ServerSetting struct {
	URL string `json:"url"`
}

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

//getNovelByID	using MD5 string to select novel
func getNovelByID(c *gin.Context) {
	rowID, err := strconv.Atoi(c.Param("id"))
	if checkError(err) {
		c.IndentedJSON(http.StatusBadRequest, Message{Status: ParamError, Message: "param error"})
		return
	}
	information, err := novel.GetNovel(rowID)
	if checkError(err) {
		c.IndentedJSON(http.StatusBadRequest, Message{Status: DatabaseOperationError, Message: "database error"})
		return
	}
	c.IndentedJSON(http.StatusOK, information)
}

//addNovels url : /novels/ , Method : POST
//add novel file to database
func addNovels(c *gin.Context) {
	logger.Println("func enter : main/addNovels")
	defer logger.Println("func exit : main/addNovels")
	file, err := c.FormFile("file")
	if checkError(err) {
		c.IndentedJSON(http.StatusBadRequest, Message{Status: ParamError, Message: "param error"})
		return
	}
	fileName := file.Filename
	exist := novel.CheckNovelExist(fileName)
	if exist {
		logger.Println(fileName + " is exist")
		c.IndentedJSON(http.StatusAlreadyReported, Message{Status: DatabaseOperationError, Message: "file already exist"})
		return
	}
	logger.Println(fileName)
	err = c.SaveUploadedFile(file, fileName)
	if checkError(err) {
		c.IndentedJSON(http.StatusBadRequest, Message{Status: ParamError, Message: "can't save image"})
		return
	}
	information, err := novel.AddNovel(fileName)
	if checkError(err) {
		c.IndentedJSON(http.StatusBadRequest, Message{Status: DatabaseOperationError, Message: "database error"})
		return
	}
	err = file_operation.DeleteFile(fileName)
	if checkError(err) {
		c.IndentedJSON(http.StatusMethodNotAllowed, Message{Status: Other, Message: "file operation error"})
		return
	}
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
	logger.Println("func enter : main/addImageByID")
	defer logger.Println("func exit : main/addImageByID")
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
}

func updateSetting(c *gin.Context) {
	logger.Println("func enter : main updateSetting")
	body := c.Request.Body
	bodyData, err := ioutil.ReadAll(body)
	if err != nil {
		logger.Println(err)
		c.IndentedJSON(http.StatusBadRequest, Message{Status: ParamError, Message: "request body error"})
		logger.Println("func exit : main updateSetting")
		return
	}
	var setting AppSetting.Setting
	err = json.Unmarshal(bodyData, &setting)
	if err != nil {
		logger.Println(err)
		c.IndentedJSON(http.StatusBadRequest, Message{Status: ParamError, Message: "request body error"})
		logger.Println("func exit : main updateSetting")
		return
	}
	err = AppSetting.UpdateSetting(setting)
	if err != nil {
		logger.Println(err)
		c.IndentedJSON(http.StatusBadRequest, Message{Status: DatabaseOperationError, Message: "db error"})
		logger.Println("func exit : main updateSetting")
		return
	}
	c.IndentedJSON(http.StatusOK, Message{Status: Success, Message: "Success"})
	logger.Println("func exit : main updateSetting")
}

func getSetting(c *gin.Context) {
	setting, err := AppSetting.GetSetting()
	if err != nil {
		logger.Println(err)
		c.IndentedJSON(http.StatusBadRequest, Message{Status: DatabaseOperationError, Message: "get setting from db error"})
		return
	}
	c.IndentedJSON(http.StatusOK, setting)
}

//searchCover search cover
func searchCover(c *gin.Context) {
	logger.Println("func enter : main/searchCover")
	defer logger.Println("func exit : main/searchCover")
	runningState := Scraper.GetStatus()
	if runningState != Scraper.Ready {
		if runningState == Scraper.ReadyToGet {
			c.IndentedJSON(http.StatusOK, Message{Status: SearchCoverReadyToGet, Message: "search finished , data is wait for reading"})
		} else if runningState == Scraper.Processing {
			c.IndentedJSON(http.StatusOK, Message{Status: SearchCoverProcessing, Message: "processing , can get current data"})
		}
		return
	}
	var body map[string]string
	bodyData, err := ioutil.ReadAll(c.Request.Body)
	if checkError(err) {
		c.IndentedJSON(http.StatusBadRequest, Message{Status: ParamError, Message: "Param error"})
		return
	}
	err = json.Unmarshal(bodyData, &body)
	if checkError(err) {
		c.IndentedJSON(http.StatusBadRequest, Message{Status: ParamError, Message: "Param error"})
		return
	}
	searchKey, exist := body["search_key"]
	if exist {
		go Scraper.SearchCover(string(searchKey))
		c.IndentedJSON(http.StatusOK, Message{Status: SearchCoverProcessing, Message: "search start"})
	} else {
		c.IndentedJSON(http.StatusBadRequest, Message{Status: ParamError, Message: "search key is empty"})
	}
}

//getSearchCover get current search cover
func getSearchCover(c *gin.Context) {
	logger.Println("func enter : main/getSearchCover")
	defer logger.Println("func exit : main/getSearchCover")
	result := Scraper.GetCoverList()
	c.IndentedJSON(http.StatusOK, result)
}

//stopSearchCover stop search cover and return current list
func stopSearchCover(c *gin.Context) {
	logger.Println("func enter : main/stopSearchCover")
	defer logger.Println("func exit : main/stopSearchCover")
	var result []string
	if Scraper.GetStatus() == Scraper.Processing {
		Scraper.StopProcessing()
		for {
			if Scraper.GetStatus() == Scraper.ReadyToGet {
				result = Scraper.GetCoverList()
				break
			}
		}
	} else if Scraper.GetStatus() == Scraper.ReadyToGet {
		result = Scraper.GetCoverList()
	}
	c.IndentedJSON(http.StatusOK, result)
}

//useNetImageByID use net image
func useNetImageByID(c *gin.Context) {
	logger.Println("func enter : main/useNetImageByID")
	defer logger.Println("func exit : main/useNetImageByID")
	rowID, err := strconv.Atoi(c.Param("rowID"))
	if checkError(err) {
		c.IndentedJSON(http.StatusBadRequest, Message{Status: ParamError, Message: "param error"})
		return
	}
	bodyData, err := ioutil.ReadAll(c.Request.Body)
	if checkError(err) {
		c.IndentedJSON(http.StatusBadRequest, Message{Status: ParamError, Message: "param error"})
		return
	}
	var jsonObject map[string]string
	err = json.Unmarshal(bodyData, &jsonObject)
	if checkError(err) {
		c.IndentedJSON(http.StatusBadRequest, Message{Status: ParamError, Message: "not valid json type"})
		return
	}
	url, exist := jsonObject["url"]
	if !exist {
		c.IndentedJSON(http.StatusBadRequest, Message{Status: ParamError, Message: "url param not found"})
		return
	}
	base64String := Scraper.GetImageFromURLToBase64(url)
	if base64String == "" {
		c.IndentedJSON(http.StatusBadRequest, Message{Status: ParamError, Message: "url string cannot download"})
		return
	}
	err = novel.AddImage(rowID, base64String)
	if checkError(err) {
		c.IndentedJSON(http.StatusBadRequest, Message{Status: ParamError, Message: "add image to database error"})
		return
	}
	c.IndentedJSON(http.StatusOK, Message{Status: Success, Message: "Success"})
}

var StaticFilePath = "../build"

//main entry point
func main() {
	date := time.Now().Format("060102")
	logWriter, err := os.OpenFile("./log"+date+".log", os.O_WRONLY|os.O_CREATE|os.O_APPEND, 0666)
	logger = log.New(logWriter, "", log.Ldate|log.Ltime)
	defer func(logWriter *os.File) {
		err = logWriter.Close()
		if err != nil {
			return
		}
	}(logWriter)
	_, _ = file_operation.CreateFileIfNotExist("novel-reader.db")
	logger.Println("open novel-reader.db")
	db, err := sql.Open("sqlite3", "novel-reader.db")
	if err != nil {
		logger.Fatalln(err)
	} else {
		defer func(db *sql.DB) {
			err = db.Close()
			checkError(err)
		}(db)
		logger.Println("create NovelInformation table if not exist")
		queryString := `CREATE TABLE IF NOT EXISTS NovelInformation
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
							)`
		_, err := db.Exec(queryString)
		if err != nil {
			logger.Fatalln(err)
		}
	}
	str, _ := json.Marshal(ServerSetting{URL: "http://localhost:8088"})
	_ = ioutil.WriteFile("server.json", []byte(str), 0666)
	novel.Init(novel.InitStructure{DBHandle: db, Logger: logger})
	AppSetting.Init(AppSetting.InitStructure{Logger: logger, Database: db})
	Scraper.Init(logger)
	router := gin.Default()
	router.Use(Cors())
	router.Use(static.Serve("/", static.LocalFile(StaticFilePath, true)))
	router.GET("/novels", getNovels)
	router.GET("/chapters/:id", getNovelChapterByID)
	router.GET("/novels/:id", getNovelByID)
	router.GET("/setting", getSetting)
	router.POST("/search_cover", searchCover)
	router.POST("/search_cover/get", getSearchCover)
	router.POST("/search_cover/stop", stopSearchCover)
	router.POST("/update_time/:rowID", updateAccessTimeByID)
	router.POST("/update_reading/:rowID", updateReadingByID)
	router.POST("/delete/:rowID", deleteNovelByID)
	router.POST("/novels", addNovels)
	router.POST("/cover/:rowID", addImageByID)
	router.POST("/use_net_image/:rowID", useNetImageByID)
	router.POST("/update_setting", updateSetting)
	err = router.Run("localhost:8088")
	if err != nil {
		logger.Fatalln(err)
	}
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

func checkError(err error) bool {
	if err != nil {
		logger.Println(err)
		return true
	}
	return false
}
