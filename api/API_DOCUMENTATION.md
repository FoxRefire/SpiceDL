# SpiceDL API Documentation

This document provides detailed information on how to use the SpiceDL API server.

## Table of Contents

- [Basic Information](#basic-information)
- [Endpoint List](#endpoint-list)
- [Endpoint Details](#endpoint-details)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Usage Examples](#usage-examples)
- [FAQ](#faq)

## Basic Information

### Base URL

By default, the API server starts at the following URL:

```
http://127.0.0.1:5985
```

This can be changed in settings (via GUI settings window or `config.json`).

### Request Format

- **Content-Type**: `application/json` (for POST requests)
- **Methods**: GET, POST
- **Encoding**: UTF-8

### Response Format

All responses are returned in JSON format.

## Endpoint List

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/download` | Send Spotify URL to start download |
| GET | `/status` | Get download progress |
| POST | `/cancel` | Cancel download |
| GET | `/health` | Server health check |
| POST | `/open-settings` | Open GUI settings window |

## Endpoint Details

### POST /download

Accepts a Spotify URL and starts a download.

#### Request

**URL**: `http://127.0.0.1:5985/download`

**Method**: `POST`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "url": "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"
}
```

**Parameters**:
- `url` (string, required): Spotify URL
  - Supported formats:
    - Track: `https://open.spotify.com/track/{track_id}`
    - Album: `https://open.spotify.com/album/{album_id}`
    - Playlist: `https://open.spotify.com/playlist/{playlist_id}`
    - Artist: `https://open.spotify.com/artist/{artist_id}`

#### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "download_id": "dl_20240101_120000_123456",
  "message": "Download started"
}
```

**Error (400 Bad Request)**:
```json
{
  "error": "Missing 'url' parameter"
}
```

or

```json
{
  "error": "Invalid Spotify URL format"
}
```

**Error (500 Internal Server Error)**:
```json
{
  "error": "Error message here"
}
```

#### Usage Examples

**cURL**:
```bash
curl -X POST http://127.0.0.1:5985/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"}'
```

**Python (requests)**:
```python
import requests

url = "http://127.0.0.1:5985/download"
payload = {
    "url": "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"
}
response = requests.post(url, json=payload)
print(response.json())
```

**JavaScript (fetch)**:
```javascript
fetch('http://127.0.0.1:5985/download', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

---

### GET /status

Gets download progress.

#### Request

**URL**: `http://127.0.0.1:5985/status`

**Method**: `GET`

**Query Parameters**:
- `id` (string, optional): Specify a specific download ID. If omitted, returns status of all downloads.

#### Response

**Get Specific Download (200 OK)**:
```json
{
  "id": "dl_20240101_120000_123456",
  "url": "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
  "status": "downloading",
  "progress": 45,
  "message": "Downloading...",
  "started_at": "2024-01-01T12:00:00.123456",
  "completed_at": null,
  "error": null
}
```

**Get All Downloads (200 OK)**:
```json
{
  "downloads": [
    {
      "id": "dl_20240101_120000_123456",
      "url": "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
      "status": "completed",
      "progress": 100,
      "message": "Download completed successfully",
      "started_at": "2024-01-01T12:00:00.123456",
      "completed_at": "2024-01-01T12:05:30.654321",
      "error": null
    },
    {
      "id": "dl_20240101_120100_789012",
      "url": "https://open.spotify.com/album/...",
      "status": "downloading",
      "progress": 30,
      "message": "Downloading...",
      "started_at": "2024-01-01T12:01:00.789012",
      "completed_at": null,
      "error": null
    }
  ],
  "total": 2
}
```

**Download Not Found (200 OK)**:
```json
{
  "error": "Download not found"
}
```

#### Status Values

- `starting`: Download is starting
- `downloading`: Downloading
- `completed`: Download completed
- `failed`: Download failed
- `cancelled`: Download was cancelled

#### Usage Examples

**cURL**:
```bash
# Get status of all downloads
curl http://127.0.0.1:5985/status

# Get status of a specific download
curl "http://127.0.0.1:5985/status?id=dl_20240101_120000_123456"
```

**Python (requests)**:
```python
import requests
import time

# Start download
download_response = requests.post(
    "http://127.0.0.1:5985/download",
    json={"url": "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"}
)
download_id = download_response.json()["download_id"]

# Poll progress
while True:
    status_response = requests.get(
        f"http://127.0.0.1:5985/status?id={download_id}"
    )
    status = status_response.json()
    
    print(f"Status: {status['status']}, Progress: {status['progress']}%")
    
    if status['status'] in ['completed', 'failed', 'cancelled']:
        break
    
    time.sleep(2)  # Wait 2 seconds
```

**JavaScript (fetch)**:
```javascript
// Get status of all downloads
fetch('http://127.0.0.1:5985/status')
  .then(response => response.json())
  .then(data => {
    console.log(`Total downloads: ${data.total}`);
    data.downloads.forEach(dl => {
      console.log(`${dl.id}: ${dl.status} (${dl.progress}%)`);
    });
  });

// Get status of a specific download
const downloadId = 'dl_20240101_120000_123456';
fetch(`http://127.0.0.1:5985/status?id=${downloadId}`)
  .then(response => response.json())
  .then(data => console.log(data));
```

---

### POST /cancel

Cancels a running download.

#### Request

**URL**: `http://127.0.0.1:5985/cancel`

**Method**: `POST`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "id": "dl_20240101_120000_123456"
}
```

**Parameters**:
- `id` (string, required): ID of the download to cancel

#### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "message": "Download cancelled"
}
```

**Error (400 Bad Request)**:
```json
{
  "error": "Missing 'id' parameter"
}
```

**Error (404 Not Found)**:
```json
{
  "error": "Download not found or cannot be cancelled"
}
```

#### Usage Examples

**cURL**:
```bash
curl -X POST http://127.0.0.1:5985/cancel \
  -H "Content-Type: application/json" \
  -d '{"id": "dl_20240101_120000_123456"}'
```

**Python (requests)**:
```python
import requests

response = requests.post(
    "http://127.0.0.1:5985/cancel",
    json={"id": "dl_20240101_120000_123456"}
)
print(response.json())
```

**JavaScript (fetch)**:
```javascript
fetch('http://127.0.0.1:5985/cancel', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    id: 'dl_20240101_120000_123456'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

---

### POST /open-settings

Opens the GUI settings window. Calling this endpoint displays the settings window on the server side.

#### Request

**URL**: `http://127.0.0.1:5985/open-settings`

**Method**: `POST`

**Headers**:
```
Content-Type: application/json
```

**Body**: None (empty JSON object is acceptable)

#### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "message": "Settings window opened"
}
```

**Error (500 Internal Server Error)**:
```json
{
  "error": "Error message here"
}
```

#### Usage Examples

**cURL**:
```bash
curl -X POST http://127.0.0.1:5985/open-settings \
  -H "Content-Type: application/json"
```

**Python (requests)**:
```python
import requests

response = requests.post("http://127.0.0.1:5985/open-settings")
print(response.json())
```

**JavaScript (fetch)**:
```javascript
fetch('http://127.0.0.1:5985/open-settings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

---

### GET /health

Performs a server health check. Used to verify that the server is running properly.

#### Request

**URL**: `http://127.0.0.1:5985/health`

**Method**: `GET`

#### Response

**Success (200 OK)**:
```json
{
  "status": "ok"
}
```

#### Usage Examples

**cURL**:
```bash
curl http://127.0.0.1:5985/health
```

**Python (requests)**:
```python
import requests

response = requests.get("http://127.0.0.1:5985/health")
print(response.json())  # {"status": "ok"}
```

**JavaScript (fetch)**:
```javascript
fetch('http://127.0.0.1:5985/health')
  .then(response => response.json())
  .then(data => console.log(data));
```

## Response Format

### Success Response

All success responses return HTTP status code `200`.

### Error Response

Error responses have the following format:

```json
{
  "error": "Error message here"
}
```

**HTTP Status Codes**:
- `400`: Bad request (missing parameters, format errors, etc.)
- `404`: Resource not found (download ID does not exist, etc.)
- `500`: Internal server error

## Error Handling

### Common Errors

#### 1. "Missing 'url' parameter"
- **Cause**: `url` parameter not sent to `/download` endpoint
- **Solution**: Include `url` field in request body

#### 2. "Invalid Spotify URL format"
- **Cause**: URL sent is not in Spotify URL format
- **Solution**: Send a valid Spotify URL (must start with `https://open.spotify.com/...`)

#### 3. "Download not found"
- **Cause**: Specified download ID does not exist
- **Solution**: Use a valid download ID

#### 4. "Download not found or cannot be cancelled"
- **Cause**: Download does not exist or is already completed/failed/cancelled
- **Solution**: Only running downloads can be cancelled

## Usage Examples

### Complete Workflow Example (Python)

```python
import requests
import time

BASE_URL = "http://127.0.0.1:5985"

# 1. Health check
health = requests.get(f"{BASE_URL}/health")
print("Server status:", health.json())

# 2. Start download
spotify_url = "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"
download_response = requests.post(
    f"{BASE_URL}/download",
    json={"url": spotify_url}
)

if download_response.status_code == 200:
    download_id = download_response.json()["download_id"]
    print(f"Download started: {download_id}")
    
    # 3. Monitor progress
    while True:
        status_response = requests.get(
            f"{BASE_URL}/status",
            params={"id": download_id}
        )
        status = status_response.json()
        
        print(f"Status: {status['status']}, Progress: {status['progress']}%")
        print(f"Message: {status['message']}")
        
        if status['status'] == 'completed':
            print("Download completed successfully!")
            break
        elif status['status'] == 'failed':
            print(f"Download failed: {status.get('error', 'Unknown error')}")
            break
        elif status['status'] == 'cancelled':
            print("Download was cancelled")
            break
        
        time.sleep(2)  # Wait 2 seconds before checking again
else:
    print(f"Failed to start download: {download_response.json()}")
```

### Managing Multiple Downloads (JavaScript)

```javascript
const BASE_URL = 'http://127.0.0.1:5985';

// Function to start download
async function startDownload(url) {
  const response = await fetch(`${BASE_URL}/download`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url })
  });
  
  const data = await response.json();
  return data.download_id;
}

// Function to get status
async function getStatus(downloadId) {
  const response = await fetch(`${BASE_URL}/status?id=${downloadId}`);
  return await response.json();
}

// Get status of all downloads
async function getAllStatuses() {
  const response = await fetch(`${BASE_URL}/status`);
  return await response.json();
}

// Usage example
async function downloadMultipleTracks() {
  const urls = [
    'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
    'https://open.spotify.com/track/5Z9KJZvQzH6PFmb8SNkxuk',
    'https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6'
  ];
  
  // Start all downloads
  const downloadIds = await Promise.all(
    urls.map(url => startDownload(url))
  );
  
  console.log('Downloads started:', downloadIds);
  
  // Check status periodically
  const interval = setInterval(async () => {
    const statuses = await getAllStatuses();
    console.log(`Total: ${statuses.total} downloads`);
    
    statuses.downloads.forEach(dl => {
      console.log(`${dl.id}: ${dl.status} (${dl.progress}%)`);
    });
    
    // Stop when all are done
    const allDone = statuses.downloads.every(
      dl => ['completed', 'failed', 'cancelled'].includes(dl.status)
    );
    
    if (allDone) {
      clearInterval(interval);
      console.log('All downloads finished');
    }
  }, 3000);  // Check every 3 seconds
}

// Run
downloadMultipleTracks();
```

## FAQ

### Q: Can I start multiple downloads simultaneously?

A: Yes, you can. You can start multiple downloads simultaneously by sending multiple `/download` requests.

### Q: How often is download progress updated?

A: Progress is updated based on spotDL output. You can poll the `/status` endpoint to get the latest status. Recommended polling interval is 2-5 seconds.

### Q: Where are downloaded files saved?

A: Files are saved to the download folder specified in settings. Default is `~/Music/SpiceDL`. You can change this in the GUI settings window or `config.json`.

### Q: What happens to in-progress downloads when the server is restarted?

A: When the server is restarted, in-progress download information is lost. The download itself may continue if the spotDL process continues, but you won't be able to track its status via the API.

### Q: What Spotify URL formats are supported?

A: The following formats are supported:
- Track: `https://open.spotify.com/track/{id}`
- Album: `https://open.spotify.com/album/{id}`
- Playlist: `https://open.spotify.com/playlist/{id}`
- Artist: `https://open.spotify.com/artist/{id}`

### Q: How do I debug when an error occurs?

A: When a download fails, the `/status` endpoint response includes an `error` field. This field contains error details. Also check the server console output.

### Q: Can I change the API server port?

A: Yes, you can change it from the GUI settings window. You can also edit the `config.json` file directly.

### Q: Can I access the API remotely?

A: By default, it only listens on `127.0.0.1` (localhost). To allow remote access, change `host` to `0.0.0.0` in settings. However, be careful about security.

---

## Support

If you encounter issues or have questions, please report them in the Issues section of the project's GitHub repository.
