# express-billing-page

*Still in alpha testing*

A simple Express (4.0+) middleware for rendering an admin page, directly connected to your database.

Made with Bootstrap 4.0, DataTables and Chart.JS.

The goal is to be a drop-in admin panel for Express apps.



## Features

- [x] Table for your data
- [x] Choose fields to display
- [x] Chart for evolution over time
- [x] Broadcasting function: send emails to all users
- [ ] Broadcast emails to select users

## Usage

Install the library


```bash
npm i express-admin-page
```

Server code:

```javascript
app.use('/admin', require('express-admin-page')({
	adminEmails: ['webmaster@website.com'],
	mailgunClient: mg,
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
		toShow: ['name', 'created', 'parentUser'],
		dateField: 'created'
	}]
}))

```
