const loadders = require('./src/loadders')
const getRouter = require('./src/routes')
const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
const config = require('./src/config/app')
const ftp_urbagisCtrl = require('./src/controllers/ftp_task_manager')

app.use(cors())

app.use(morgan('dev'))

app.use(express.json({ limit: '10mb' }))

app.use(config.MAIN_PATH, getRouter())

//Handler error
app.use((err, req, res, next) => {
	res.status(err.status).json(err)
})

ftp_urbagisCtrl.setXlsxWaterQualityData()

module.exports = app