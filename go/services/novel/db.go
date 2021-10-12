package novel

import (
	"fmt"
	"strings"
	"time"
)

//CheckNovelExist check novel is exits
func CheckNovelExist(fileName string) bool {
	logger.Println("check file novel in row name : " + fileName)
	queryString := "SELECT EXISTS(SELECT 1 FROM NovelInformation WHERE FileName=" + "('" + fileName + "')" + ")"
	result, err := db.Query(queryString)
	defer result.Close()
	if err != nil {
		logger.Fatalln(err)
		return false
	}
	var val int
	result.Next()
	result.Scan(&val)
	logger.Println(val)
	if val == 1 {
		return true
	} else {
		return false
	}
}

//AddNovel add novel to database
func AddNovel(fileName string) error {
	logger.Println("func enter : AddNovel")
	novel, err := getNovelInformation(fileName)
	if err != nil {
		logger.Fatalln(err)
		return err
	}
	logger.Println("prepare insert data")
	nowTime := time.Now().Format("2006-01-02 15:04:05")
	hash := novel.Information.MD5
	queryString := fmt.Sprintf(
		"INSERT INTO NovelInformation (Author, Brief, Name, FileName,CurrentChapter,LastChapter, LastAccess, CreateTime,MD5) VALUES ('%s','%s','%s','%s','%s','%s','%s','%s','%s')",
		strings.ReplaceAll(novel.Information.Author, "'", "''"),
		strings.ReplaceAll(novel.Information.Brief, "'", "''"),
		strings.ReplaceAll(novel.Information.Name, "'", "''"),
		strings.ReplaceAll(novel.Information.FileName, "'", "''"),
		strings.ReplaceAll(novel.Information.CurrentChapter, "'", "''"),
		strings.ReplaceAll(novel.Information.LastChapter, "'", "''"),
		strings.ReplaceAll(nowTime, "'", "''"),
		strings.ReplaceAll(nowTime, "'", "''"),
		hash)

	_, err = db.Exec(queryString)
	if err != nil {
		logger.Fatalln(err)
		return err
	}
	logger.Println("insert success")
	logger.Println("create chapter table : " + hash)
	queryString = "CREATE TABLE IF NOT EXISTS '" + hash + "' (ChapterName text,ChapterContent text)"
	_, err = db.Exec(queryString)
	if err != nil {
		logger.Fatalln(err)
		return err
	}
	logger.Println("insert chapter data")
	queryString = "INSERT INTO '" + hash + "' (ChapterName,ChapterContent) VALUES "
	for i, value := range novel.Chapters {
		str := "('" + strings.ReplaceAll(value.ChapterName, "'", "''") + "','" + strings.ReplaceAll(value.ChapterContent, "'", "''") + "')"
		if i != len(novel.Chapters)-1 {
			str += ","
		}
		queryString += str
	}
	//logger.Print(queryString)
	_, err = db.Exec(queryString)
	if err != nil {
		logger.Fatalln(err)
		return err
	}
	logger.Println("func exit : AddNovel")
	return nil
}

//GetNovels get novel list from database
func GetNovels() ([]Information, error) {
	logger.Println("func enter : GetNovels")
	var novels []Information
	var queryString = "SELECT ROWID,* FROM NovelInformation"
	result, err := db.Query(queryString)
	defer result.Close()
	if err != nil {
		logger.Fatalln(err)
		return novels, err
	}

	for result.Next() {
		var information Information
		err = result.Scan(
			&information.ID,
			&information.Author,
			&information.Brief,
			&information.Name,
			&information.CurrentChapter,
			&information.LastChapter,
			&information.FileName,
			&information.LastAccess,
			&information.CreateTime,
			&information.MD5,
			&information.Cover)
		if err != nil {
			logger.Fatalln(err)
			return novels, err
		}
		novels = append(novels, information)
	}
	logger.Println("func exit : GetNovels")
	return novels, nil
}
