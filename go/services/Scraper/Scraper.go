package Scraper

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/PuerkitoBio/goquery"
	"github.com/charles7668/novel-reader/services/encoding"
	"io"
	"io/fs"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"path"
	"regexp"
	"strings"
	"sync"
)

type Novel struct {
	RuleName       string `json:"rule_name"`
	Title          string `json:"title"`
	Author         string `json:"author"`
	Brief          string `json:"brief"`
	Cover          string `json:"cover"`
	SourceName     string `json:"source_name"`
	InformationUrl string `json:"information_url"`
	IndexUrl       string `json:"index_url"`
}

type SearchOption struct {
	SearchKey string `json:"search_key"`
}

type Request struct {
	URL     string            `json:"url"`
	Method  string            `json:"method"`
	Header  map[string]string `json:"header"`
	Body    map[string]string `json:"body"`
	CharSet string            `json:"charset"`
}

type SearchSelector struct {
	Selector     string `json:"selector"`
	Attribute    string `json:"attribute"`
	Regex        string `json:"regex"`
	UrlParam     string `json:"url_param"`
	Content      string `json:"content"`
	ContentRegex string `json:"content_regex"`
}

type SearchRule struct {
	SearchList               string         `json:"search_list"`
	SearchListTitle          SearchSelector `json:"search_list_title"`
	SearchListAuthor         SearchSelector `json:"search_list_author"`
	SearchListInformationUrl SearchSelector `json:"search_list_information_url"`
	NovelName                SearchSelector `json:"novel_name"`
	NovelAuthor              SearchSelector `json:"novel_author"`
	NovelBrief               SearchSelector `json:"novel_brief"`
	NovelIndex               SearchSelector `json:"novel_index"`
	NovelCover               SearchSelector `json:"novel_cover"`
	NovelIndexChapterName    SearchSelector `json:"novel_index_chapter_name"`
	NovelIndexChapterUrl     SearchSelector `json:"novel_index_chapter_url"`
	NovelContent             SearchSelector `json:"novel_content"`
	NovelIndexLastChapter    SearchSelector `json:"novel_index_last_chapter"`
}

type Rule struct {
	Enable     bool         `json:"enable"`
	RuleName   string       `json:"rule_name"`
	SourceURL  string       `json:"source_url"`
	SourceName string       `json:"source_name"`
	Request    Request      `json:"request"`
	SearchRule []SearchRule `json:"search_rule"`
}

type Chapter struct {
	ChapterName    string `json:"chapter_name"`
	ChapterUrl     string `json:"chapter_url"`
	ChapterContent string `json:"chapter_content"`
}

type SafeNovels struct {
	Novels []Novel
	Mutex  sync.Mutex
}

var logger *log.Logger

type Status int

const (
	Ready = iota
	Processing
	Stopping
	ReadyToGet
)

type safeStatus struct {
	runningState Status
	mutex        sync.Mutex
}

var status safeStatus
var novelResults SafeNovels

func Init(initLogger *log.Logger) {
	logger = initLogger
}

//GetStatus	get current status
func GetStatus() Status {
	return status.runningState
}

//StopProcessing stop processing
func StopProcessing() {
	status.mutex.Lock()
	status.runningState = Stopping
	status.mutex.Unlock()
}

//getRules get rules from scraper/*.rule.json file
func getRules() []Rule {
	_, err := os.Stat("scraper")
	var dirInfo []fs.FileInfo
	if !os.IsNotExist(err) {
		dirInfo, err = ioutil.ReadDir("scraper")
		if checkError(err) {
			return []Rule{}
		}
	}
	var rules []Rule
	for _, info := range dirInfo {
		if !info.IsDir() {
			if path.Ext(info.Name()) == ".json" {
				trim := strings.TrimSuffix(info.Name(), ".json")
				if path.Ext(trim) == ".rule" {
					read, err := ioutil.ReadFile("scraper/" + info.Name())
					if checkError(err) {
						continue
					}
					var rule Rule
					err = json.Unmarshal(read, &rule)
					if checkError(err) {
						continue
					}
					rule.RuleName = strings.TrimSuffix(trim, ".rule")
					if rule.Enable {
						rules = append(rules, rule)
					}
				}
			}
		}
	}
	return rules
}

//getRule get rule from scraper/*.rule.json file
func getRule(ruleName string) Rule {
	_, err := os.Stat("scraper")
	var dirInfo []fs.FileInfo
	if !os.IsNotExist(err) {
		dirInfo, err = ioutil.ReadDir("scraper")
		if checkError(err) {
			return Rule{}
		}
	}
	for _, info := range dirInfo {
		if !info.IsDir() {
			if path.Ext(info.Name()) == ".json" {
				trim := strings.TrimSuffix(info.Name(), ".json")
				if path.Ext(trim) == ".rule" {
					read, err := ioutil.ReadFile("scraper/" + info.Name())
					if checkError(err) {
						continue
					}
					var rule Rule
					err = json.Unmarshal(read, &rule)
					if checkError(err) {
						continue
					}
					rule.RuleName = strings.TrimSuffix(trim, ".rule")
					if rule.RuleName == ruleName {
						return rule
					}
				}
			}
		}
	}
	return Rule{}
}

//SearchCover search cover from site
func SearchCover(searchTitle string) {
	if status.runningState != Ready {
		return
	}
	status.mutex.Lock()
	status.runningState = Processing
	status.mutex.Unlock()
	novelResults.Mutex.Lock()
	novelResults.Novels = nil
	novelResults.Mutex.Unlock()
	rules := getRules()
	for _, rule := range rules {
		if status.runningState == Stopping {
			break
		}
		novels := getNovelListByRule(&rule, searchTitle)
		novels = getNovelsInformation(novels, rule)
		novelResults.Mutex.Lock()
		novelResults.Novels = append(novelResults.Novels, novels...)
		novelResults.Mutex.Unlock()
	}
	status.mutex.Lock()
	if status.runningState == Stopping {
		status.runningState = Ready
	} else {
		status.runningState = ReadyToGet
	}
	status.mutex.Unlock()
}

func SearchNovel(searchKey string) {
	if status.runningState != Ready {
		return
	}
	status.mutex.Lock()
	status.runningState = Processing
	status.mutex.Unlock()
	novelResults.Mutex.Lock()
	novelResults.Novels = nil
	novelResults.Mutex.Unlock()
	rules := getRules()
	for _, rule := range rules {
		if status.runningState == Stopping {
			break
		}
		novels := getNovelListByRule(&rule, searchKey)
		novels = getNovelsInformation(novels, rule)
		novelResults.Mutex.Lock()
		novelResults.Novels = append(novelResults.Novels, novels...)
		novelResults.Mutex.Unlock()
	}
	status.mutex.Lock()
	if status.runningState == Stopping {
		status.runningState = Ready
	} else {
		status.runningState = ReadyToGet
	}
	status.mutex.Unlock()
}

func GetSearchList() []Novel {
	novelResults.Mutex.Lock()
	result := novelResults.Novels
	novelResults.Novels = nil
	if status.runningState == ReadyToGet {
		status.mutex.Lock()
		status.runningState = Ready
		status.mutex.Unlock()
	}
	novelResults.Mutex.Unlock()
	return result
}

func GetCoverList() []string {
	novelResults.Mutex.Lock()
	novels := novelResults.Novels
	novelResults.Novels = nil
	if status.runningState == ReadyToGet {
		status.mutex.Lock()
		status.runningState = Ready
		status.mutex.Unlock()
	}
	novelResults.Mutex.Unlock()
	var result []string
	for _, novel := range novels {
		result = append(result, novel.Cover)
	}
	return result
}

//getNovelListByRule using rule to parse html
func getNovelListByRule(rule *Rule, searchTitle string) []Novel {
	logger.Println("func enter : Scraper/getNovelListByRule")
	defer logger.Println("func exit : Scraper/getNovelListByRule")
	keyword := map[string]*string{"{page}": nil, "{searchKey}": nil}
	keyword["{searchKey}"] = &searchTitle
	page := 0
	previousPageItem := ""
	hasPageParam := false
	var list []Novel
	for {
		page += 1
		pageString := fmt.Sprintf("%d", page)
		keyword["{page}"] = &pageString
		requestBody := url.Values{}
		for key, value := range rule.Request.Body {
			converted := encoding.ConvertUTF8ToEncoding(value, rule.Request.CharSet)
			keyValue, ok := keyword[value]
			if ok {
				if value == "{page}" {
					hasPageParam = true
				}
				converted = encoding.ConvertUTF8ToEncoding(*keyValue, rule.Request.CharSet)
			}
			requestBody.Add(key, converted)
		}
		var req *http.Request
		if rule.Request.Method == "GET" {
			var err error
			req, err = http.NewRequest(rule.Request.Method, rule.Request.URL, nil)
			if checkError(err) {
				continue
			}
			req.URL.RawQuery = requestBody.Encode()
		} else {
			var err error
			req, err = http.NewRequest(rule.Request.Method, rule.Request.URL, strings.NewReader(requestBody.Encode()))
			if checkError(err) {
				continue
			}
		}
		for key, value := range rule.Request.Header {
			req.Header.Add(key, value)
		}
		client := http.Client{}
		res, err := client.Do(req)
		if checkError(err) {
			continue
		}
		doc, err := goquery.NewDocumentFromReader(res.Body)
		if checkError(err) {
			continue
		}
		informationUrl := res.Request.URL.String()
		responseBodyClose(res.Body)
		//get list
		elements := doc.Find(rule.SearchRule[0].SearchList)
		//get information page url
		var tempList []Novel
		elements.Each(func(i int, s *goquery.Selection) {
			var novel Novel
			searchRule := rule.SearchRule[0].SearchListInformationUrl
			//get information url
			result, exist := getTextBySelector(s, searchRule)
			var converted string
			if !exist {
				converted = informationUrl
			} else {
				converted = string(encoding.ConvertBytesToEncoding([]byte(result), rule.Request.CharSet))
			}
			converted = urlComplete(rule.SourceURL, converted)
			novel.InformationUrl = converted
			//get title
			searchRule = rule.SearchRule[0].SearchListTitle
			result, exist = getTextBySelector(s, searchRule)
			converted = string(encoding.ConvertBytesToEncoding([]byte(result), rule.Request.CharSet))
			converted = matchString(converted, searchRule.Regex)
			novel.Title = converted
			//get author
			searchRule = rule.SearchRule[0].SearchListAuthor
			result, exist = getTextBySelector(s, searchRule)
			converted = string(encoding.ConvertBytesToEncoding([]byte(result), rule.Request.CharSet))
			converted = matchString(converted, searchRule.Regex)
			novel.Author = converted
			//source name
			novel.SourceName = rule.SourceName
			//rule name
			novel.RuleName = rule.RuleName
			tempList = append(tempList, novel)
		})
		if len(tempList) >= 1 {
			if tempList[0].InformationUrl == previousPageItem {
				break
			}
		} else {
			break
		}
		previousPageItem = tempList[0].InformationUrl
		list = append(list, tempList...)
		if !hasPageParam {
			break
		}
	}
	return list
}

func getNovelsInformation(novelList []Novel, rule Rule) []Novel {
	type empty struct {
	}
	sem := make(chan empty, len(novelList))
	for index, novel := range novelList {
		go func(index int, novel Novel, novelList []Novel) {
			res, err := http.Get(novel.InformationUrl)
			if checkError(err) {
				sem <- empty{}
				return
			}
			doc, err := goquery.NewDocumentFromReader(res.Body)
			element := doc.Find("html")
			//title name
			parseRule := rule.SearchRule[0].NovelName
			if parseRule.Selector != "" {
				result, _ := getTextBySelector(element, parseRule)
				converted := string(encoding.ConvertBytesToEncoding([]byte(result), rule.Request.CharSet))
				converted = matchString(converted, parseRule.Regex)
				novelList[index].Title = converted
			}
			//author name
			parseRule = rule.SearchRule[0].NovelAuthor
			if parseRule.Selector != "" {
				result, _ := getTextBySelector(element, parseRule)
				converted := string(encoding.ConvertBytesToEncoding([]byte(result), rule.Request.CharSet))
				converted = matchString(converted, parseRule.Regex)
				novelList[index].Author = converted
			}
			//brief
			parseRule = rule.SearchRule[0].NovelBrief
			if parseRule.Selector != "" {
				result, _ := getTextBySelector(element, parseRule)
				converted := string(encoding.ConvertBytesToEncoding([]byte(result), rule.Request.CharSet))
				converted = matchString(converted, parseRule.Regex)
				novelList[index].Brief = converted
			}
			//cover
			parseRule = rule.SearchRule[0].NovelCover
			if parseRule.Selector != "" {
				result, exist := getTextBySelector(element, parseRule)
				var converted string
				if exist {
					converted = urlComplete(rule.SourceURL, result)
				}
				novelList[index].Cover = converted
			}
			//index url
			parseRule = rule.SearchRule[0].NovelIndex
			if parseRule.Selector != "" {
				result, exist := getTextBySelector(element, parseRule)
				var converted string
				if exist {
					converted = urlComplete(rule.SourceURL, result)
				}
				novelList[index].IndexUrl = converted
			}
			responseBodyClose(res.Body)
			sem <- empty{}
		}(index, novel, novelList)
	}
	// wait for goroutines to finish
	for i := 0; i < len(novelList); i++ {
		<-sem
	}
	return novelList
}

//GetNovelInformation get novel information
func GetNovelInformation(novel Novel) Novel {
	logger.Println("func enter : Scraper/GetNovelInformation")
	defer logger.Println("func exit : Scraper/GetNovelInformation")
	rules := getRules()
	result := novel
	for _, rule := range rules {
		if rule.RuleName == novel.RuleName {
			novels := getNovelsInformation([]Novel{novel}, rule)
			result = novels[0]
			break
		}
	}
	return result
}

func GetNovelChapters(novel Novel) []Chapter {
	logger.Println("func enter : Scraper/GetNovelChapters")
	defer logger.Println("func exit : Scraper/GetNovelChapters")
	if novel.IndexUrl == "" {
		novel = GetNovelInformation(novel)
	}
	rules := getRules()
	var result []Chapter
	for _, rule := range rules {
		if rule.RuleName == novel.RuleName {
			result = getNovelChapters(novel, rule)
		}
	}
	return result
}

func GetNovelChapter(chapter Chapter, detail string) (Chapter, error) {
	logger.Println("func enter : Scraper/GetNovelChapter")
	defer logger.Println("func exit : Scraper/GetNovelChapter")
	if chapter.ChapterUrl == "" {
		return chapter, errors.New("chapter url not is empty")
	}
	var novel Novel
	err := json.Unmarshal([]byte(detail), &novel)
	if checkError(err) {
		return chapter, err
	} else if novel.RuleName == "" {
		return chapter, errors.New("rule name is empty")
	}
	rule := getRule(novel.RuleName)
	res, err := http.Get(chapter.ChapterUrl)
	if checkError(err) {
		return chapter, err
	}
	doc, err := goquery.NewDocumentFromReader(res.Body)
	if checkError(err) {
		return chapter, err
	}
	html := doc.Find("html")
	defer responseBodyClose(res.Body)
	element := html.Find(rule.SearchRule[0].NovelContent.Selector)
	var text string
	if element.Length() < 1 {
		return chapter, errors.New("could not get content")
	}
	element.Each(func(i int, s *goquery.Selection) {
		temp, exist := getTextBySelector(s, rule.SearchRule[0].NovelContent)
		if exist {
			converted := string(encoding.ConvertBytesToEncoding(encoding.ConvertBytesToEncoding([]byte(temp), rule.Request.CharSet), "UTF-8"))
			regex, err := regexp.Compile("^[\n ]*")
			if !checkError(err) {
				converted = regex.ReplaceAllString(converted, "")
			}
			regex, err = regexp.Compile("[\n ]*$")
			if !checkError(err) {
				converted = regex.ReplaceAllString(converted, "")
			}
			text += converted + "\n"
		}
	})
	chapter.ChapterContent = text
	return chapter, nil
}

func getNovelChapters(novel Novel, rule Rule) []Chapter {
	logger.Println("func enter : Scraper/getNovelChapters")
	defer logger.Println("func exit : Scraper/getNovelChapters")
	var result []Chapter
	res, err := http.Get(novel.IndexUrl)
	if checkError(err) {
		return result
	}
	doc, err := goquery.NewDocumentFromReader(res.Body)
	defer responseBodyClose(res.Body)
	if checkError(err) {
		return result
	}
	parseRule := rule.SearchRule[0].NovelIndexChapterName
	element := doc.Find(parseRule.Selector)
	element.Each(func(i int, s *goquery.Selection) {
		var chapter Chapter
		text, exist := getTextBySelector(s, parseRule)
		var converted string
		if exist {
			converted = string(encoding.ConvertBytesToEncoding([]byte(text), rule.Request.CharSet))
			converted = matchString(converted, parseRule.Regex)
		}
		chapter.ChapterName = converted
		result = append(result, chapter)
	})
	parseRule = rule.SearchRule[0].NovelIndexChapterUrl
	element = doc.Find(parseRule.Selector)
	element.Each(func(i int, s *goquery.Selection) {
		if i < len(result) {
			var converted string
			text, exist := getTextBySelector(s, parseRule)
			if exist {
				if strings.HasPrefix(text, "/") {
					converted = urlComplete(rule.SourceURL, text)
				} else {
					converted = urlComplete(novel.IndexUrl, text)
				}
			}
			result[i].ChapterUrl = converted
		}
	})
	return result
}

func getTextBySelector(selection *goquery.Selection, searchSelector SearchSelector) (string, bool) {
	element := selection.Find(searchSelector.Selector)
	var result string
	if element.Length() > 0 {
		if searchSelector.Attribute != "" {
			var exist bool
			result, exist = element.Attr(searchSelector.Attribute)
			if !exist {
				result = ""
				return result, false
			}
		} else {
			result = element.Text()
			result = strings.ReplaceAll(result, "\xc2\xa0", "") + "\n"
		}
		return result, true
	} else {
		if len(selection.Nodes) == 1 {
			if searchSelector.Attribute != "" {
				var exist bool
				result, exist = selection.Attr(searchSelector.Attribute)
				if !exist {
					result = ""
					return result, false
				} else {
					return result, true
				}
			}
			if searchSelector.Content != "" {
				result = ""
				selection.Contents().Each(func(i int, s *goquery.Selection) {
					if goquery.NodeName(s) == searchSelector.Content {
						temp := s.Text()
						temp = strings.ReplaceAll(temp, "\xc2\xa0", "") + "\n"
						result += temp
					}
				})
				return result, true
			}
			temp := selection.Text()
			temp = strings.ReplaceAll(temp, "\xc2\xa0", "") + "\n"
			return selection.Text(), true
		}
	}
	return "", false
}

func matchString(input string, regex string) string {
	result := input
	if regex != "" {
		reg, err := regexp.Compile(regex)
		if !checkError(err) {
			matches := reg.FindAllStringSubmatch(input, -1)
			if len(matches) > 0 {
				if len(matches[0]) > 1 {
					result = matches[0][1]
				}
			}
		}
	}
	return result
}

//GetImageFromURLToBase64 get image form url convert to base64 string
func GetImageFromURLToBase64(url string) string {
	logger.Println("func enter : Scraper/GetImageFromURLToBase64")
	defer logger.Println("func exit : Scraper/GetImageFromURLToBase64")
	res, err := http.Get(url)
	if checkError(err) {
		return ""
	}
	s, _ := ioutil.ReadAll(res.Body)
	encodingToString := base64.StdEncoding.EncodeToString(s)
	return encodingToString
}

//urlComplete complete url
func urlComplete(source string, destination string) string {
	var result string
	result = destination
	if strings.HasPrefix(destination, "//") {
		result = strings.Split(source, "//")[0] + destination
	} else if strings.HasPrefix(destination, "/") {
		result = strings.TrimSuffix(source, "/") + destination
	} else if !strings.HasPrefix(destination, "http") {
		result = strings.TrimSuffix(source, "/") + "/" + destination
	}
	result = strings.ReplaceAll(result, "\n", "")
	result = strings.ReplaceAll(result, " ", "")
	result = strings.ReplaceAll(result, "\t", "")
	return result
}

//checkError handle error and return true if error exist
func checkError(err error) bool {
	if err != nil {
		logger.Println(err)
		return true
	}
	return false
}

//responseBodyClose close response body reader
func responseBodyClose(body io.ReadCloser) {
	err := body.Close()
	checkError(err)
}
