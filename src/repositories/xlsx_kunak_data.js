const tempDirectoryName = 'xlsx_kunak_temp'

function getFieldRanges() {
  return [
    { urbagisField: 'pm10', required: true },
    { urbagisField: 'pm2_5', required: true },
    { urbagisField: 'humidity', required: true },
    { urbagisField: 'temperature', required: true },
    { urbagisField: 'wind_speed', required: true },
    { urbagisField: 'wind_direction', required: true },
    { urbagisField: 'solar_rad', required: true },
    { urbagisField: 'atm_pressure', required: true },
    { urbagisField: 'precipitation', required: true },
    { urbagisField: 'ambient_noise', required: true }
  ]
}

function stationIds() {
  return [
    { name: 'ARJONA-KU', id: '641bc8181a2ea2001a2fc7c1' },
    { name: 'TURBACO-KU', id: '641bc68a1a2ea2001a2fc7c0' },
    { name: 'TURBANA-KU', id: '641bc4ee1a2ea2001a2fc7bf' },
    { name: 'UTB-KU', id: '64419f2bbe1c650013c3aebb' }
  ]
}

module.exports = {
  tempDirectoryName,
  getFieldRanges,
  stationIds
}