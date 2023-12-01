const tempDirectoryName = 'xlsx_water_temp'

function getFieldRanges() {
  return [
    { urbagisField: 'temperature', required: true },
    { urbagisField: 'ph', required: true },
    { urbagisField: 'conductivity', required: true },
    { urbagisField: 'depth', required: true },
    { urbagisField: 'dissolved_oxygen', required: true },
    { urbagisField: 'chlorophyll', required: true },
    { urbagisField: 'salinity', required: true }
  ]
}

function stationIds() {
  return [
    { name: 'LAGUITO', id: '64e53011ff7954001302eb6a' },
    { name: 'BOCAGRANDE', id: '64e531cb5a5149001a33d78b' }
  ]
}

module.exports = {
  tempDirectoryName,
  getFieldRanges,
  stationIds
}