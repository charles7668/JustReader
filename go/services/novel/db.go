package novel

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"
)

//checkNovelExist check novel is exits
func checkNovelExist(fileName string) bool {
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

//addNovel add novel to database
func addNovel(fileName string) (Information, error) {
	logger.Println("func enter : novel/db addNovel")
	novel, err := getNovelInformation(fileName)
	if err != nil {
		logger.Fatalln(err)
		return novel.Information, err
	}
	logger.Println("prepare insert data")
	nowTime := time.Now().Format("2006-01-02 15:04:05")
	novel.Information.LastAccess = nowTime
	novel.Information.CreateTime = nowTime
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
		return novel.Information, err
	}
	logger.Println("insert success")
	logger.Println("create chapter table : " + hash)
	queryString = "CREATE TABLE IF NOT EXISTS '" + hash + "' (ChapterName text,ChapterContent text)"
	_, err = db.Exec(queryString)
	if err != nil {
		logger.Fatalln(err)
		return novel.Information, err
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
	_, err = db.Exec(queryString)
	if err != nil {
		logger.Fatalln(err)
		return novel.Information, err
	}
	logger.Println("query inserted novel")
	queryString = "SELECT ROWID FROM NovelInformation WHERE MD5=" + "'" + novel.Information.MD5 + "'"
	row := db.QueryRow(queryString)
	row.Scan(&novel.Information.ID)
	if err != nil {
		logger.Fatalln("query data fail")
		return novel.Information, errors.New("query data error")
	}
	logger.Println("func exit : novel/db addNovel")
	return novel.Information, nil
}

func selectNovelsFromTable(condition string) ([]Information, error) {
	var novels []Information
	var queryString = "SELECT ROWID,* FROM NovelInformation " + condition
	result, err := db.Query(queryString)
	defer result.Close()
	if err != nil {
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
			return novels, err
		}
		novels = append(novels, information)
	}
	return novels, nil
}

//getNovels get novel list from database
func getNovels() ([]Information, error) {
	logger.Println("func enter : getNovels")
	novels, err := selectNovelsFromTable("")
	if err != nil {
		logger.Fatalln(err)
		return novels, err
	}
	logger.Println("func exit : getNovels")
	return novels, nil
}

//getChapters get chapter by md5 string
func getChapters(queryMD5 string) []Chapter {
	queryString := "SELECT * FROM '" + queryMD5 + "'"
	res, err := db.Query(queryString)
	if err != nil {
		return []Chapter{{ChapterName: "error", ChapterContent: "error"}}
	}
	defer res.Close()
	var chapters []Chapter
	for res.Next() {
		var chapter Chapter
		res.Scan(&chapter.ChapterName, &chapter.ChapterContent)
		chapters = append(chapters, chapter)
	}
	return chapters
}

//updateAccessTime update access time
func updateAccessTime(rowID int) string {
	logger.Println("func enter : updateAccessTime")
	time := time.Now().Format("2006-01-02 15:04:05")
	queryString := "UPDATE 'NovelInformation' SET LastAccess='" + time + "' WHERE ROWID=" + strconv.Itoa(rowID)
	_, err := db.Exec(queryString)
	if err != nil {
		logger.Fatalln(err)
		return "fail"
	}
	logger.Println("func exit : updateAccessTime")
	return time
}

//updateReading update reading progress
func updateReading(information Information) string {
	logger.Println("func enter : novel/db updateReading")
	queryString := fmt.Sprintf("UPDATE 'NovelInformation' SET CurrentChapter='%s' WHERE ROWID=%d", information.CurrentChapter, information.ID)
	_, err := db.Exec(queryString)
	if err != nil {
		logger.Fatalln(err)
		return "fail"
	}
	logger.Println("func exit : novel/db updateReading")
	return "success"
}

//deleteNovel delete novel using row id
func deleteNovel(rowID int) error {
	logger.Println("func enter : novel/db deleteNovel")
	queryString := fmt.Sprintf("SELECT MD5 from NovelInformation WHERE ROWID=%d", rowID)
	res, err := db.Query(queryString)
	if err != nil {
		logger.Fatalln(err)
		return errors.New("db operation error")
	}
	res.Next()
	var md5 string
	res.Scan(&md5)
	res.Close()
	queryString = fmt.Sprintf("DROP TABLE '%s'", md5)
	_, err = db.Exec(queryString)
	if err != nil {
		logger.Fatalln(err)
		return errors.New("db operation error")
	}
	queryString = fmt.Sprintf("DELETE FROM NovelInformation WHERE ROWID=%d", rowID)
	_, err = db.Exec(queryString)
	if err != nil {
		logger.Fatalln(err)
		return errors.New("db operation error")
	}
	logger.Println("func exit : novel/db deleteNovel")
	return nil
}
