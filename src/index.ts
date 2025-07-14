#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { APIDocumentationParser } from './api-parser.js';

// Create server
const server = new Server(
  {
    name: 'api-docs-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

const apiParser = new APIDocumentationParser();

async function registerTools() {
  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'load_api_docs':
        return await handleLoadApiDocs(args);
      case 'search_endpoints':
        return await handleSearchEndpoints(args);
      case 'get_endpoint_details':
        return await handleGetEndpointDetails(args);
      case 'generate_code_sample':
        return await handleGenerateCodeSample(args);
      // New Gemini tools
      case 'test_gemini_api':
        return await handleTestGeminiApi(args);
      case 'gemini_chat':
        return await handleGeminiChat(args);
      case 'gemini_analyze_code':
        return await handleGeminiAnalyzeCode(args);
      case 'gemini_generate_code':
        return await handleGeminiGenerateCode(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  // Register available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        // Original API documentation tools
        {
          name: 'load_api_docs',
          description: 'Load and parse API documentation from a URL or file',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'URL to OpenAPI/Swagger spec' },
              apiName: { type: 'string', description: 'Name to identify this API' }
            },
            required: ['url', 'apiName']
          }
        },
        {
          name: 'search_endpoints',
          description: 'Search for API endpoints by keyword',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search term for endpoints' }
            },
            required: ['query']
          }
        },
        {
          name: 'get_endpoint_details',
          description: 'Get detailed information about a specific endpoint',
          inputSchema: {
            type: 'object',
            properties: {
              method: { type: 'string', description: 'HTTP method' },
              path: { type: 'string', description: 'Endpoint path' }
            },
            required: ['method', 'path']
          }
        },
        {
          name: 'generate_code_sample',
          description: 'Generate code sample for an endpoint',
          inputSchema: {
            type: 'object',
            properties: {
              method: { type: 'string', description: 'HTTP method' },
              path: { type: 'string', description: 'Endpoint path' },
              language: { type: 'string', description: 'Programming language (javascript, python, curl)' }
            },
            required: ['method', 'path', 'language']
          }
        },
        // New Gemini tools
        {
          name: 'test_gemini_api',
          description: 'Test your Gemini API key and connection',
          inputSchema: {
            type: 'object',
            properties: {
              apiKey: { type: 'string', description: 'Your Gemini API key' },
              testMessage: { type: 'string', description: 'Test message to send (default: "Hello, test message")' }
            },
            required: ['apiKey']
          }
        },
        {
          name: 'gemini_chat',
          description: 'Chat with Gemini AI using your API key',
          inputSchema: {
            type: 'object',
            properties: {
              apiKey: { type: 'string', description: 'Your Gemini API key' },
              message: { type: 'string', description: 'Message to send to Gemini' },
              model: { type: 'string', description: 'Model to use (default: gemini-2.0-flash-exp)' }
            },
            required: ['apiKey', 'message']
          }
        },
        {
          name: 'gemini_analyze_code',
          description: 'Use Gemini to analyze and review code',
          inputSchema: {
            type: 'object',
            properties: {
              apiKey: { type: 'string', description: 'Your Gemini API key' },
              code: { type: 'string', description: 'Code to analyze' },
              language: { type: 'string', description: 'Programming language' },
              analysisType: { type: 'string', description: 'Type of analysis (review, bugs, optimization, explanation)' }
            },
            required: ['apiKey', 'code']
          }
        },
        {
          name: 'gemini_generate_code',
          description: 'Use Gemini to generate code based on requirements',
          inputSchema: {
            type: 'object',
            properties: {
              apiKey: { type: 'string', description: 'Your Gemini API key' },
              requirements: { type: 'string', description: 'Code requirements or description' },
              language: { type: 'string', description: 'Programming language' },
              style: { type: 'string', description: 'Code style or framework preferences' }
            },
            required: ['apiKey', 'requirements']
          }
        }
      ]
    };
  });
}

// Original tool handlers (keeping existing functionality)
async function handleLoadApiDocs(args: any) {
  try {
    const response = await fetch(args.url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const spec = await response.json();
    apiParser.parseOpenAPI(spec, args.apiName);
    
    return {
      content: [
        {
          type: 'text',
          text: `Successfully loaded API documentation for ${args.apiName}. Found ${apiParser.getEndpoints(args.apiName).length} endpoints.`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error loading API docs: ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
}

async function handleSearchEndpoints(args: any) {
  const endpoints = apiParser.searchEndpoints(args.query);
  
  return {
    content: [
      {
        type: 'text',
        text: `Found ${endpoints.length} endpoints matching "${args.query}":\n\n` +
              endpoints.map(ep => `${ep.method} ${ep.path} - ${ep.description}`).join('\n')
      }
    ]
  };
}

async function handleGetEndpointDetails(args: any) {
  const endpoints = apiParser.searchEndpoints('');
  const endpoint = endpoints.find(ep => 
    ep.method === args.method.toUpperCase() && ep.path === args.path
  );
  
  if (!endpoint) {
    return {
      content: [
        {
          type: 'text',
          text: `Endpoint ${args.method} ${args.path} not found.`
        }
      ]
    };
  }

  const details = `
## ${endpoint.method} ${endpoint.path}

**Description:** ${endpoint.description}

**Parameters:**
${endpoint.parameters?.map(p => 
  `- ${p.name} (${p.type}${p.required ? ', required' : ''}): ${p.description}`
).join('\n') || 'None'}

**Responses:**
${endpoint.responses?.map(r => 
  `- ${r.statusCode}: ${r.description}`
).join('\n') || 'None'}
  `;

  return {
    content: [
      {
        type: 'text',
        text: details
      }
    ]
  };
}

async function handleGenerateCodeSample(args: any) {
  const { method, path, language } = args;
  
  let sample = '';
  
  switch (language.toLowerCase()) {
    case 'javascript':
      sample = `
// ${method} ${path}
const response = await fetch('${path}', {
  method: '${method}',
  headers: {
    'Content-Type': 'application/json',
  },
  // Add body for POST/PUT requests
});

const data = await response.json();
console.log(data);
      `;
      break;
      
    case 'python':
      sample = `
# ${method} ${path}
import requests

response = requests.${method.toLowerCase()}('${path}')
data = response.json()
print(data)
      `;
      break;
      
    case 'curl':
      sample = `
# ${method} ${path}
curl -X ${method} \\
  '${path}' \\
  -H 'Content-Type: application/json'
      `;
      break;
      
    default:
      sample = `Code generation for ${language} not supported yet.`;
  }

  return {
    content: [
      {
        type: 'text',
        text: sample
      }
    ]
  };
}

// New Gemini tool handlers
async function handleTestGeminiApi(args: any) {
  const { apiKey, testMessage = "Hello, this is a test message to verify my API key is working!" } = args;
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: testMessage
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API Error ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    const geminiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    return {
      content: [
        {
          type: 'text',
          text: `✅ **Gemini API Test Successful!**

**Your Message:** ${testMessage}

**Gemini Response:** ${geminiResponse}

**API Details:**
- Status: ${response.status} ${response.statusText}
- Model: gemini-2.0-flash-exp
- Response Time: Available
- API Key: Working correctly

Your Gemini API integration is ready for your AI project! 🚀`
        }
      ]
    };

  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Gemini API Test Failed**

**Error:** ${error instanceof Error ? error.message : String(error)}

**Common Issues:**
- Invalid API key
- API key doesn't have necessary permissions
- Network connectivity issues
- Rate limiting

**Next Steps:**
1. Verify your API key at https://aistudio.google.com/
2. Check if billing is enabled
3. Ensure API key has Generative AI permissions`
        }
      ]
    };
  }
}

async function handleGeminiChat(args: any) {
  const { apiKey, message, model = 'gemini-2.0-flash-exp' } = args;
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: message
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API Error ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    const geminiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    return {
      content: [
        {
          type: 'text',
          text: `**Your Message:** ${message}

**Gemini Response:**
${geminiResponse}`
        }
      ]
    };

  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error communicating with Gemini: ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
}

async function handleGeminiAnalyzeCode(args: any) {
  const { apiKey, code, language = '', analysisType = 'review' } = args;
  
  const prompts = {
    review: `Please review this ${language} code and provide feedback on code quality, best practices, and potential improvements:`,
    bugs: `Please analyze this ${language} code for potential bugs, errors, or issues:`,
    optimization: `Please analyze this ${language} code for performance optimizations and efficiency improvements:`,
    explanation: `Please explain how this ${language} code works, including its purpose and key components:`
  };

  const prompt = prompts[analysisType as keyof typeof prompts] || prompts.review;
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${prompt}\n\n\`\`\`${language}\n${code}\n\`\`\``
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API Error ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No analysis generated';

    return {
      content: [
        {
          type: 'text',
          text: `# Code Analysis (${analysisType})

**Language:** ${language}

**Analysis:**
${analysis}`
        }
      ]
    };

  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error analyzing code: ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
}

async function handleGeminiGenerateCode(args: any) {
  const { apiKey, requirements, language = '', style = '' } = args;
  
  const prompt = `Generate ${language} code based on these requirements:

Requirements: ${requirements}

${style ? `Style/Framework: ${style}` : ''}

Please provide clean, well-documented code with comments explaining key parts.`;
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API Error ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    const generatedCode = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No code generated';

    return {
      content: [
        {
          type: 'text',
          text: `# Generated Code

**Requirements:** ${requirements}
**Language:** ${language}
${style ? `**Style:** ${style}` : ''}

**Generated Code:**
${generatedCode}`
        }
      ]
    };

  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error generating code: ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
}

async function registerResources() {
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'api://loaded-apis',
          name: 'Loaded API Documentation',
          description: 'List of all loaded API specifications',
          mimeType: 'text/plain'
        }
      ]
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    
    if (uri === 'api://loaded-apis') {
      const apiList = apiParser.getLoadedApiNames().join('\n');
      
      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: `Loaded APIs:\n${apiList || 'No APIs loaded yet'}`
          }
        ]
      };
    }
    
    throw new Error(`Resource not found: ${uri}`);
  });
}

async function registerPrompts() {
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: 'api-integration-helper',
          description: 'Help integrate with a loaded API',
          arguments: [
            {
              name: 'task',
              description: 'What you want to accomplish with the API',
              required: true
            }
          ]
        },
        {
          name: 'gemini-project-setup',
          description: 'Help set up a Gemini AI project',
          arguments: [
            {
              name: 'projectType',
              description: 'Type of AI project you want to build',
              required: true
            }
          ]
        }
      ]
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    if (name === 'api-integration-helper') {
      return {
        description: 'API Integration Assistant',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `I need help with: ${(args as any)?.task || 'API integration'}

Please use the available API documentation tools to:
1. Search for relevant endpoints
2. Get detailed endpoint information
3. Generate appropriate code samples
4. Provide implementation guidance

Focus on best practices, error handling, and clear documentation.`
            }
          }
        ]
      };
    }

    if (name === 'gemini-project-setup') {
      return {
        description: 'Gemini AI Project Setup Assistant',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `I want to build: ${(args as any)?.projectType || 'an AI project'}

Please help me:
1. Test my Gemini API key
2. Understand the capabilities available
3. Generate starter code for my project
4. Provide best practices for Gemini integration

Use the available Gemini tools to assist with this setup.`
            }
          }
        ]
      };
    }
    
    throw new Error(`Prompt not found: ${name}`);
  });
}

// Main function to start the server
async function main() {
  try {
    await registerTools();
    await registerResources();
    await registerPrompts();
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('API Documentation MCP Server with Gemini Integration running on stdio');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
// end