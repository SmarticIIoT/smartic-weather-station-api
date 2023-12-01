const app = require('./app')
const config = require('./src/config/app')
const port = 8308

app.listen(port, () => {
	console.log(`Run in port ${port}`)
})