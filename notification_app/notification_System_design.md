# Stage 1

## Project Overview
This notification app allows users to sign up, sign in, and retrieve a dynamic message based on an event and priority. Messages are selected from per-user rules; if no rule matches, no event/priority is provided, or no rules exist, the default message is returned.

## Tech Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT for auth tokens
- bcrypt for password hashing

## Setup
1. Install dependencies: `npm install`
2. Configure environment variables:
	 - `PORT`
	 - `MONGO_URL`
	 - `JWT_SECRET`
3. Start server: `node index.js`

## API Endpoints

### POST /users/signup
Create a user with dynamic message rules.

Request body:
```
{
	"name": "Alex",
	"email": "alex@example.com",
	"password": "secret",
	"messageRules": [
		{ "event": "login", "priority": "high", "message": "High priority login alert" },
		{ "event": "payment", "priority": "low", "message": "Payment received" }
	]
}
```

Response:
```
{ "message": "User created successfully" }
```

### POST /users/signin
Sign in and receive a dynamic message in the same response.

Request body:
```
{
	"email": "alex@example.com",
	"password": "secret",
	"event": "login",
	"priority": "high"
}
```

Response:
```
{ "message": "Signin successful", "token": "<jwt>", "userMessage": "High priority login alert" }
```

### GET /users/message/:id
Get a dynamic message for a user based on event and priority.

Query params:
- `event` (optional)
- `priority` (optional)

Example:
`GET /users/message/USER_ID?event=payment&priority=low`

Response:
```
{ "message": "Payment received" }
```

## Data Model
User fields:
- `name` (String, required)
- `email` (String, required, unique)
- `password` (String, required)
- `messageRules` (Array of rules with `event`, `priority`, `message`)

## Logging
On successful sign in and message fetch, the app logs a structured object that includes `userId`, `event`, `priority`, and the resolved message.


