# Tao HQ Console API Documentation

This document outlines the API endpoints available in the Tao HQ backend. Following the transition to a purely headless architecture, all functionality is exposed exclusively via these REST endpoints.

There are two primary methods of authentication:
1. **Console Auth (`console_authenticated` Cookie)**: Used for internal dashboard/admin access.
2. **API Keys (`Authorization: Bearer <key>` or `?key=<key>`)**: Used for programmatic access by external clients.

---

## Content & CMS API

### `GET /api/content/:slug`
Fetches a published CMS entry.
- **Auth Required**: API Key
- **Response**: The raw body of the content. The `Content-Type` header automatically reflects the content type (`text/plain`, `application/json`, or `text/markdown`).
- **Errors**: `404 Not Found` if unpublished or doesn't exist. `401 Unauthorized` if API key is invalid.

### `PATCH /api/content/:slug`
Updates the body content of a specific CMS entry.
- **Auth Required**: API Key
- **Request Body (JSON)**:
  ```json
  {
    "body": "The new content body..."
  }
  ```
- **Response**: The updated content row data.
- **Errors**: `400 Bad Request` if payload is missing `body` or `slug`. `404` if entry doesn't exist. `401` if unauthorized.

### `GET /api/cms`
Retrieves a list of all CMS entries, ordered by newest first.
- **Auth Required**: None (Currently unprotected; previously used internally by the console).
- **Response**: JSON Array of `content` rows.

---

## API Keys Management

These endpoints are strictly internal and require the admin console cookie.

### `GET /api/keys`
Lists all active API keys.
- **Auth Required**: Console Cookie (`console_authenticated=true`)
- **Response**: JSON Array of API key objects (excluding the hashed full key).

### `POST /api/keys`
Generates a new API key.
- **Auth Required**: Console Cookie
- **Request Body (JSON)**:
  ```json
  {
    "name": "Production Key"
  }
  ```
- **Response**: Returns the newly created key, including the `fullKey` (only shown once on creation).

### `DELETE /api/keys/:id`
Revokes an active API key.
- **Auth Required**: Console Cookie
- **Response**: 200 OK empty response.

---

## CDN & Assets API

The CDN APIs support **both** Console Cookie (for internal admin usage) and API Key (for programmatic uploads/management).

### `GET /api/cdn/assets`
Lists all uploaded CDN assets.
- **Auth Required**: Console Cookie OR API Key
- **Response**: JSON Array of asset metadata records, including their `publicUrl`.

### `POST /api/cdn/assets`
Uploads a new file to the CDN and backing storage bucket.
- **Auth Required**: Console Cookie OR API Key
- **Request Format**: `multipart/form-data`
  - `file`: (Required) The binary file payload (Max 50MB).
  - `path`: (Optional) Custom virtual path/key for the asset. Defaults to filename.
  - `access`: (Optional) Visibility setting. `"public"` or `"api_key"`. Defaults to `"public"`.
- **Response (201)**: Asset metadata.

### `GET /api/cdn/assets/*key`
Retrieves and downloads an asset from the CDN.
- **Auth Required**: 
  - If asset `access` is `"public"`: **None** (Fully public).
  - If asset `access` is `"api_key"`: Console Cookie OR API Key.
- **Response**: The raw file binary stream with appropriate `Content-Type` and `Cache-Control` headers.

### `DELETE /api/cdn/assets/*key`
Deletes a specific asset from the CDN database and backing bucket.
- **Auth Required**: Console Cookie OR API Key
- **Response**: 200 OK empty response.
