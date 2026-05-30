# Stage 1

## Project Overview
This is a basic real-time notification system for students. After login, students receive placement-related updates (results, interview, offer, drive schedule) using an event type and message. Messages are resolved by event type (and optional priority); if no rule matches, the default message is used.

## Tech Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT for auth tokens
- bcrypt for password hashing
- SSE (Server-Sent Events) for basic real-time delivery

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
		{ "event": "results", "priority": "high", "message": "Placement results released" },
		{ "event": "interview", "priority": "medium", "message": "Interview scheduled" },
		{ "event": "offer", "priority": "high", "message": "Offer letter shared" },
		{ "event": "drive", "priority": "low", "message": "Campus drive updated" }
	]
}
```

Response:
```
{ "message": "User created successfully" }
```

### POST /users/signin
Sign in and receive a dynamic message in the same response (first message).

Request body:
```
{
	"email": "alex@example.com",
	"password": "secret",
	"event": "results",
	"priority": "high"
}
```

Response:
```
{ "message": "Signin successful", "token": "<jwt>", "userMessage": "Placement results released" }
```

### GET /users/stream
Basic real-time notifications using SSE. Client connects after login and keeps the connection open.

Headers:
- `Authorization: Bearer <jwt>`

Response:
```
event: message
data: { "message": "Placement results released", "event": "results", "priority": "high" }
```

Client example (browser):
```
const source=new EventSource('/users/stream', { withCredentials: true });
source.onmessage=(event)=>console.log(JSON.parse(event.data));
```

### POST /users/notify
Send a real-time notification to a logged-in student.

Request body:
```
{
	"userId": "USER_ID",
	"event": "results",
	"priority": "high"
}
```

Response:
```
{ "message": "Notification processed", "delivered": true }
```

### GET /users/message/:id
Get a dynamic message for a user based on event and priority.

Query params:
- `event` (optional)
- `priority` (optional)

Example:
`GET /users/message/USER_ID?event=drive&priority=low`

Response:
```
{ "message": "Campus drive updated" }
```

## Data Model
User fields:
- `name` (String, required)
- `email` (String, required, unique)
- `password` (String, required)
- `messageRules` (Array of rules with `event`, `priority`, `message`)

## Logging
On successful sign in and message fetch, the app logs a structured object that includes `userId`, `event`, `priority`, and the resolved message.

# Stage 2
Working with NoSQL is much more preferred rather than working with SQL Databse as when we scale up, their could arise more atributes that needs to be handled

AS NoSQL supports dynamic database schema we can add or remove attributes accordingly which supports elasticity of project rather than working on single pre-fixed database schema which becomes difficult when we scale up the users and attributes


# Stage 3







