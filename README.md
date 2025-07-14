# API Docs MCP

API Docs MCP is a Model Context Protocol (MCP) server that provides tools for loading, parsing, and interacting with API documentation (OpenAPI/Swagger specs) and integrates with Google Gemini AI for code generation, analysis, and chat. This project is designed to help developers explore APIs, generate code samples, and leverage AI-powered assistance for their projects.(it is feasibile within VS code IDE)

## Features

- **Load API Documentation**: Load and parse OpenAPI/Swagger specifications from a URL.
- **Search Endpoints**: Search for API endpoints by keyword.
- **Get Endpoint Details**: Retrieve detailed information about specific API endpoints, including parameters and responses.
- **Generate Code Samples**: Automatically generate code samples for API endpoints in JavaScript, Python, or cURL.
- **Gemini AI Integration**:
  - Test your Gemini API key and connection
  - Chat with Gemini AI
  - Analyze and review code using Gemini
  - Generate code based on requirements using Gemini
- **MCP Server**: Runs as a Model Context Protocol server using stdio transport for integration with compatible tools.

## Getting Started

### Prerequisites
- Node.js (v18 or newer recommended)
- npm

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/WebSinker/api-docs-mcp.git
   cd api-docs-mcp
   ```
2. Install dependencies:
   ```sh
   npm install
   ```

### Build

```sh
npm run build
```

### Run

```sh
npm start
```

The server will start and listen for MCP stdio connections.

## Usage

This project is intended to be used as an MCP server. You can connect to it from compatible clients or integrate it into your toolchain. The server exposes tools for API documentation and Gemini AI operations.

### Available Tools

- `load_api_docs`: Load and parse API documentation from a URL.
- `search_endpoints`: Search for API endpoints by keyword.
- `get_endpoint_details`: Get detailed information about a specific endpoint.
- `generate_code_sample`: Generate code sample for an endpoint (JavaScript, Python, cURL).
- `test_gemini_api`: Test your Gemini API key and connection.
- `gemini_chat`: Chat with Gemini AI using your API key.
- `gemini_analyze_code`: Use Gemini to analyze and review code.
- `gemini_generate_code`: Use Gemini to generate code based on requirements.

### Resources

- `api://loaded-apis`: List of all loaded API specifications.

### Prompts

- `api-integration-helper`: Help integrate with a loaded API.
- `gemini-project-setup`: Help set up a Gemini AI project.

## Configuration

- To use Gemini features, you need a valid Gemini API key from Google AI Studio: https://aistudio.google.com/

## Project Structure

- `src/` - TypeScript source code
- `build/` - Compiled JavaScript output
- `package.json` - Project metadata and scripts
- `tsconfig.json` - TypeScript configuration

## License

MIT License

## Author

[WebSinker](https://github.com/WebSinker)
