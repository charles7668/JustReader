package novel

import (
	"bufio"
	"crypto/md5"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"github.com/charles7668/novel-reader/services/encoding"
	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/text/transform"
	"log"
	"os"
	"sort"
	"strings"
	"time"
)

type Information struct {
	ID             int32  `json:"id"`
	Author         string `json:"author"`
	Brief          string `json:"brief"`
	Name           string `json:"name"`
	FileName       string `json:"file_name"`
	CurrentChapter string `json:"current_chapter"`
	LastChapter    string `json:"last_chapter"`
	CreateTime     string `json:"create_time"`
	LastAccess     string `json:"last_access"`
	MD5            string `json:"md5"`
	Cover          string `json:"cover"`
	Detail         string `json:"detail"`
}

type Chapter struct {
	ChapterName    string `json:"chapter_name"`
	ChapterContent string `json:"chapter_content"`
	ChapterUrl     string `json:"chapter_url"`
}

type Novel struct {
	Information Information
	Chapters    []Chapter
}
type InitStructure struct {
	DBHandle *sql.DB
	Logger   *log.Logger
}

var db *sql.DB
var logger *log.Logger

func Init(initStructure InitStructure) {
	db = initStructure.DBHandle
	logger = initStructure.Logger
}

//readSomeText read some text from file
func readSomeText(path string, lineCount int32) ([]byte, error) {
	file, err := os.Open(path)
	if err != nil {
		return []byte{}, err
	}
	defer closeFile(file)
	scanner := bufio.NewScanner(file)
	var counter int32 = 0
	var result []byte
	for scanner.Scan() {
		result = append(result, []byte(scanner.Text())...)
		counter++
		if counter >= lineCount {
			break
		}
	}
	return result, nil
}

//GetNovelList get novel list from dir
func GetNovelList() ([]Information, error) {
	novels, err := getNovels()
	sort.Slice(novels, func(i, j int) bool {
		time1, _ := time.Parse("2006-01-02 15:04:05", novels[i].LastAccess)
		time2, _ := time.Parse("2006-01-02 15:04:05", novels[j].LastAccess)
		return time2.Sub(time1) <= 0
	})
	return novels, err
}

//getNovelInformation get novel information from file
func getNovelInformation(path string) (Novel, error) {
	var novelInformation Information
	read, _ := readSomeText(path, 20)
	charSet := encoding.DetectEncoding(read)
	file, err := os.Open(path)
	if err != nil {
		return Novel{Information: novelInformation, Chapters: []Chapter{}}, err
	}
	defer closeFile(file)
	novelInformation.FileName = path
	reader := transform.NewReader(file, encoding.GetDecoder(charSet))
	scanner := bufio.NewScanner(reader)
	breakKeywords := "第"
	contentPrefix := "　　"
	changeLine := []string{"\r\n", "\n"}
	splitKeyword := []string{":", "：", ": "}
	keywordMap := make(map[string]*string)
	keywordMap["作者"] = &novelInformation.Author
	keywordMap["内容简介"] = &novelInformation.Brief
	keywordMap["title"] = &novelInformation.Name
	counter := 0
	var docsKeyword string
	isDocsEnd := false
	content := ""
	startContent := false
	chapterStart := false
	var chapters []Chapter
	var contentKeyword string
	for scanner.Scan() {
		counter++
		s := scanner.Text()
		if counter == 1 {
			docsKeyword = s
		} else if strings.HasPrefix(s, docsKeyword) && !isDocsEnd {
			isDocsEnd = true
		} else if isDocsEnd {
			if isDocsEnd && strings.HasPrefix(s, docsKeyword) {
				break
			}
			if !strings.HasPrefix(s, contentPrefix) {
				if startContent {
					if chapterStart {
						chapters = append(chapters, Chapter{ChapterName: contentKeyword, ChapterContent: content})
					} else {
						keyword, ok := keywordMap[contentKeyword]
						if ok {
							*keyword = content
						}
					}
					content = ""
					startContent = false
				}
				var split []string
				index := 0
				for i, key := range splitKeyword {
					split = strings.Split(s, key)
					if len(split) >= 2 {
						index = i
						break
					}
				}
				if len(split) >= 2 {
					contentKeyword = split[0]
					content = split[1]
					for i := 2; i < len(split); i++ {
						content += splitKeyword[index] + split[i]
					}
					content = strings.Trim(content, " ")
					startContent = true
				} else {
					if strings.HasPrefix(s, breakKeywords) {
						chapterStart = true
						contentKeyword = s
						startContent = true
					}
					if s != "" && !chapterStart {
						*keywordMap["title"] = s
					}
				}
			} else {
				content += s[:] + changeLine[0]
			}
		}
	}
	chapters = append(chapters, Chapter{ChapterName: contentKeyword, ChapterContent: content})
	novelInformation.CurrentChapter = "未讀"
	novelInformation.LastChapter = chapters[len(chapters)-1].ChapterName
	checkSum := md5.Sum([]byte(novelInformation.FileName))
	novelInformation.MD5 = hex.EncodeToString(checkSum[:])
	return Novel{Information: novelInformation, Chapters: chapters}, nil
}

//CheckNovelExist check novel is exits
func CheckNovelExist(fileName string) bool {
	return checkNovelExist(fileName)
}

//AddNovelFromFile add novel
func AddNovelFromFile(fileName string) (Information, error) {
	return addNovelFromFile(fileName)
}

//AddNovelFromInformation add novel from information
func AddNovelFromInformation(novel Information, chapters []Chapter) (Information, error) {
	logger.Println("func enter : novel/AddNovelFromInformation")
	defer logger.Println("func exit : novel/AddNovelFromInformation")
	return addNovelFromInformation(novel, chapters)
}

//GetChapters get chapter data
func GetChapters(md5 string) []Chapter {
	return getChapters(md5)
}

//GetNovel get novel by row id
func GetNovel(rowID int) (Information, error) {
	return getNovel(rowID)
}

//UpdateAccessTime time string
func UpdateAccessTime(rowID int) (string, error) {
	result := updateAccessTime(rowID)
	if result == "fail" {
		return "fail", errors.New("fail")
	}
	return result, nil
}

//UpdateReading update reading progress
func UpdateReading(information Information) error {
	result := updateReading(information)
	if result == "fail" {
		return errors.New("db operation error")
	}
	return nil
}

//DeleteNovel delete novel
func DeleteNovel(rowID int) error {
	return deleteNovel(rowID)
}

//AddImage add image by row id , image must convert to base64 encoding
func AddImage(rowID int, image string) error {
	return addImage(rowID, image)
}

//checkError handle error
func checkError(err error) bool {
	if err != nil {
		fmt.Println(err)
		return true
	}
	return false
}

//closeFile close file with error handle
func closeFile(file *os.File) {
	err := file.Close()
	checkError(err)
}
