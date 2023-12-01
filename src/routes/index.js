const express = require('express')
let router = express.Router()
const healthRouter = require('./health')

function getRouter() {
	healthRouter(router)

	return router
}

module.exports = getRouter