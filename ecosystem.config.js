const config = require('./src/config/app')
    
module.exports = {
	apps : [{
		name   : "smartic-weather-station-api",
		script : "./index.js",
		watch: true,
		instances: 1,
		max_memory_restart: "1G",
		exec_mode: "fork",
		env: {
			MAIN_PATH: config.MAIN_PATH,
			USER_FTP: config.USER_FTP,
			PASSWORD_FTP: config.PASSWORD_FTP,
			URL_URBAGIS_FTP: config.URL_URBAGIS_FTP,
			URBAGIS_FTP_PATH_FILES: config.URBAGIS_FTP_PATH_FILES,
			URBAGIS_CARDIQUE_URL: config.URBAGIS_CARDIQUE_URL,
			URBAGIS_ACCESS_TOKEN: config.URBAGIS_ACCESS_TOKEN,
			WEATHER_STATIONS: config.WEATHER_STATIONS,
			EARCA_MOVIL_ID: config.EARCA_MOVIL_ID,
			EARCA_MOVIL_TASK: config.EARCA_MOVIL_TASK,
			CLEAR_FILES_TASK: config.CLEAR_FILES_TASK
		},
		env_production: {
			MAIN_PATH: config.MAIN_PATH,
			USER_FTP: config.USER_FTP,
			PASSWORD_FTP: config.PASSWORD_FTP,
			URL_URBAGIS_FTP: config.URL_URBAGIS_FTP,
			URBAGIS_FTP_PATH_FILES: config.URBAGIS_FTP_PATH_FILES,
			URBAGIS_CARDIQUE_URL: config.URBAGIS_CARDIQUE_URL,
			URBAGIS_ACCESS_TOKEN: config.URBAGIS_ACCESS_TOKEN,
			WEATHER_STATIONS: config.WEATHER_STATIONS,
			EARCA_MOVIL_ID: config.EARCA_MOVIL_ID,
			EARCA_MOVIL_TASK: config.EARCA_MOVIL_TASK,
			CLEAR_FILES_TASK: config.CLEAR_FILES_TASK
		}
	}]
}