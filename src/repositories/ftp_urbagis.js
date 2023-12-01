const axios = require('axios')
const fs = require('fs')
const { DateTime } = require('luxon')
const config = require('../config/app')

function getFieldRanges() {
  return [
    { ftpField: 'O3', urbagisField: 'o3', required: true },
    { ftpField: 'CO', urbagisField: 'co', required: true },
    { ftpField: 'NO', urbagisField: 'no2', required: true },
    { ftpField: 'SO2', urbagisField: 'so2', required: true },
    { ftpField: 'PM', urbagisField: 'pm10', required: true },
    { ftpField: 'PM2', urbagisField: 'pm2_5', required: true }
  ]
}

function stationIds() {
  return [
    { name: 'CLC', id: '64c28d9d62fd6f001b7a6ab1' },
    { name: 'MOVIL', id: '64c28d9d62fd6f001b7a6ab1' },
    { name: 'PASACABALLOS', id: '6373c476289c5904ceb7ac24' }
  ]
}

async function getUrbagisTrackedObjectById() {
  try {
    const options = {
      url: `${config.URBAGIS_CARDIQUE_URL}/sensors?paginate=1&populate=0&query={"trackedObject":"64c28d5662fd6f001b7a6aaf"}&limit=10&skip=0`,
      method: 'get',
      headers: {
        'Authorization': `Bearer ${config.URBAGIS_ACCESS_TOKEN}`,
        'app': 'monitoring'
      }
    }
    
    const response = await axios.request(options)
    return response.data.data[0]
  } catch (error) {
    console.error(error.response)
  }
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

function getFilesData(fileList) {
  return new Promise((resolve, reject) => {
    const weatherStations = stationIds()
    const fieldRanges = getFieldRanges()
    const now = DateTime.now().c
  
    Object.keys(now).forEach(unit => {
      if (now[unit] < 10) now[unit] = `0${now[unit]}`
    })
    
    const details = []
    
    for (const station of weatherStations) {
      for (const file of fileList) {
        const nameSize = file.length
        const fileDate = `${file.substring(nameSize-12, nameSize-4)}`

        if (file.indexOf(`${station.name}_`) > -1) {
          const existFilePath = `${process.cwd()}/temp/${file}`
          
          if (fs.existsSync(existFilePath)) {
            let content = fs.readFileSync(existFilePath, { encoding: 'utf8', flag: 'r' })
            content = content.split('\n')
            content = content.map(el => el.replaceAll('\r', ''))
            let date
            let hour
            let second
            let values
            let urbagisField
            let row
            
            for (const record of content) {
              values = record.split(',')
              hour = values[0].substring(9, 11)
              second = values[0].substring(15, 17)
              date = `${fileDate} ${hour}:00:${second}`
              
              if (values[0] == date) {
                urbagisField = fieldRanges.find(el => el.ftpField == values[1]).urbagisField
                row = details.find(el => el.date == values[0])
                
                if (row) row[urbagisField] = Number(values[2])
                if (!row) details.push({ date, [urbagisField]: Number(values[2]), sensor: station.id })
              }
            }
          }
        }
      }
    }

    for (const detail of details) {
      detail.invalidValues = false
      detail.active = true
      detail.validated = false
      detail.createdAt = `20${detail.date.replaceAll(' ', 'T')}`
      detail.updatedAt = `20${detail.date.replaceAll(' ', 'T')}`
      delete detail.date
    }

    if (!details.length) console.log('No hay registros para validar e insertar.')
    
    resolve(details)
  })
}

function orderDetails(details) {
  let dateA
  let dateB

  details.sort((a, b) => {
    dateA = DateTime.fromISO(a.createdAt)
    dateB = DateTime.fromISO(b.createdAt)

    if (dateA.ts > dateB.ts) return 1
    if (dateA.ts < dateB.ts) return -1
    return 0
  })
  
  return details
}

function verifyDetails(details) {
  const detailsToSave = []
  const fieldRanges = getFieldRanges()
  let requires = 0
  let checked = 0

  for (const field of fieldRanges) {
    if (field.required) requires++
  }

  for (const detail of details) {
    checked = 0
    const detailFields = Object.keys(detail)

    for (const field of fieldRanges) {
      if (field.required && detailFields.includes(field.urbagisField)) checked++
    }
    
    if (requires == checked) {
      detail.validated = true
      detailsToSave.push(detail)
    } else {
      detail.invalidValues = true
      detailsToSave.push(detail)
    }
  }

  return detailsToSave
}

async function verifyUrbagisRecords(detailsToSave) {
  let newDetailsToSave = []
  
  try {
    if (detailsToSave.length) {
      const stations = stationIds()
      let monthsAgo = DateTime.now().minus({ months: 3 }).c
      let now = DateTime.now().c
      
      Object.keys(monthsAgo).forEach(unit => {
        if (monthsAgo[unit] < 10) monthsAgo[unit] = `0${monthsAgo[unit]}`
      })
    
      Object.keys(now).forEach(unit => {
        if (now[unit] < 10) now[unit] = `0${now[unit]}`
      })
      
      const minDate = `${monthsAgo.year}-${monthsAgo.month}-${monthsAgo.day}T${monthsAgo.hour}:${monthsAgo.minute}:${monthsAgo.second}`
      const maxDate = `${now.year}-${now.month}-${now.day}T${now.hour}:${now.minute}:${now.second}`
      
      const recordByStations = {}
      const idsOfStations = []
      stations.forEach(el => {
        if(!idsOfStations.includes(el.id)) idsOfStations.push(el.id)
      })
      
      for (const id of idsOfStations) {
        const options = {
          url: `${config.URBAGIS_CARDIQUE_URL}/data?query={"sensor": "${id}"}&skip=0&paginate=0&minDate=${minDate}&maxDate=${maxDate}&showInvalidData=true&limit=0&options={"sort": {"createdAt": 1}}`,
          method: 'get',
          headers: {
            'Authorization': `Bearer ${config.URBAGIS_ACCESS_TOKEN}`,
            'app': 'monitoring'
          }
        }
        
        const response = await axios.request(options)
        
        if (!recordByStations[id]) {
          recordByStations[id] = response.data.filter(el => el.sensor == id)
        }
      }
      
      let detailDate
      let recordDate
      let exist
      
      for (const detail of detailsToSave) {
        exist = false
        detailDate = DateTime.fromISO(detail.createdAt)
        
        for (const record of recordByStations[detail.sensor]) {
          recordDate = DateTime.fromISO(record.createdAt)

          if (detailDate.ts == recordDate.ts) {
            exist = true
            break
          }
        }

        if (!exist) newDetailsToSave.push(detail)
      }
    }

    console.log(detailsToSave.length, newDetailsToSave.length)
    return newDetailsToSave
  } catch (error) {
    console.error(error)
  }
}

async function saveDetails(details) {
  try {
    console.log('Insertando los datos de monitoreo del aire en UrbaGIS...')

    for (const detail of details) {
      const options = {
        url: `${config.URBAGIS_CARDIQUE_URL}/data`,
        method: 'post',
        data: detail,
        headers: {
          'Authorization': `Bearer ${config.URBAGIS_ACCESS_TOKEN}`,
          'app': 'monitoring'
        }
      }
      
      await axios.request(options)
    }

    console.log('Datos de meteorología insertados en UrbaGIS correctamente.')
  } catch (error) {
    console.log(error.response)
  }
}

function clearFiles() {
  const fieldRanges = getFieldRanges()
  const weatherStations = config.WEATHER_STATIONS?.split(',')
  const yesterday = DateTime.now().minus({ days: 1 }).c
  const fileDate = `${yesterday.year.toString().substring(2, 4)}-${yesterday.month < 10 ? `0${yesterday.month}` : yesterday.month}-${yesterday.day < 10 ? `0${yesterday.day}` : yesterday.day}`
  
  for (const field of fieldRanges) {
    for (const station of weatherStations) {
      const filePath = `${process.cwd()}/temp/${station}_${field.ftpField}_${fileDate}.txt`
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }
  }
}

async function getUrbagisRecordIds(stations, minDate, maxDate) {
  const idsOfStations = []
  const recordByStations = {}

  stations.forEach(el => {
    if(!idsOfStations.includes(el.id)) idsOfStations.push(el.id)
  })

  for (const id of idsOfStations) {
    recordByStations[id] = []

    const options = {
      url: `${config.URBAGIS_CARDIQUE_URL}/data?query={"sensor": "${id}"}&skip=0&paginate=0&minDate=${minDate}&maxDate=${maxDate}&showInvalidData=true&limit=0&options={"sort": {"createdAt": 1}}`,
      method: 'get',
      headers: {
        'Authorization': `Bearer ${config.URBAGIS_ACCESS_TOKEN}`,
        'app': 'monitoring'
      }
    }
    
    const response = await axios.request(options)
    for (const record of response.data) recordByStations[id].push(record._id)
  }

  return recordByStations
}

function createFiles(recordByStations, stations) {

  Object.keys(recordByStations).forEach(key => {
    const station = stations.find(el => el.id == key)
    let content = ''

    for (let i=0; i<recordByStations[key].length; i++) {
      content += recordByStations[key][i]
      if (i < recordByStations[key].length-1) content += '\n'
    }

    fs.writeFileSync(`${process.cwd()}/filesToRemove/${station.name}.txt`, content)
  })

  console.log('Archivos creados correctamente.')
}

module.exports = {
  getFtpFileNames,
  downloadFiles,
  getFilesData,
  orderDetails,
  verifyDetails,
  verifyUrbagisRecords,
  saveDetails,
  clearFiles,
  getUrbagisRecordIds,
  createFiles
}