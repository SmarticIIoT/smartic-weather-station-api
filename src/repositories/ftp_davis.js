const axios = require('axios')
const fs = require('fs')
const { DateTime } = require('luxon')
const config = require('../config/app')

function getFieldRanges() {
  return [
    { ftpField: 'O3', urbagisField: 'o3', required: true }
  ]
}

function stationIds() {
  return [
    { name: 'MET', id: '64c28d9d62fd6f001b7a6ab1' }
  ]
}

function getFtpFileNames(ftp) {
  return new Promise((resolve) => {
    const remoteFilePath = config.URBAGIS_FTP_PATH_FILES
    const weatherStations = stationIds()
  
    const now = DateTime.now().c
  
    Object.keys(now).forEach(unit => {
      if (now[unit] < 10) now[unit] = `0${now[unit]}`
    })
    
    ftp.list(remoteFilePath, (err, files) => {
      if (files) {
        const fileList = []
        
        for (const station of weatherStations) {
          const list = files.forEach(el => {
            if (el.name.includes(`${station.name}_`)) {
              fileList.push(el.name)
            }
          })
        }
        
        resolve(fileList)
      }
    })
  })
}

function downloadFiles(ftp, fileList) {
  return new Promise((resolve, reject) => {
    const remoteFilePath = config.URBAGIS_FTP_PATH_FILES

    if (!fileList.length) console.log('No se encontraron archivos con fecha de hoy para descargar')

    for (const file of fileList) {
      ftp.get(`${remoteFilePath}/${file}`, (err, stream) => {
        if (stream) {
          const localFilePath = `${process.cwd()}/temp/${file}`
          const writeStream = fs.createWriteStream(localFilePath)
          stream.pipe(writeStream)
          
          setTimeout(() => {
            if (file == fileList[fileList.length-1]) resolve(null)
          }, 1000)
        }
      })
    }
  })
}

module.exports = {
  getFtpFileNames,
  downloadFiles
}