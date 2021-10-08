package encoding

import (
	"io/ioutil"
	"os"

	"github.com/gogs/chardet"
	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/encoding/unicode"
	"golang.org/x/text/transform"
)

//ReadFileByEncoding read file by encoding
func ReadFileByEncoding(path string, charset string) string {
	file, err := os.Open(path)
	if err != nil {
		return ""
	}
	defer file.Close()
	decoder := unicode.UTF8.NewDecoder().Transformer
	switch charset {
	case "GB18030":
		decoder = simplifiedchinese.GB18030.NewDecoder()
	case "UTF-16LE":
		decoder = unicode.BOMOverride(unicode.UTF16(unicode.LittleEndian, unicode.IgnoreBOM).NewDecoder())
	default:
	}
	reader := transform.NewReader(file, decoder)
	read, _ := ioutil.ReadAll(reader)
	return string(read)
}

//GetDecoder get decoder
func GetDecoder(charset string) transform.Transformer {
	decoder := unicode.UTF8.NewDecoder().Transformer
	switch charset {
	case "GB18030":
		decoder = simplifiedchinese.GB18030.NewDecoder()
	case "UTF-16LE":
		decoder = unicode.BOMOverride(unicode.UTF16(unicode.LittleEndian, unicode.IgnoreBOM).NewDecoder())
	default:
	}
	return decoder
}

//DetectEncoding detect encoding and return encoding string
func DetectEncoding(input []byte) string {
	detector := chardet.NewTextDetector()
	result, err := detector.DetectBest(input)
	if err != nil {
		return "unknown"
	}
	return result.Charset
}
