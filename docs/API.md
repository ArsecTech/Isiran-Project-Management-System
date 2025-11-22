# Isiran API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

All endpoints (except login/register) require JWT authentication:

```
Authorization: Bearer {token}
```

## Projects API

### Get Projects List

```http
GET /projects?pageNumber=1&pageSize=10&searchTerm=&status=&priority=
```

**Response:**
```json
{
  "items": [
    {
      "id": "guid",
      "name": "Project Name",
      "code": "PROJ001",
      "status": 1,
      "priority": 2,
      "startDate": "2024-01-01",
      "endDate": "2024-12-31",
      "budget": 100000,
      "actualCost": 50000,
      "progressPercentage": 50
    }
  ],
  "totalCount": 100,
  "pageNumber": 1,
  "pageSize": 10,
  "totalPages": 10,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

### Get Project by ID

```http
GET /projects/{id}
```

### Create Project

```http
POST /projects
Content-Type: application/json

{
  "name": "New Project",
  "code": "PROJ002",
  "description": "Project description",
  "priority": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "budget": 100000,
  "projectManagerId": "guid",
  "ownerId": "guid"
}
```

### Update Project

```http
PUT /projects/{id}
Content-Type: application/json

{
  "name": "Updated Project Name",
  "description": "Updated description",
  "priority": 2,
  "budget": 150000
}
```

### Delete Project

```http
DELETE /projects/{id}
```

## Tasks API

### Get Task by ID

```http
GET /tasks/{id}
```

**Response:**
```json
{
  "id": "guid",
  "projectId": "guid",
  "name": "Task Name",
  "description": "Task description",
  "type": 0,
  "status": 1,
  "priority": 2,
  "startDate": "2024-01-01",
  "endDate": "2024-01-15",
  "duration": 14,
  "percentComplete": 50,
  "assignedToId": "guid",
  "assignedToName": "John Doe",
  "wbsCode": "1.1",
  "dependencies": []
}
```

### Create Task

```http
POST /tasks
Content-Type: application/json

{
  "projectId": "guid",
  "name": "New Task",
  "description": "Task description",
  "type": 0,
  "priority": 1,
  "parentTaskId": "guid",
  "startDate": "2024-01-01",
  "duration": 5,
  "assignedToId": "guid"
}
```

### Update Task

```http
PUT /tasks/{id}
Content-Type: application/json

{
  "name": "Updated Task Name",
  "description": "Updated description",
  "priority": 2,
  "duration": 10
}
```

### Move Task

```http
POST /tasks/{id}/move
Content-Type: application/json

{
  "newParentTaskId": "guid",
  "newDisplayOrder": 5
}
```

### Update Task Dependencies

```http
POST /tasks/{id}/dependencies
Content-Type: application/json

{
  "dependencies": [
    {
      "predecessorTaskId": "guid",
      "successorTaskId": "guid",
      "type": 0,
      "lag": 0
    }
  ]
}
```

## Gantt API

### Get Schedule

```http
GET /gantt/project/{projectId}/schedule
```

**Response:**
```json
{
  "taskSchedules": [
    {
      "taskId": "guid",
      "calculatedStartDate": "2024-01-01",
      "calculatedEndDate": "2024-01-15",
      "calculatedDuration": 14,
      "isOnCriticalPath": true,
      "slack": 0
    }
  ],
  "projectStartDate": "2024-01-01",
  "projectEndDate": "2024-12-31",
  "totalDuration": 365
}
```

### Get Critical Path

```http
GET /gantt/project/{projectId}/critical-path
```

### Get Resource Allocation

```http
GET /gantt/project/{projectId}/resource-allocation
```

## Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success (no content)
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Error Response Format

```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "statusCode": 400
}
```

