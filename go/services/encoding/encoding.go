package encoding

import (
	"bytes"
	"io/ioutil"
	"os"
	"strings"

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

//ConvertBytesToEncoding convert bytes to indicate encoding
func ConvertBytesToEncoding(input []byte, charset string) []byte {
	decoder := GetDecoder(strings.ToUpper(charset))
	reader := transform.NewReader(bytes.NewReader(input), decoder)
	converted, _ := ioutil.ReadAll(reader)
	return converted
}

//ConvertUTF8ToEncoding convert utf8 to encoding
func ConvertUTF8ToEncoding(utf8 string, charset string) string {
	result, _, _ := transform.String(GetEncoder(strings.ToUpper(charset)), utf8)
	return result
}

//GetEncoder get encoder
func GetEncoder(charset string) transform.Transformer {
	encoder := unicode.UTF8.NewEncoder().Transformer
	switch charset {
	case "GB18030", "GBK":
		encoder = simplifiedchinese.GB18030.NewEncoder()
	case "UTF-16LE":
		encoder = unicode.BOMOverride(unicode.UTF16(unicode.LittleEndian, unicode.IgnoreBOM).NewEncoder())
	default:
	}
	return encoder
}

//GetDecoder get decoder
func GetDecoder(charset string) transform.Transformer {
	decoder := unicode.UTF8.NewDecoder().Transformer
	switch charset {
	case "GB18030", "GBK":
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
