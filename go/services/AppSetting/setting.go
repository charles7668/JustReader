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
	ReadingFontSize        string `json:"reading_font_size"`
	ReadingTW              string `json:"reading_tw"`
}

type InitStructure struct {
	Logger   *log.Logger
	Database *sql.DB
}

var logger *log.Logger
var db *sql.DB

const latestVersion = "1.1"

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
	exist := checkTableExist("AppSetting")
	if !exist {
		createDefaultTable()
	} else {
		version := getSettingVersion()
		if version == "error" {
			deleteTable("AppSetting")
			createDefaultTable()
		}
	}
	_ = updateSettingVersion()
}

func createDefaultTable() {
	queryString := `CREATE TABLE AppSetting
								(
								    SettingVersion text,
								    ReadingBackgroundColor text,
								    ReadingFontColor text,
								    ReadingFontSize text
								)`
	_, err := db.Exec(queryString)
	checkError(err)
	queryString = "INSERT INTO AppSetting(SettingVersion,ReadingBackgroundColor,ReadingFontColor) VALUES ('1.0','#FFF','#000')"
	_, err = db.Exec(queryString)
	checkError(err)
}

func GetSetting() (Setting, error) {
	logger.Println("func enter : setting/GetSetting")
	defer logger.Println("func exit : setting/GetSetting")
	queryString := "SELECT SettingVersion, ReadingBackgroundColor, ReadingFontColor, ReadingFontSize, ReadingTW FROM AppSetting"
	row, err := db.Query(queryString)
	checkError(err)
	defer func(row *sql.Rows) {
		err := row.Close()
		checkError(err)
	}(row)
	var setting Setting
	row.Next()

	err = row.Scan(&setting.SettingVersion, &setting.ReadingBackgroundColor, &setting.ReadingFontColor, &setting.ReadingFontSize, &setting.ReadingTW)
	if checkError(err) {
		deleteTable("AppSetting")
		createDefaultTable()
		err = updateSettingVersion()
		checkError(err)
	}
	return setting, nil
}

//getSettingVersion get setting version
func getSettingVersion() string {
	logger.Println("func enter : setting/getSettingVersion")
	defer logger.Println("func exit : setting/getSettingVersion")
	queryString := "SELECT SettingVersion FROM AppSetting"
	logger.Println(queryString)
	row := db.QueryRow(queryString)
	if checkError(row.Err()) {
		return "error"
	}
	var version string
	err := row.Scan(&version)
	if checkError(err) {
		return "error"
	}
	return version
}

func UpdateSetting(setting Setting) error {
	logger.Println("func enter : AppSetting/setting updateSetting")
	defer logger.Println("func exit : AppSetting/setting updateSetting")
	logger.Print("setting : ")
	logger.Println(setting)
	logger.Println("check AppSetting table exist")
	exist := checkTableExist("AppSetting")
	var queryString string
	if !exist {
		queryString = `CREATE TABLE AppSetting
								(
								    SettingVersion text,
								    ReadingBackgroundColor text,
								    ReadingFontColor text,
								    ReadingFontSize text,
									ReadingTW	text
								)`
		logger.Println("AppSetting not exist , create new one , SQL:")
		logger.Println(queryString)
		_, err := db.Exec(queryString)
		if checkError(err) {
			return err
		}
		queryString = fmt.Sprintf("INSERT INTO AppSetting (SettingVersion, ReadingBackgroundColor, ReadingFontColor, ReadingFontSize, ReadingTW)  VALUES('%s','%s','%s','%s','%s')",
			setting.SettingVersion,
			setting.ReadingBackgroundColor,
			setting.ReadingFontColor,
			setting.ReadingFontSize,
			setting.ReadingTW)
		logger.Println(queryString)
		_, err = db.Exec(queryString)
		if checkError(err) {
			return err
		}
	} else {
		queryString = fmt.Sprintf("UPDATE 'AppSetting' SET ReadingBackgroundColor='%s' , ReadingFontColor='%s' , ReadingFontSize='%s' , ReadingTW='%s'",
			setting.ReadingBackgroundColor, setting.ReadingFontColor, setting.ReadingFontSize, setting.ReadingTW)
		logger.Println(queryString)
		_, err := db.Exec(queryString)
		if checkError(err) {
			return err
		}
	}
	return nil
}

func checkTableExist(tableName string) bool {
	queryString := fmt.Sprintf("SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE name='%s' and type='table')", tableName)
	row := db.QueryRow(queryString)
	if checkError(row.Err()) {
		return false
	}
	var exist bool
	err := row.Scan(&exist)
	if checkError(err) {
		return false
	}
	return exist
}

func deleteTable(tableName string) {
	queryString := fmt.Sprintf("DROP TABLE '%s'", tableName)
	_, err := db.Exec(queryString)
	checkError(err)
}

//updateSettingVersion update setting version , add column or delete column
func updateSettingVersion() error {
	logger.Println("func enter : setting/updateSettingVersion")
	defer logger.Println("func exit : setting/updateSettingVersion")
	version := getSettingVersion()
	if version == "1.0" {
		var setting Setting
		queryString := "SELECT SettingVersion,ReadingBackgroundColor,ReadingFontColor FROM AppSetting"
		row := db.QueryRow(queryString)
		if checkError(row.Err()) {
			return row.Err()
		}
		err := row.Scan(&setting.SettingVersion, &setting.ReadingBackgroundColor, &setting.ReadingFontColor)
		if checkError(err) {
			return err
		}
		deleteTable("AppSetting")
		setting.ReadingFontSize = "24"
		setting.ReadingTW = "false"
		setting.SettingVersion = latestVersion
		err = UpdateSetting(setting)
		if checkError(err) {
			return err
		}
	}
	return nil
}
