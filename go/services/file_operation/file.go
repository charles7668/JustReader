package file_operation

import (
	"io/ioutil"
	"os"
)

//CheckFileExist return true if file exist , if not return false
func CheckFileExist(filePath string) bool {
	_, err := os.Stat(filePath)
	if os.IsNotExist(err) {
		return true
	}
	return false
}

//CreateFileIfNotExist create file if not exist , return false if exist or error occur
func CreateFileIfNotExist(filePath string) (bool, error) {
	_, err := os.Stat(filePath)
	if os.IsNotExist(err) {
		err = ioutil.WriteFile(filePath, []byte{}, 0666)
		if err != nil {
			return false, err
		}
		return true, nil
	}
	return false, err
}

func DeleteFile(filePath string) error {
	err := os.Remove(filePath)
	return err
}
