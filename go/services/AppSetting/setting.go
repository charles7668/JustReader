package AppSetting

import (
	"database/sql"
	"fmt"
	"log"
)

type Setting struct {
	SettingVersion         string `json:"setting_version"`
	ReadingBackgroundColor string `json:"reading_background_color"`
	ReadingFontColor       string `json:"reading_font_color"`
}

type InitStructure struct {
	Logger   *log.Logger
	Database *sql.DB
}

var logger *log.Logger
var db *sql.DB

func checkError(err error) bool {
	if err != nil {
		logger.Println(err)
		return true
	}
	return false
}

func Init(init InitStructure) {
	logger = init.Logger
	db = init.Database
	queryString := "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='AppSetting'"
	row, err := db.Query(queryString)
	defer func(row *sql.Rows) {
		err := row.Close()
		if err != nil {
			logger.Fatalln(err)
		}
	}(row)
	checkError(err)
	var count int
	for row.Next() {
		err = row.Scan(&count)
		checkError(err)
	}
	if count == 0 {
		queryString = `CREATE TABLE AppSetting
								(
								    SettingVersion text,
								    ReadingBackgroundColor text,
								    ReadingFontColor text
								)`
		_, err = db.Exec(queryString)
		checkError(err)
		queryString = "INSERT INTO AppSetting(SettingVersion,ReadingBackgroundColor,ReadingFontColor) VALUES ('1.0','#FFF','#000')"
		_, err = db.Exec(queryString)
		checkError(err)
	}
}

func GetSetting() (Setting, error) {
	queryString := "SELECT * FROM AppSetting"
	row, err := db.Query(queryString)
	checkError(err)
	defer func(row *sql.Rows) {
		err := row.Close()
		checkError(err)
	}(row)
	var setting Setting
	row.Next()

	err = row.Scan(&setting.SettingVersion, &setting.ReadingBackgroundColor, &setting.ReadingFontColor)
	checkError(err)
	return setting, nil
}

func UpdateSetting(setting Setting) error {
	logger.Println("func enter : AppSetting/setting updateSetting")
	queryString := fmt.Sprintf("UPDATE 'AppSetting' SET ReadingBackgroundColor='%s' , ReadingFontColor='%s'",
		setting.ReadingBackgroundColor, setting.ReadingFontColor)
	_, err := db.Exec(queryString)
	if checkError(err) {
		logger.Println("func exit : AppSetting/setting updateSetting")
		return err
	}
	logger.Println("func exit : AppSetting/setting updateSetting")
	return nil
}
