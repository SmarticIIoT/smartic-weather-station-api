const tempDirectoryName = 'xlsx_air_temp'

function getFieldRanges() {
  return [
    { urbagisField: 'pm10', required: true },
    { urbagisField: 'pm2_5', required: true },
    { urbagisField: 'o3', required: true },
    { urbagisField: 'co', required: true },
    { urbagisField: 'no2', required: true },
    { urbagisField: 'so2', required: true },
    { urbagisField: 'wind_speed', required: true },
    { urbagisField: 'wind_direction', required: true },
    { urbagisField: 'solar_rad', required: true },
    { urbagisField: 'atm_pressure', required: true },
    { urbagisField: 'precipitation', required: true },
    { urbagisField: 'humidity', required: true },
    { urbagisField: 'temperature', required: true },
    { urbagisField: 'ambient_noise', require: false }
  ]
}

function stationIds() {
  return [
    { name: 'MOVIL', id: '64c28d9d62fd6f001b7a6ab1' },
    { name: 'PASACABALLOS', id: '6373c476289c5904ceb7ac24' }
  ]
}

module.exports = {
  tempDirectoryName,
  getFieldRanges,
  stationIds
}