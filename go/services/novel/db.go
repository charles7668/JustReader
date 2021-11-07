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

//addNovelFromFile add novel to database
func addNovelFromFile(fileName string) (Information, error) {
	logger.Println("func enter : novel/db addNovelFromFile")
	defer logger.Println("func exit : novel/db addNovelFromFile")
	novel, err := getNovelInformation(fileName)
	if checkError(err) {
		return novel.Information, err
	}
	logger.Println("prepare insert data")
	nowTime := time.Now().Format("2006-01-02 15:04:05")
	novel.Information.LastAccess = nowTime
	novel.Information.CreateTime = nowTime
	novel.Information.Source = "local"
	hash := novel.Information.MD5
	queryString := fmt.Sprintf(
		"INSERT INTO NovelInformation (Author, Brief, Name, FileName,CurrentChapter,LastChapter, LastAccess, CreateTime,MD5,Cover,Detail,Source) VALUES ('%s','%s','%s','%s','%s','%s','%s','%s','%s','','','%s')",
		strings.ReplaceAll(novel.Information.Author, "'", "''"),
		strings.ReplaceAll(novel.Information.Brief, "'", "''"),
		strings.ReplaceAll(novel.Information.Name, "'", "''"),
		strings.ReplaceAll(novel.Information.FileName, "'", "''"),
		strings.ReplaceAll(novel.Information.CurrentChapter, "'", "''"),
		strings.ReplaceAll(novel.Information.LastChapter, "'", "''"),
		strings.ReplaceAll(nowTime, "'", "''"),
		strings.ReplaceAll(nowTime, "'", "''"),
		hash,
		strings.ReplaceAll(novel.Information.Source, "'", "''"))

	_, err = db.Exec(queryString)
	if checkError(err) {
		return novel.Information, err
	}
	logger.Println("insert success")
	logger.Println("create chapter table : " + hash)
	queryString = "CREATE TABLE IF NOT EXISTS '" + hash + "' (ChapterName text,ChapterContent text , ChapterUrl text)"
	_, err = db.Exec(queryString)
	if checkError(err) {
		return novel.Information, err
	}
	logger.Println("insert chapter data")
	queryString = "INSERT INTO '" + hash + "' (ChapterName,ChapterContent, ChapterUrl) VALUES "
	for i, value := range novel.Chapters {
		str := "('" + strings.ReplaceAll(value.ChapterName, "'", "''") + "','" + strings.ReplaceAll(value.ChapterContent, "'", "''") + "', '')"
		if i != len(novel.Chapters)-1 {
			str += ","
		}
		queryString += str
	}
	_, err = db.Exec(queryString)
	if checkError(err) {
		return novel.Information, err
	}
	logger.Println("query inserted novel")
	queryString = "SELECT ROWID FROM NovelInformation WHERE MD5=" + "'" + novel.Information.MD5 + "'"
	row := db.QueryRow(queryString)
	err = row.Scan(&novel.Information.ID)
	if checkError(err) {
		return novel.Information, errors.New("query data error")
	}
	return novel.Information, nil
}

func selectNovelsFromTable(condition string) ([]Information, error) {
	var novels []Information
	var queryString = "SELECT ROWID,Author,Brief,Name,CurrentChapter,LastChapter,FileName,LastAccess,CreateTime,MD5,Cover,Detail,Source FROM NovelInformation " + condition
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
			&information.Cover,
			&information.Detail,
			&information.Source)
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
	queryString := "SELECT ChapterName , ChapterContent , ChapterUrl FROM '" + queryMD5 + "'"
	res, err := db.Query(queryString)
	if err != nil {
		return []Chapter{{ChapterName: "error", ChapterContent: "error"}}
	}
	defer res.Close()
	var chapters []Chapter
	for res.Next() {
		var chapter Chapter
		res.Scan(&chapter.ChapterName, &chapter.ChapterContent, &chapter.ChapterUrl)
		chapters = append(chapters, chapter)
	}
	return chapters
}

//addNovelFromInformation add novel from information
func addNovelFromInformation(information Information, chapters []Chapter) (Information, error) {
	logger.Println("func enter : novel.db/addNovelFromInformation")
	defer logger.Println("func exit : novel.db/addNovelFromInformation")
	nowTime := time.Now().Format("2006-01-02 15:04:05")
	information.LastAccess = nowTime
	information.CreateTime = nowTime
	if checkNovelExist(information.FileName) {
		return information, errors.New("novel exist")
	}
	queryString := fmt.Sprintf(
		"INSERT INTO NovelInformation (Author, Brief, Name, FileName,CurrentChapter,LastChapter, LastAccess, CreateTime,MD5,Cover,Detail,Source) VALUES ('%s','%s','%s','%s','%s','%s','%s','%s','%s','%s','%s','%s')",
		strings.ReplaceAll(information.Author, "'", "''"),
		strings.ReplaceAll(information.Brief, "'", "''"),
		strings.ReplaceAll(information.Name, "'", "''"),
		strings.ReplaceAll(information.FileName, "'", "''"),
		strings.ReplaceAll(information.CurrentChapter, "'", "''"),
		strings.ReplaceAll(information.LastChapter, "'", "''"),
		strings.ReplaceAll(nowTime, "'", "''"),
		strings.ReplaceAll(nowTime, "'", "''"),
		information.MD5,
		information.Cover,
		information.Detail,
		information.Source)
	_, err := db.Exec(queryString)
	if checkError(err) {
		return information, err
	}
	queryString = "CREATE TABLE IF NOT EXISTS '" + information.MD5 + "' (ChapterName text,ChapterContent text ,ChapterUrl text)"
	_, err = db.Exec(queryString)
	if checkError(err) {
		return information, err
	}
	queryString = "INSERT INTO '" + information.MD5 + "' (ChapterName,ChapterContent,ChapterUrl) VALUES "
	for i, value := range chapters {
		str := "('" + strings.ReplaceAll(value.ChapterName, "'", "''") + "','" + strings.ReplaceAll(value.ChapterContent, "'", "''") + "' , '" + strings.ReplaceAll(value.ChapterUrl, "'", "''") + "')"
		if i != len(chapters)-1 {
			str += ","
		}
		queryString += str
	}
	_, err = db.Exec(queryString)
	if checkError(err) {
		return information, err
	}
	return information, nil
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

func addImage(rowID int, image string) error {
	logger.Println("func enter : novel/db addImage")
	queryString := fmt.Sprintf("UPDATE 'NovelInformation' SET Cover='%s' WHERE ROWID=%d",
		strings.ReplaceAll(image, "'", "''"),
		rowID,
	)
	_, err := db.Exec(queryString)
	if err != nil {
		logger.Fatalln(err)
		return err
	}
	logger.Println("func exit : novel/db addImage")
	return nil
}

func getDetail(rowID int) (string, error) {
	logger.Println("func enter : novel/db/getDetail")
	defer logger.Println("func exit : novel/db/getDetail")
	queryString := fmt.Sprintf("SELECT Detail FROM NovelInformation WHERE ROWID='%d'", rowID)
	row := db.QueryRow(queryString)
	var result string
	err := row.Scan(&result)
	if checkError(err) {
		return "", err
	}
	return result, nil
}

//getNovel get novel by md5
func getNovel(rowID int) (Information, error) {
	logger.Println("func enter : novel/db/getNovel")
	defer logger.Println("func exit : novel/db/getNovel")
	queryString := fmt.Sprintf("SELECT ROWID,Author,Brief,Name,CurrentChapter,LastChapter,FileName,LastAccess,CreateTime,MD5,Cover,Detail,Source from NovelInformation WHERE ROWID=%d", rowID)
	var information Information
	row := db.QueryRow(queryString)
	err := row.Scan(&information.ID,
		&information.Author,
		&information.Brief,
		&information.Name,
		&information.CurrentChapter,
		&information.LastChapter,
		&information.FileName,
		&information.LastAccess,
		&information.CreateTime,
		&information.MD5,
		&information.Cover,
		&information.Detail,
		&information.Source)
	if checkError(err) {
		return Information{}, err
	}
	return information, err
}

//updateChapters update chapters
func updateChapters(rowID int, chapters []Chapter) error {
	queryString := fmt.Sprintf("SELECT MD5 FROM NovelInformation WHERE ROWID='%d'", rowID)
	row := db.QueryRow(queryString)
	if checkError(row.Err()) {
		return row.Err()
	}
	var md5 string
	err := row.Scan(&md5)
	if checkError(err) {
		return err
	}
	queryString = fmt.Sprintf("DELETE FROM '%s' WHERE TRUE", md5)
	_, err = db.Exec(queryString)
	if checkError(err) {
		return err
	}
	queryString = "INSERT INTO '" + md5 + "' (ChapterName,ChapterContent,ChapterUrl) VALUES "
	for i, value := range chapters {
		str := "('" + strings.ReplaceAll(value.ChapterName, "'", "''") + "','" + strings.ReplaceAll(value.ChapterContent, "'", "''") + "' , '" + strings.ReplaceAll(value.ChapterUrl, "'", "''") + "')"
		if i != len(chapters)-1 {
			str += ","
		}
		queryString += str
	}
	_, err = db.Exec(queryString)
	if checkError(err) {
		return err
	}
	queryString = fmt.Sprintf("UPDATE 'NovelInformation' SET LastChapter='%s' WHERE ROWID='%d'", chapters[len(chapters)-1].ChapterName, rowID)
	_, err = db.Exec(queryString)
	if checkError(err) {
		return err
	}
	return nil
}
