export interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  parameters?: Parameter[];
  responses?: Response[];
  examples?: Example[];
}

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  location: 'query' | 'path' | 'header' | 'body';
}

export interface Response {
  statusCode: number;
  description: string;
  schema?: any;
}

export interface Example {
  title: string;
  request: any;
  response: any;
}

export class APIDocumentationParser {
  private apiDocs: Map<string, APIEndpoint[]> = new Map();

  // Parse OpenAPI/Swagger documentation
  parseOpenAPI(spec: any, baseUrl: string): void {
    const endpoints: APIEndpoint[] = [];
    
    for (const [path, methods] of Object.entries(spec.paths || {})) {
      for (const [method, details] of Object.entries(methods as any)) {
        if (typeof details === 'object' && details !== null) {
          endpoints.push(this.parseEndpoint(method, path, details));
        }
      }
    }
    
    this.apiDocs.set(baseUrl, endpoints);
  }

  private parseEndpoint(method: string, path: string, details: any): APIEndpoint {
    return {
      method: method.toUpperCase(),
      path,
      description: details.summary || details.description || '',
      parameters: this.parseParameters(details.parameters || []),
      responses: this.parseResponses(details.responses || {}),
      examples: this.parseExamples(details.examples || {})
    };
  }

  private parseParameters(params: any[]): Parameter[] {
    return params.map(param => ({
      name: param.name,
      type: param.schema?.type || param.type || 'string',
      required: param.required || false,
      description: param.description || '',
      location: param.in as any
    }));
  }

  private parseResponses(responses: any): Response[] {
    return Object.entries(responses).map(([code, details]: [string, any]) => ({
      statusCode: parseInt(code),
      description: details.description || '',
      schema: details.schema || details.content
    }));
  }

  private parseExamples(examples: any): Example[] {
    return Object.entries(examples).map(([title, example]: [string, any]) => ({
      title,
      request: example.value || example,
      response: {}
    }));
  }

  // Get endpoints for a specific API
  getEndpoints(apiName: string): APIEndpoint[] {
    return this.apiDocs.get(apiName) || [];
  }

  // Search endpoints by keyword
  searchEndpoints(query: string): APIEndpoint[] {
    const results: APIEndpoint[] = [];
    for (const endpoints of this.apiDocs.values()) {
      results.push(...endpoints.filter(endpoint => 
        endpoint.path.toLowerCase().includes(query.toLowerCase()) ||
        endpoint.description.toLowerCase().includes(query.toLowerCase())
      ));
    }
    return results;
  }

  // Get list of loaded API names (public method)
  getLoadedApiNames(): string[] {
    return Array.from(this.apiDocs.keys());
  }
}