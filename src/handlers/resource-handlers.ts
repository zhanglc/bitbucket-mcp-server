import { 
  RESOURCE_DEFINITIONS, 
  RESOURCE_TEMPLATES,
  generateResourceContent 
} from '../resources/resource-definitions.js';

export interface ResourceUriParts {
  scheme: string;
  domain: string;
  category: string;
  resource?: string;
}

export class ResourceHandlers {
  async listResources() {
    return {
      resources: RESOURCE_DEFINITIONS,
      resourceTemplates: RESOURCE_TEMPLATES
    };
  }

  async readResource(uri: string) {
    const content = await generateResourceContent(uri);
    
    return {
      contents: [{
        type: 'text' as const,
        text: content
      }]
    };
  }

  parseResourceUri(uri: string): ResourceUriParts {
    const match = uri.match(/^([^:]+):\/\/([^\/]+)\/([^\/]+)(?:\/(.+))?$/);
    
    if (!match) {
      throw new Error('Invalid resource URI format');
    }
    
    const [, scheme, domain, category, resource] = match;
    
    return {
      scheme,
      domain,
      category,
      resource
    };
  }
}