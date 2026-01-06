# API Documentation

Complete API documentation for all endpoints that the frontend can interact with.

## Base URL

- **Production**: `https://<your-region>-<your-project-id>.cloudfunctions.net`
- **Local Development**: `http://localhost:5001/<your-project-id>/<region>`

## Authentication

Most endpoints require Firebase Authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

---

## Endpoints

### 1. Authenticate User

Authenticate a user and receive Firebase ID token.

**Endpoint:** `POST /authenticate`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Success Response (200 OK):**
```json
{
  "idToken": "string",
  "refreshToken": "string",
  "expiresIn": "string"
}
```

**Error Responses:**
- **400 Bad Request:**
```json
{
  "error": "Email and password required"
}
```

- **401 Unauthorized:**
```json
{
  "error": "Authentication failed"
}
```

- **500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

---

### 2. Get All Stories Data

Retrieve all stories with their associated chapters, characters, plots, and places.

**Endpoint:** `GET /getData`

**Headers:**
```
Authorization: Bearer <firebase-id-token> (optional)
```

**Request Body:** None

**Query Parameters:** None

**Success Response (200 OK):**
```json
[
  {
    "id": "string",
    "title": "string",
    "genre": "string",
    "userId": "string",
    "generatedContent": "string",
    "generatedAt": "timestamp",
    "chapters": [
      {
        "id": "string",
        "chapterNumber": "number",
        "title": "string",
        "content": "string",
        "generatedAt": "timestamp",
        "createdAt": "timestamp"
      }
    ],
    "characters": [
      {
        "id": "string",
        "name": "string",
        "role": "string",
        "description": "string"
      }
    ],
    "plots": [
      {
        "id": "string",
        "type": "string",
        "description": "string"
      }
    ],
    "places": [
      {
        "id": "string",
        "name": "string",
        "description": "string"
      }
    ]
  }
]
```

**Error Responses:**
- **404 Not Found:**
```
"No stories found"
```

- **500 Internal Server Error:**
```
"Internal Server Error"
```

---

### 3. Generate Story (Asynchronous)

Start asynchronous story generation. Returns a job ID that can be used to check status.

**Endpoint:** `POST /generateStory`

**Headers:**
```
Authorization: Bearer <firebase-id-token> (required)
Content-Type: application/json
```

**Request Body:**
```json
{
  "storyId": "string (required)",
  "genre": "string (optional)",
  "tone": "string (optional)",
  "length": "string (optional, one of: short/medium/long)"
}
```

**Success Response (202 Accepted):**
```json
{
  "jobId": "string",
  "status": "queued",
  "message": "Story generation started"
}
```

**Error Responses:**
- **400 Bad Request:**
```json
{
  "error": "storyId is required"
}
```

- **401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

- **403 Forbidden:**
```json
{
  "error": "Forbidden: Story not found or access denied"
}
```

- **500 Internal Server Error:**
```json
{
  "error": "Failed to start story generation",
  "details": "string"
}
```

---

### 4. Generate Chapter (Asynchronous)

Start asynchronous chapter generation for a specific chapter number.

**Endpoint:** `POST /generateChapter`

**Headers:**
```
Authorization: Bearer <firebase-id-token> (required)
Content-Type: application/json
```

**Request Body:**
```json
{
  "storyId": "string (required)",
  "chapterNumber": "number (required)"
}
```

**Success Response (202 Accepted):**
```json
{
  "jobId": "string",
  "status": "queued",
  "message": "Chapter generation started"
}
```

**Error Responses:**
- **400 Bad Request:**
```json
{
  "error": "storyId is required"
}
```
or
```json
{
  "error": "chapterNumber is required and must be a number"
}
```

- **401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

- **403 Forbidden:**
```json
{
  "error": "Forbidden: Story not found or access denied"
}
```

- **500 Internal Server Error:**
```json
{
  "error": "Failed to start chapter generation",
  "details": "string"
}
```

---

### 5. Get Job Status

Check the status of a generation job.

**Endpoint:** `GET /jobStatus/:jobId`

**Headers:**
```
Authorization: Bearer <firebase-id-token> (required)
```

**Request Body:** None

**URL Parameters:**
- `jobId` (string, required) - The job ID returned from generateStory or generateChapter

**Success Response (200 OK):**
```json
{
  "id": "string",
  "storyId": "string",
  "type": "generateStory | generateChapter | brainstorm",
  "status": "queued | processing | completed | failed",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "startedAt": "timestamp (optional)",
  "completedAt": "timestamp (optional)",
  "progress": "number (optional, 0-100)",
  "result": {
    "storyId": "string",
    "content": "string (for generateStory)",
    "chapterId": "string (for generateChapter)",
    "chapterNumber": "number (for generateChapter)",
    "title": "string (for generateChapter)"
  },
  "error": "string (only present if status is 'failed')",
  "parameters": {
    "genre": "string (optional)",
    "tone": "string (optional)",
    "length": "string (optional)",
    "chapterNumber": "number (optional)"
  }
}
```

**Error Responses:**
- **400 Bad Request:**
```json
{
  "error": "jobId is required"
}
```

- **401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

- **403 Forbidden:**
```json
{
  "error": "Forbidden"
}
```

- **404 Not Found:**
```json
{
  "error": "Job not found"
}
```
or
```json
{
  "error": "Story not found"
}
```

- **500 Internal Server Error:**
```json
{
  "error": "Failed to fetch job status",
  "details": "string"
}
```

---

### 6. Get Story Jobs

Get all jobs for a specific story.

**Endpoint:** `GET /storyJobs/:storyId`

**Headers:**
```
Authorization: Bearer <firebase-id-token> (required)
```

**Request Body:** None

**URL Parameters:**
- `storyId` (string, required) - The story ID

**Note:** The storyId can also be provided in the request body or query string.

**Success Response (200 OK):**
```json
{
  "jobs": [
    {
      "id": "string",
      "storyId": "string",
      "type": "generateStory | generateChapter | brainstorm",
      "status": "queued | processing | completed | failed",
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "startedAt": "timestamp (optional)",
      "completedAt": "timestamp (optional)",
      "progress": "number (optional)",
      "result": "object (optional)",
      "error": "string (optional)",
      "parameters": "object"
    }
  ]
}
```

**Error Responses:**
- **400 Bad Request:**
```json
{
  "error": "storyId is required"
}
```

- **401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

- **403 Forbidden:**
```json
{
  "error": "Forbidden: Story not found or access denied"
}
```

- **500 Internal Server Error:**
```json
{
  "error": "Failed to fetch story jobs",
  "details": "string"
}
```

---

### 7. Brainstorm Ideas

Generate brainstorming ideas synchronously (characters, plots, places, or themes).

**Endpoint:** `POST /brainstormIdeas`

**Headers:**
```
Authorization: Bearer <firebase-id-token> (required)
Content-Type: application/json
```

**Request Body:**
```json
{
  "storyId": "string (required)",
  "type": "string (required, one of: characters, plots, places, themes)",
  "prompt": "string (optional)",
  "count": "number (optional, default: 5)"
}
```

**Success Response (200 OK):**
```json
{
  "storyId": "string",
  "type": "characters | plots | places | themes",
  "ideas": [
    {
      "text": "string"
    }
  ]
}
```

**Error Responses:**
- **400 Bad Request:**
```json
{
  "error": "storyId is required"
}
```
or
```json
{
  "error": "type is required and must be one of: characters, plots, places, themes"
}
```
or
```json
{
  "error": "type must be one of: characters, plots, places, themes"
}
```

- **401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

- **403 Forbidden:**
```json
{
  "error": "Forbidden: Story not found or access denied"
}
```

- **500 Internal Server Error:**
```json
{
  "error": "Failed to generate ideas",
  "details": "string"
}
```
or
```json
{
  "error": "Internal server error",
  "details": "string"
}
```

---

### 8. Brainstorm Character

Generate detailed character ideas synchronously.

**Endpoint:** `POST /brainstormCharacter`

**Headers:**
```
Authorization: Bearer <firebase-id-token> (required)
Content-Type: application/json
```

**Request Body:**
```json
{
  "storyId": "string (required)",
  "role": "string (optional, e.g., protagonist, antagonist)",
  "archetype": "string (optional, e.g., hero, villain)"
}
```

**Success Response (200 OK):**
```json
{
  "storyId": "string",
  "character": {
    "role": "string",
    "archetype": "string",
    "profile": "string"
  }
}
```

**Error Responses:**
- **400 Bad Request:**
```json
{
  "error": "storyId is required"
}
```

- **401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

- **403 Forbidden:**
```json
{
  "error": "Forbidden: Story not found or access denied"
}
```

- **500 Internal Server Error:**
```json
{
  "error": "Failed to generate character ideas",
  "details": "string"
}
```
or
```json
{
  "error": "Internal server error",
  "details": "string"
}
```

---

### 9. Brainstorm Plot

Generate plot ideas synchronously.

**Endpoint:** `POST /brainstormPlot`

**Headers:**
```
Authorization: Bearer <firebase-id-token> (required)
Content-Type: application/json
```

**Request Body:**
```json
{
  "storyId": "string (required)",
  "plotType": "string (optional, one of: conflict, twist, subplot, development, default: conflict)"
}
```

**Success Response (200 OK):**
```json
{
  "storyId": "string",
  "plotType": "conflict | twist | subplot | development",
  "plot": "string"
}
```

**Error Responses:**
- **400 Bad Request:**
```json
{
  "error": "storyId is required"
}
```

- **401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

- **403 Forbidden:**
```json
{
  "error": "Forbidden: Story not found or access denied"
}
```

- **500 Internal Server Error:**
```json
{
  "error": "Failed to generate plot ideas",
  "details": "string"
}
```
or
```json
{
  "error": "Internal server error",
  "details": "string"
}
```

---

### 10. Get Story Context

Retrieve all context for a story (story data, characters, places, plots, and chapters).

**Endpoint:** `GET /getStoryContext`

**Headers:**
```
Authorization: Bearer <firebase-id-token> (required)
```

**Request Body:** None

**Query Parameters:**
- `storyId` (string, required) - The story ID

**Note:** The storyId can also be provided in the request body.

**Success Response (200 OK):**
```json
{
  "story": {
    "id": "string",
    "title": "string",
    "genre": "string",
    "userId": "string",
    "generatedContent": "string",
    "generatedAt": "timestamp"
  },
  "characters": [
    {
      "id": "string",
      "name": "string",
      "role": "string",
      "description": "string"
    }
  ],
  "places": [
    {
      "id": "string",
      "name": "string",
      "description": "string"
    }
  ],
  "plots": [
    {
      "id": "string",
      "type": "string",
      "description": "string"
    }
  ],
  "chapters": [
    {
      "id": "string",
      "chapterNumber": "number",
      "title": "string",
      "content": "string",
      "generatedAt": "timestamp",
      "createdAt": "timestamp"
    }
  ]
}
```

**Note:** Chapters are sorted by `chapterNumber` in ascending order.

**Error Responses:**
- **400 Bad Request:**
```json
{
  "error": "storyId is required"
}
```

- **401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

- **403 Forbidden:**
```json
{
  "error": "Forbidden: Story not found or access denied"
}
```

- **500 Internal Server Error:**
```json
{
  "error": "Failed to fetch story context",
  "details": "string"
}
```

---

### 11. Update Context

Update a context element (character, place, or plot) for a story.

**Endpoint:** `POST /updateContext`

**Headers:**
```
Authorization: Bearer <firebase-id-token> (required)
Content-Type: application/json
```

**Request Body:**
```json
{
  "storyId": "string (required)",
  "type": "string (required, one of: character, place, plot)",
  "elementId": "string (required)",
  "data": {
    "name": "string (optional)",
    "description": "string (optional)",
    "role": "string (optional)",
    "type": "string (optional)",
    "...": "any other fields to update"
  }
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "character updated successfully"
}
```

**Error Responses:**
- **400 Bad Request:**
```json
{
  "error": "storyId is required"
}
```
or
```json
{
  "error": "type, elementId, and data are required"
}
```
or
```json
{
  "error": "type must be one of: character, place, plot"
}
```

- **401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

- **403 Forbidden:**
```json
{
  "error": "Forbidden: Story not found or access denied"
}
```

- **500 Internal Server Error:**
```json
{
  "error": "Failed to update context",
  "details": "string"
}
```

---

## Common Error Response Format

All endpoints may return the following error responses:

### 401 Unauthorized
Missing or invalid authentication token:
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
User does not own the story or access denied:
```json
{
  "error": "Forbidden: Story not found or access denied"
}
```
or
```json
{
  "error": "Forbidden"
}
```

### 400 Bad Request
Invalid request parameters:
```json
{
  "error": "Error message describing what's wrong"
}
```

### 404 Not Found
Resource not found:
```json
{
  "error": "Resource not found message"
}
```

### 500 Internal Server Error
Server error:
```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

---

## Notes

1. **Authentication**: Most endpoints require a valid Firebase ID token in the Authorization header. The `/authenticate` endpoint is the exception and does not require authentication.

2. **Story Ownership**: Endpoints that require `storyId` verify that the authenticated user owns the story. If not, a 403 Forbidden response is returned.

3. **Asynchronous Operations**: `generateStory` and `generateChapter` are asynchronous operations. They return a `jobId` immediately. Use the `getJobStatus` endpoint to check the progress and result.

4. **Synchronous Operations**: `brainstormIdeas`, `brainstormCharacter`, and `brainstormPlot` are synchronous operations that return results immediately.

5. **Timestamps**: All timestamp fields are Firestore Timestamp objects. In JSON responses, they may appear as objects with `seconds` and `nanoseconds` properties, or as ISO 8601 strings depending on serialization.

6. **CORS**: All endpoints support CORS for cross-origin requests.

7. **Job Status Values**:
   - `queued`: Job is waiting to be processed
   - `processing`: Job is currently being processed
   - `completed`: Job completed successfully
   - `failed`: Job failed with an error

8. **Progress Tracking**: For asynchronous jobs, the `progress` field indicates completion percentage (0-100) when available.

