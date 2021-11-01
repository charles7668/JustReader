package Scraper

import (
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
	"strings"
)

type Novel struct {
	Title string `json:"title"`
	Cover string `json:"cover"`
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
}

type SearchRule struct {
	Cover               SearchSelector `json:"cover"`
	SearchList          string         `json:"search_list"`
	NovelName           SearchSelector `json:"novel_name"`
	NovelInformationURL SearchSelector `json:"novel_information_url"`
}

type Rule struct {
	SourceURL  string       `json:"source_url"`
	SourceName string       `json:"source_name"`
	Request    Request      `json:"request"`
	SearchRule []SearchRule `json:"search_rule"`
}

var logger *log.Logger

func Init(initLogger *log.Logger) {
	logger = initLogger
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
func SearchCover(searchTitle string) []string {
	rules := getRules()
	var novelResults []Novel
	for _, rule := range rules {
		novels := parseByRule(&rule, searchTitle)
		novelResults = append(novelResults, novels...)
	}
	var returnValue []string
	for _, novel := range novelResults {
		returnValue = append(returnValue, novel.Cover)
	}
	return returnValue
}

//parseByRule using rule to parse html
func parseByRule(rule *Rule, searchTitle string) []Novel {
	var novelResults []Novel
	keyword := map[string]*string{"{page}": nil, "{searchKey}": nil}
	keyword["{searchKey}"] = &searchTitle
	page := 0
	previousPageItem := ""
	hasPageParam := false
	var results []string
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
		var list []string
		elements.Each(func(i int, s *goquery.Selection) {
			searchRule := rule.SearchRule[0].NovelInformationURL
			information := s.Find(searchRule.Selector)
			if information.Length() > 0 {
				var converted string
				if searchRule.Attribute != "" {
					var exist bool
					converted, exist = information.Attr(searchRule.Attribute)
					if !exist {
						converted = ""
					}
				} else {
					converted = string(encoding.ConvertBytesToEncoding([]byte(information.Text()), "GBK"))
				}
				if converted == "" {
					converted = informationUrl
				}
				converted = urlComplete(rule.SourceURL, converted)
				list = append(list, converted)
			} else {
				list = append(list, informationUrl)
			}
		})
		if len(list) >= 1 {
			if list[0] == previousPageItem {
				break
			}
		} else {
			break
		}
		previousPageItem = list[0]
		results = append(results, list...)
		if !hasPageParam {
			break
		}
	}
	for _, infoUrl := range results {
		res, err := http.Get(infoUrl)
		if checkError(err) {
			continue
		}
		doc, err := goquery.NewDocumentFromReader(res.Body)
		var result Novel
		//title name
		parseRule := rule.SearchRule[0].NovelName
		element := doc.Find(parseRule.Selector)
		if element.Length() > 0 {
			if parseRule.Attribute != "" {
				attr, exist := element.Attr(parseRule.Attribute)
				if exist {
					result.Title = attr
				}
			} else {
				result.Title = element.First().Text()
			}
		}
		//cover
		parseRule = rule.SearchRule[0].Cover
		element = doc.Find(parseRule.Selector)
		if element.Length() > 0 {
			cover := ""
			if parseRule.Attribute != "" {
				attr, exist := element.Attr(parseRule.Attribute)
				if exist {
					cover = attr
				}
			} else {
				cover = element.First().Text()
			}
			cover = urlComplete(rule.SourceURL, cover)
			result.Cover = cover
		}
		novelResults = append(novelResults, result)
		responseBodyClose(res.Body)
	}
	return novelResults
}

//urlComplete complete url
func urlComplete(source string, destination string) string {
	var result string
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
