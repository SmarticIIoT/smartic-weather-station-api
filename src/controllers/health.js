function health(req, res, next) {
	res.status(200).send({data: 'Ok'})
}

module.exports = {
	health
}
  