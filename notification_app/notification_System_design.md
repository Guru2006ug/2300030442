# Stage 1

## Project Overview
This is a basic real-time notification system for students. After login, students receive placement-related updates (results, interview, offer, drive schedule) using an event type and priority. Notifications are stored in a `notifications` collection and can be pushed to logged-in users through SSE.

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

Note:
- This endpoint also stores the notification in the `notifications` collection.

### GET /users/notifications/placements
Return unique student IDs who received placement notifications (all time). Optional filter by last N days.

Query params:
- `days` (optional, positive number)

Example:
`GET /users/notifications/placements?days=7`

Response:
```
{ "studentIds": ["...", "..."] }
```

### GET /users/logs/next
Fetch logs one-by-one in order.

Query params:
- `after` (optional, log id for pagination)

Response:
```
{ "log": { ... }, "hasMore": true }
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

Notification fields:
- `studentId` (ObjectId, required)
- `eventType` (enum: `results`, `offer`, `interview`, `drive`)
- `priority` (String, required)
- `message` (String, required)
- `isRead` (Boolean, default `false`)

Log fields:
- `stack` (String, required)
- `level` (String, required)
- `package` (String, required)
- `message` (String, required)

## Logging
On successful sign in, message fetch, notification send, and log operations, the app stores a structured log record.

# Stage 2
Working with NoSQL is much more preferred rather than working with SQL Databse as when we scale up, their could arise more atributes that needs to be handled

AS NoSQL supports dynamic database schema we can add or remove attributes accordingly which supports elasticity of project rather than working on single pre-fixed database schema which becomes difficult when we scale up the users and attributes


# Stage 3

## Unread Notification Query (Legacy MySQL Case)
Basic query that becomes slow with many users/rows:
```
SELECT * FROM notifications
WHERE studentID=1042 AND isRead = false
ORDER BY createdAt DESC;
```

Why it is slow:
- Full table scan if there is no composite index on `user_id` and `is_read`.
- Sorting many rows on `created_at` without an index forces extra work.

Better query in MySQL:
1. Add a composite index for the filter and sort:
```
CREATE INDEX idx_notifications_user_read_created
ON notifications (user_id, is_read, created_at DESC);
```
2. Use a limited fetch for pagination:
```
SELECT id, user_id, message, created_at
FROM notifications
WHERE user_id = ? AND is_read = false
ORDER BY created_at DESC
LIMIT 50;
```

## Better Query Using Current (MongoDB) Approach
Use a separate `notifications` collection and index on `userId`, `isRead`, and `createdAt`:
```
db.notifications.createIndex({ userId: 1, isRead: 1, createdAt: -1 });
```

Fetch unread notifications efficiently:
```
db.notifications.find(
	{ userId: ObjectId("USER_ID"), isRead: false },
	{ message: 1, createdAt: 1 }
).sort({ createdAt: -1 }).limit(50);
```

## Mongo Query: Students With Placement Notifications
Assume `notifications` has `eventType` as an enum (e.g., `results`, `offer`) and `studentId`.
```
db.notifications.aggregate([
	{
		$match: {
			eventType: { $in: ["results","offer"] }
		}
	},
	{
		$group: {
			_id: "$studentId"
		}
	}
]);
```

Optional: filter by last N days
```
const days=7;
const since=new Date(Date.now() - days*24*60*60*1000);

db.notifications.aggregate([
	{
		$match: {
			eventType: { $in: ["results","offer"] },
			createdAt: { $gte: since }
		}
	},
	{
		$group: {
			_id: "$studentId"
		}
	}
]);
```




# Stage 4



