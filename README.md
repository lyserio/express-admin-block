# express-billing-page

*Still in alpha testing.*

A simple Express (4.0+) middleware for rendering an admin page, directly connected to your database.

Made with Bootstrap 4, DataTables and Chart.JS.

The goal is to be a drop-in admin panel for Express apps.

You can add custom fields and will soon be able to add custom charts.

## Features

- [x] Render a table for your data
- [x] Choose fields to display
- [x] Chart for evolution over time
- [x] Broadcasting function: send emails to all users
- [ ] Broadcast emails to select users
- [ ] Edit select users

## Usage

Install the library


```bash
npm i express-admin-page
```

Server code:

```javascript
app.use('/admin', require('express-admin-page')({
	adminEmails: ['webmaster@website.com'],
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
