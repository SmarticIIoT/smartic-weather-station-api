const FtpClient = require('ftp')
const ftp = new FtpClient()
const ftp_urbagis_repo = require('../repositories/ftp_urbagis')
const ftp_davis_repo = require('../repositories/ftp_davis')
const xlsx_air_quality = require('../repositories/xlsx_air_quality')
const xlsx_air_quality_kits = require('../repositories/xlsx_air_quality_kits')
const xlsx_water_quality = require('../repositories/xlsx_water_quality')
const xlsx_process_data = require('../repositories/xlsx_process_data')
const config = require('../config/app')

function getFiles() {
  const ftpConfig = {
    host: config.URL_URBAGIS_FTP,
    user: config.USER_FTP,
    password: config.PASSWORD_FTP,
    connTimeout: 60000
  }

  ftp.on('ready', async () => {
    try {
      console.log('Consultando los datos de monitoreo meteorológicos...')

      const fileList = await ftp_urbagis_repo.getFtpFileNames(ftp)
      await ftp_urbagis_repo.downloadFiles(ftp, fileList)
  
      if (fileList.length) {
        let details = await ftp_urbagis_repo.getFilesData(fileList)
        details = ftp_urbagis_repo.orderDetails(details)
        let detailsToSave = ftp_urbagis_repo.verifyDetails(details)
        detailsToSave = await ftp_urbagis_repo.verifyUrbagisRecords(detailsToSave)
        if (detailsToSave.length) await ftp_urbagis_repo.saveDetails(detailsToSave)
      }
    } catch (error) {
      console.error(error)
    }
  })

  ftp.on('error', (err) => {
    console.error(err)
    ftp.end()
  })

  ftp.connect(ftpConfig)
}

async function setFtpAirDavisData() {
  const ftpConfig = {
    host: config.URL_URBAGIS_FTP,
    user: config.USER_FTP,
    password: config.PASSWORD_FTP,
    connTimeout: 60000
  }

  ftp.on('ready', async () => {
    try {
      console.log('Consultando los datos de monitoreo meteorológicos...')

      const fileList = await ftp_davis_repo.getFtpFileNames(ftp)
      await ftp_davis_repo.downloadFiles(ftp, fileList)
  
      if (fileList.length) {
        
      }
    } catch (error) {
      console.error(error)
    }
  })

  ftp.on('error', (err) => {
    console.error(err)
    ftp.end()
  })

  ftp.connect(ftpConfig)
}

// Estos son los datos de los KITS ambientales
async function setXlsxAirDavisData() {
  const tempDirectoryName = xlsx_air_quality.tempDirectoryName
  const staions = xlsx_air_quality.stationIds()
  const fieldRanges = xlsx_air_quality.getFieldRanges()

  const files = xlsx_process_data.getFileNames(tempDirectoryName)
  let detailsToSave = xlsx_process_data.getXlsxData(files, staions, fieldRanges, tempDirectoryName)
  detailsToSave = xlsx_process_data.orderDetails(detailsToSave)
  detailsToSave = xlsx_process_data.verifyDetails(detailsToSave, fieldRanges)
  detailsToSave = await xlsx_process_data.verifyUrbagisRecords(detailsToSave, staions)
  if (detailsToSave.length) await xlsx_process_data.saveDetails(detailsToSave)
}

// Estos son los datos de los THERMO y los Davis
async function setXlsxAirKitsData() {
  const tempDirectoryName = xlsx_air_quality_kits.tempDirectoryName
  const staions = xlsx_air_quality_kits.stationIds()
  const fieldRanges = xlsx_air_quality_kits.getFieldRanges()

  const files = xlsx_process_data.getFileNames(tempDirectoryName)
  let detailsToSave = xlsx_process_data.getXlsxData(files, staions, fieldRanges, tempDirectoryName)
  detailsToSave = xlsx_process_data.orderDetails(detailsToSave)
  detailsToSave = xlsx_process_data.verifyDetails(detailsToSave, fieldRanges)
  detailsToSave = await xlsx_process_data.verifyUrbagisRecords(detailsToSave, staions)
  if (detailsToSave.length) await xlsx_process_data.saveDetails(detailsToSave)
}

// Estos son los datos de las Boyas
async function setXlsxWaterQualityData() {
  const tempDirectoryName = xlsx_water_quality.tempDirectoryName
  const staions = xlsx_water_quality.stationIds()
  const fieldRanges = xlsx_water_quality.getFieldRanges()

  const files = xlsx_process_data.getFileNames(tempDirectoryName)
  let detailsToSave = xlsx_process_data.getXlsxData(files, staions, fieldRanges, tempDirectoryName)
  detailsToSave = xlsx_process_data.orderDetails(detailsToSave)
  detailsToSave = xlsx_process_data.verifyDetails(detailsToSave, fieldRanges)
  detailsToSave = await xlsx_process_data.verifyUrbagisRecords(detailsToSave, staions)
  if (detailsToSave.length) await xlsx_process_data.saveDetails(detailsToSave)
}

async function createIdFiles() {
  const staions = xlsx_water_quality.stationIds()
  const minDate = '2023-11-19T00:00:00'
  const maxDate = '2023-11-19T23:00:00'

  const recordByStations = await ftp_urbagis_repo.getUrbagisRecordIds(staions, minDate, maxDate)
  ftp_urbagis_repo.createFiles(recordByStations, staions)
}

module.exports = {
  getFiles,
  setFtpAirDavisData,
  setXlsxAirDavisData,
  setXlsxAirKitsData,
  setXlsxWaterQualityData,
  createIdFiles
}