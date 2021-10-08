package novel

import (
	"bufio"
	"crypto/md5"
	"database/sql"
	"encoding/hex"
	"github.com/charles7668/novel-reader/services/encoding"
	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/text/transform"
	"log"
	"os"
	"strings"
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
	Cover          []byte `json:"cover"`
}

type Chapter struct {
	ChapterName    string `json:"chapter_name"`
	ChapterContent string `json:"chapter_content"`
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
	defer file.Close()
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
	novels, err := GetNovels()
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
	defer file.Close()
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
						content = ""
					} else {
						keyword, ok := keywordMap[contentKeyword]
						if ok {
							*keyword = content
						}
					}
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
				content += s[len(contentPrefix):] + changeLine[0]
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
