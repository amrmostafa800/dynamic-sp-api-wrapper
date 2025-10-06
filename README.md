# Amazon Selling Partner API (SP-API) Wrapper with Bun

## Overview

This project is a REST API application built with [Bun](https://bun.sh/) that wraps the Amazon Selling Partner API (SP-API). Its core feature is an intelligent, long-polling rate limiter that ensures all requests to the SP-API adhere to the specified rate limits without returning "429 Too Many Requests" errors to the client.

Instead of failing, requests that exceed the rate limit are queued and executed as soon as the quota becomes available. This makes the API more resilient and simplifies client-side logic.

### Key Features

- **Built with Bun and Hono:** A modern, fast, and lightweight TypeScript stack.
- **Intelligent Rate Limiting:** Automatically handles SP-API rate limits with a token bucket algorithm.
- **Long-Polling Behavior:** Requests wait on the server until they can be processed, rather than failing.
- **Dynamic Routers:** One router per SP-API model (e.g., Orders, Catalog, etc.).
- **Type-Safe:** Auto-generated TypeScript types from the official SP-API models.
- **API Documentation:** Integrated Swagger UI for easy API exploration and testing.
- **Structured Logging:** Detailed logging with Pino for better observability.

---

## ⚠️ Critical Requirement for Clients

Clients calling this API **must** configure their HTTP request timeouts to be very high. A timeout of **5-10 minutes (300,000 to 600,000 ms)** is recommended.

This is because the server will hold a request open and wait if the SP-API rate limit has been reached. If the client's timeout is too short, the request will fail prematurely.

### Example Client Configuration (JavaScript `fetch`)

```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 300000); // 5-minute timeout

try {
  const response = await fetch('http://localhost:3000/api/orders/v0/orders?CreatedAfter=2023-01-01T00:00:00Z', {
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log(data);
} catch (error) {
  if (error.name === 'AbortError') {
    console.error('Request timed out.');
  } else {
    console.error('An error occurred:', error);
  }
}
```

---

## Project Setup

### 1. Prerequisites

- [Bun](https://bun.sh/docs/installation) installed on your machine.

### 2. Installation

Clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd <repository-directory>
bun install
```

### 3. Configuration

Create a `.env` file in the root of the project by copying the example file:

```bash
cp .env.example .env
```

Now, edit the `.env` file and add your Amazon Selling Partner API credentials:

```env
# Selling Partner API Credentials
SP_CLIENT_ID=your_client_id
SP_CLIENT_SECRET=your_client_secret
SP_REFRESH_TOKEN=your_refresh_token

# SP-API Configuration
SP_MARKETPLACE_ID=ATVPDKIKX0DER
SP_AWS_REGION=us-east-1

# Application Settings
SP_REQUEST_TIMEOUT=300000
LOG_LEVEL=info
```

---

## Running the Application

### 1. Build the Dynamic API

Before running the application for the first time, you must generate the dynamic routers and OpenAPI specification by running the build script:

```bash
bun run build
```

This command will scan all the SP-API models, generate TypeScript types, create the necessary routers, and build a complete OpenAPI specification file. You only need to run this command once, or whenever the underlying SP-API models in the `/models` directory are updated.

### 2. Start the Server

To start the development server, run:

```bash
bun run start
```

The server will start on port 3000 (or the port specified by the `PORT` environment variable).

## API Documentation

Once the server is running, you can access the interactive Swagger UI documentation at:

[http://localhost:3000/ui](http://localhost:3000/ui)

This interface allows you to explore all available endpoints, view their parameters, and execute test requests directly from your browser.

## Project Structure

```
project/
├── src/
│   ├── routers/            # Hono routers for each SP-API model
│   │   └── orders.ts
│   ├── services/           # Business logic and external service integrations
│   │   ├── sp-api.service.ts
│   │   └── rate-limiter.service.ts
│   ├── types/              # Auto-generated TypeScript types
│   │   └── orders.types.ts
│   ├── config/             # Configuration loader
│   │   └── index.ts
│   └── index.ts            # Main application entry point
├── .env.example            # Example environment variables
├── package.json
├── tsconfig.json
└── README.md
```