# Agent API Endpoints

This document describes all the Firebase Functions endpoints for interacting with the AI story agent.

## Authentication

All endpoints require Firebase Authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## Story Generation (Asynchronous)

### POST /generateStory

Start asynchronous story generation.

**Request:**
```json
{
  "storyId": "story-id",
  "genre": "fantasy",  // optional
  "tone": "dark",      // optional
  "length": "medium"   // optional: short/medium/long
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "job-id",
  "status": "queued",
  "message": "Story generation started"
}
```

### POST /generateChapter

Start asynchronous chapter generation.

**Request:**
```json
{
  "storyId": "story-id",
  "chapterNumber": 1
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "job-id",
  "status": "queued",
  "message": "Chapter generation started"
}
```

### GET /jobStatus/:jobId

Check the status of a generation job.

**Response:**
```json
{
  "id": "job-id",
  "storyId": "story-id",
  "type": "generateStory",
  "status": "queued|processing|completed|failed",
  "progress": 50,
  "result": { ... },  // if completed
  "error": "...",     // if failed
  "createdAt": "...",
  "updatedAt": "..."
}
```

### GET /storyJobs/:storyId

Get all jobs for a story.

**Response:**
```json
{
  "jobs": [
    { ... }
  ]
}
```

## Brainstorming (Synchronous)

### POST /brainstormIdeas

Generate brainstorming ideas.

**Request:**
```json
{
  "storyId": "story-id",
  "type": "characters|plots|places|themes",
  "prompt": "Additional requirements",  // optional
  "count": 5  // optional, default: 5
}
```

**Response:**
```json
{
  "storyId": "story-id",
  "type": "characters",
  "ideas": [
    { "text": "..." }
  ]
}
```

### POST /brainstormCharacter

Generate detailed character ideas.

**Request:**
```json
{
  "storyId": "story-id",
  "role": "protagonist",      // optional
  "archetype": "hero"          // optional
}
```

**Response:**
```json
{
  "storyId": "story-id",
  "character": {
    "role": "protagonist",
    "archetype": "hero",
    "profile": "..."
  }
}
```

### POST /brainstormPlot

Generate plot ideas.

**Request:**
```json
{
  "storyId": "story-id",
  "plotType": "conflict|twist|subplot|development"  // optional, default: conflict
}
```

**Response:**
```json
{
  "storyId": "story-id",
  "plotType": "conflict",
  "plot": "..."
}
```

## Context Management

### GET /getStoryContext

Retrieve all context for a story.

**Request:**
```
GET /getStoryContext?storyId=story-id
```

**Response:**
```json
{
  "story": { ... },
  "characters": [ ... ],
  "places": [ ... ],
  "plots": [ ... ],
  "chapters": [ ... ]
}
```

### POST /updateContext

Update a context element (character, place, or plot).

**Request:**
```json
{
  "storyId": "story-id",
  "type": "character|place|plot",
  "elementId": "element-id",
  "data": {
    "name": "...",
    ...
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "character updated successfully"
}
```

## Error Responses

All endpoints may return the following error responses:

- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: User does not own the story
- **400 Bad Request**: Invalid request parameters
- **404 Not Found**: Story or resource not found
- **500 Internal Server Error**: Server error

Error response format:
```json
{
  "error": "Error message",
  "details": "Additional error details"  // optional
}
```

