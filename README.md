# express-admin-block
[![npm version](https://badge.fury.io/js/express-admin-block.svg)](https://badge.fury.io/js/express-admin-block)

*Still in alpha testing.*

A simple Express (4.0+) middleware for rendering an admin page, directly connected to your MongoDB database.

Current user is checked with `req.user`

The goal is to be a drop-in admin panel for Express apps.

You can add custom fields and will soon be able to add custom charts.

Made with Bootstrap 4, DataTables and Chart.JS.


## Features

- [x] Render a table for your data
- [x] Choose fields to display
- [ ] View complete user data object
- [x] Chart for evolution over time
- [x] Broadcast: send emails to all users
- [ ] Send email to select users
- [ ] Edit select users


## Who uses it?

<table>
<tr>
	<td align="center">
		<a href="https://nucleus.sh"><img src="https://nucleus.sh/logo_color.svg" height="64" /></a>
	</td>
	<td align="center">
		<a href="https://eliopay.com"><img src="https://eliopay.com/logo_black.svg" height="64" /></a>
	</td>
	<td align="center">
		<a href="https://backery.io"><img src="https://backery.io/logo_color.svg" height="64" /></a>
	</td>
	<td align="center">
		<a href="https://litch.app"><img src="https://litch.app/img/logo.png" height="64" /></a>
	</td>
</tr>
<tr>
	<td align="center">Nucleus</td>
	<td align="center">ElioPay</td>
	<td align="center">Backery</td>
	<td align="center">Litch.app</td>
</tr>
</table>

_👋 Want to be listed there? [Contact me](mailto:vince@lyser.io)._


## Usage

Install the library


```bash
npm i express-admin-block
```


Include it in your app like this:

`db` represents an object of Mongoose schemas.

```javascript

app.use('/admin', require('express-admin-block')({
	adminEmails: ['webmaster@website.com'], // User needs to be logged in 
	data: [{
		name: 'Users',
		type: 'mongoose',
		mongo: db.User,
		toShow: ['email', 'registered', 'plan'],
		dateField: 'registered'
	}, {
		name: 'Apps',
		type: 'mongoose',
		mongo: db.TrackedApp,
		toShow: ['name', 'created', { // Can either be strings (properties of your documents) or objects that include a 'render' **async** function
			name: 'Parent user':
			render: async (app) => {
				let user = await db.User.findById(app.parentUser).exec()
				return user.email
			}
		}],
		dateField: 'created'
	}]
}))

```
