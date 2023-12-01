const XLSX = require('xlsx')
const fs = require('fs')
const axios = require('axios')
const { DateTime } = require('luxon')
const config = require('../config/app')

function getFileNames(tempDirectoryName) {
  const url = `${process.cwd()}/${tempDirectoryName}`
  const files = fs.readdirSync(url)
  
  return files
}

function getXlsxData(files, staions, fieldRanges, tempDirectoryName) {
  const detailsToSave = []
  let detail = {}

  for (const station of staions) {
    for (const file of files) {
      if (file.toLowerCase().includes(station.name.toLocaleLowerCase())) {
        const workbook = XLSX.readFile(`${process.cwd()}/${tempDirectoryName}/${file}`)
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet)
      
        for (const obj of data) {
          detail = {}
          let field
          let dateFieldName
          
          Object.keys(obj).forEach(key => {
            if (key.toLocaleLowerCase() == 'date') dateFieldName = key
            field = fieldRanges.find(el => key.toLocaleLowerCase().trim() == el.urbagisField.toLocaleLowerCase())
            if (field) detail[field.urbagisField] = Number(Number(obj[key]).toFixed(2))
          })
          
          detail.invalidValues = false
          detail.active = true
          detail.validated = false
          detail.sensor = station.id
          detail.createdAt = obj[dateFieldName]
          detail.updatedAt = obj[dateFieldName]
          detailsToSave.push(detail)
        }
      }
    }
  }

  return detailsToSave
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

function verifyDetails(details, fieldRanges) {
  const detailsToSave = []
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

async function verifyUrbagisRecords(detailsToSave, staions) {
  try {
    const detailsByStations = {}
    const recordByStations = {}
    
    for (const station of staions) {
      if (!detailsByStations[station.id]) {
        detailsByStations[station.id] = detailsToSave.filter(el => el.sensor == station.id)
      }
      
      if (detailsByStations[station.id].length) {
        const minDate = detailsByStations[station.id][0].createdAt
        const maxDate = detailsByStations[station.id][detailsByStations[station.id].length-1].createdAt
        
        if (!recordByStations[station.id]) recordByStations[station.id] = []
    
        const options = {
          url: `${config.URBAGIS_CARDIQUE_URL}/data?query={"sensor": "${station.id}"}&skip=0&paginate=0&minDate=${minDate}&maxDate=${maxDate}&showInvalidData=true&limit=0&options={"sort": {"createdAt": 1}}`,
          method: 'get',
          headers: {
            'Authorization': `Bearer ${config.URBAGIS_ACCESS_TOKEN}`,
            'app': 'monitoring'
          }
        }
        
        const response = await axios.request(options)
        recordByStations[station.id] = response.data
      }
    }
  
    const newDetailsToSave = []
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

module.exports = {
  getFileNames,
  getXlsxData,
  orderDetails,
  verifyDetails,
  verifyUrbagisRecords,
  saveDetails
}