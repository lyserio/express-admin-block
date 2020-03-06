const moment 	= require("moment")
const express 	= require("express")
const router 	= express.Router()
const ejs 		= require("ejs")

let options = {}

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
const sleep = msec => new Promise(resolve => setTimeout(resolve, msec))

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

	if (!req.user || !options.adminEmails.includes(req.user.email)) {
		req.session.redirectTo = '/admin'
		return res.redirect('/login')
	}
	
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
			labels: [],
			array: []
		}
		
		let mongoArray = await tab.mongo.find({}).lean().exec()

		if (!mongoArray.length) {
			tabs.push(data)
			continue
		}

		// Because sometimes we want to transform the data with a render function
		// Which supplies the entire element as a parameter
		for (let el of mongoArray) {
			
			let newEl = {}

			for (let field of tab.toShow) {
				
				if (typeof field === 'string') {
					newEl[field] = el[field]
				} else { // If that's an object, it has an async 'render' method
					try {
						newEl[field.name] = await field.render(el)
					} catch(e) {
						newEl[field.name] = 'Error!'
						console.error(e)
					}
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

				if (!e[tab.dateField]) return false

				let dateDay = e[tab.dateField].toISOString().slice(0,10)

				return Date.parse(dateDay) <= Date.parse(day)

			}).length

			data.amounts.push(amount)
			data.labels.push(day)

		}

		// Shorten dates for human readble
		// Deep clone needed 
		data.array = JSON.parse(JSON.stringify(data.array)).filter(e => e[tab.dateField]).map(el => { 
			el[tab.dateField] = new Date(el[tab.dateField]).toISOString().slice(0,10)
			return el
		})

		tabs.push(data)
	}

	res.render(__dirname+'/views/statistics', {
		tabs: tabs
	})

}))

router.get('/broadcast', (req, res) => {
	res.render(__dirname+'/views/broadcast')
})

router.post('/broadcastusers', asyncHandler( async (req, res, next) => {
	let query
	try {
		query = JSON.parse(req.body.mongoQuery)
	} catch(e) {
		return next("Invalid JSON.")
	}
	const allUsers = await options.data.find(t => t.name === 'Users').mongo.find(query).exec()
	const emailsArray = allUsers.map(u => u.email)

	res.render(__dirname+'/views/broadcastform', {
		emails: emailsArray
	})
}))

router.post('/broadcast', asyncHandler(async (req, res, next) => {
	req.setTimeout(500000)

	const domain = req.body.domain
	const tag = req.body.tag
	const fromEmail = req.body.fromEmail
	const fromName = req.body.fromName
	const fromString = `${fromName} <${fromEmail.split('@')[0]}@${domain}>`
	const messageHTML = req.body.messageHTML + "<br><p><a href='%tag_unsubscribe_url%'>Unsubscribe from emails like this</a></p>"
	const subject = req.body.subject

	const emails = req.body.emails.map(e => e.trim())

	res.send(`
		<h3>Broadcast is sending to:</h3>
		${emails.map(e => e + '<br>')}
		<br>
		<a href="/admin">Back</a>
	`)

	for (let email of emails) {

		await options.sendMail(subject, messageHTML, email, {
			from: fromString,
			"h:Reply-To": fromEmail,
			"o:tag": tag,
			"o:tracking-clicks": "yes",
			"o:tracking-opens": "yes",
			"o:tracking": "yes"
		})

		await sleep(200)
	}

}))


module.exports = (opts) => {
	if (opts) options = opts

	return router
}