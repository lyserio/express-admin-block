const moment 	= require("moment")
const express 	= require("express")
const router 	= express.Router()
const ejs 		= require("ejs")

let options = {}

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// Create an array of days, in the interval
const getDates = (startDate, stopDate) => {
    let dateArray = []
    let currentDate = moment(startDate)
    stopDate = moment(stopDate)
    while (currentDate <= stopDate) {
        dateArray.push( moment(currentDate).format('YYYY-MM-DD') )
        currentDate = moment(currentDate).add(1, 'days')
    }
    return dateArray
}

// Make sure user has the rights
router.use((req, res, next) => {
	if (!req.user) return next('Login required for admin.')
	if (!options.adminEmails.includes(req.user.email)) return next('Unauthorized')
	
	next()
})

router.get('/', asyncHandler( async (req, res, next) => {

	let tabs = []

	for (let tab of options.data) {

		let fieldNames = tab.toShow.map(el => typeof el === 'string' ? el : el.name)

		let data = {
			name: tab.name,
			fields: fieldNames,
			id: tab.name.replace(/\W/g,'_'),
			amounts: [],
			labels: []
		}
		
		let mongoArray = await tab.mongo.find({}).lean().exec()

		data.array = []

		// Because sometimes we want to transform the data with a render function
		// Which supplies the entire element as a parameter
		for (let el of mongoArray) {
			
			let newEl = {}

			for (let field of tab.toShow) {
				
				if (typeof field === 'string') {
					newEl[field] = el[field]
				} else { // If that's an object, it has an async 'render' method
					newEl[field.name] = await field.render(el)
				}
			}
			
			data.array.push(newEl)
		}

		// Sort by date
		data.array = data.array.sort((b, a) => {
			a = new Date(a[tab.dateField])
			b = new Date(b[tab.dateField])
			return a > b ? -1 : a < b ? 1 : 0
		})

		// This is needed for creating the chart
		// Create a date range from the first created item to today
		for (let day of getDates(data.array[0][tab.dateField], new Date())) {
			
			// Count how many items created before this specific day
			let amount = data.array.filter(e => {

				let dateDay = e[tab.dateField].toISOString().slice(0,10)

				return Date.parse(dateDay) <= Date.parse(day)

			}).length

			data.amounts.push(amount)
			data.labels.push(day)

		}

		// Shorten dates for human readble
		// Deep clone needed 
		data.array = JSON.parse(JSON.stringify(data.array)).map(el => { 
			el[tab.dateField] = new Date(el[tab.dateField]).toISOString().slice(0,10)
			return el
		})

		tabs.push(data)
	}

	res.render(__dirname+'/admin.ejs', {
		tabs: tabs
	})

}))

router.post('/broadcast', asyncHandler((req, res, next) => {

	let allUsers = db.User.find({}).exec()

	for (let user of allUsers) {
		mailgunClient.messages.create('mg.nucleus.sh', {
			from: `${req.body.fromName} <${req.body.fromEmail}>`,
			to: user.email,
			subject: req.body.subject,
			text: req.body.message
		})
	}

	res.send('Sent! <a hre="/admin">Back</a>')

}))


module.exports = (opts) => {
	if (opts) options = opts

	return router
}