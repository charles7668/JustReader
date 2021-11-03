package Scraper

import (
	"encoding/base64"
	"encoding/json"
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
	Selector  string `json:"selector"`
	Attribute string `json:"attribute"`
	Regex     string `json:"regex"`
}

type SearchRule struct {
	Cover                    SearchSelector `json:"cover"`
	SearchList               string         `json:"search_list"`
	SearchListTitle          SearchSelector `json:"search_list_title"`
	SearchListAuthor         SearchSelector `json:"search_list_author"`
	SearchListInformationUrl SearchSelector `json:"search_list_information_url"`
	NovelName                SearchSelector `json:"novel_name"`
	NovelAuthor              SearchSelector `json:"novel_author"`
}

type Rule struct {
	SourceURL  string       `json:"source_url"`
	SourceName string       `json:"source_name"`
	Request    Request      `json:"request"`
	SearchRule []SearchRule `json:"search_rule"`
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
					rules = append(rules, rule)
				}
			}
		}
	}
	return rules
}

//SearchCover search cover from site
func SearchCover(searchTitle string) {
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
		novels = getNovelInformation(novels, rule)
		novelResults.Mutex.Lock()
		novelResults.Novels = append(novelResults.Novels, novels...)
		novelResults.Mutex.Unlock()
	}
	status.mutex.Lock()
	status.runningState = ReadyToGet
	status.mutex.Unlock()
	fmt.Println("test")
	//jsonString, err := json.MarshalIndent(novelResults.Novels, "", "  ")
	//if !checkError(err) {
	//	ioutil.WriteFile("test.json", []byte(jsonString), 0666)
	//}
	//var returnValue []string
	//for _, novel := range novelResults.Novels {
	//	returnValue = append(returnValue, novel.Cover)
	//}
	//return returnValue
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
			novel.Title = converted
			//get author
			searchRule = rule.SearchRule[0].SearchListAuthor
			result, exist = getTextBySelector(s, searchRule)
			converted = string(encoding.ConvertBytesToEncoding([]byte(result), rule.Request.CharSet))
			novel.Author = converted
			list = append(list, novel)
		})
		if len(list) >= 1 {
			if list[0].InformationUrl == previousPageItem {
				break
			}
		} else {
			break
		}
		previousPageItem = list[0].InformationUrl
		if !hasPageParam {
			break
		}
	}
	return list
}

func getNovelInformation(novelList []Novel, rule Rule) []Novel {
	for index, novel := range novelList {
		res, err := http.Get(novel.InformationUrl)
		if checkError(err) {
			continue
		}
		doc, err := goquery.NewDocumentFromReader(res.Body)
		//title name
		parseRule := rule.SearchRule[0].NovelName
		element := doc.Find("html")
		result, _ := getTextBySelector(element, parseRule)
		converted := string(encoding.ConvertBytesToEncoding([]byte(result), rule.Request.CharSet))
		converted = matchString(converted, parseRule.Regex)
		novelList[index].Title = converted
		//author name
		parseRule = rule.SearchRule[0].NovelAuthor
		result, exist := getTextBySelector(element, parseRule)
		converted = string(encoding.ConvertBytesToEncoding([]byte(result), rule.Request.CharSet))
		converted = matchString(converted, parseRule.Regex)
		novelList[index].Author = converted
		//cover
		converted = ""
		parseRule = rule.SearchRule[0].Cover
		result, exist = getTextBySelector(element, parseRule)
		if exist {
			converted = urlComplete(rule.SourceURL, result)
		}
		novelList[index].Cover = converted
		//source name
		novelList[index].SourceName = rule.SourceName
		responseBodyClose(res.Body)
	}
	return novelList
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
			result = element.First().Text()
		}
		return result, true
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
