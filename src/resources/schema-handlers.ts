import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { 
  getAllResourceTypes, 
  getResourceTypesByCategory, 
  getResourceTypeIndex,
  getResourceSchema,
  getFilteredFields,
  getValidationRules,
  getDetailedFieldSchema,
  resourceSchemas
} from './field-schemas.js';

/**
 * Handles schema-related resource requests
 */
export class SchemaHandlers {
  
  /**
   * Handle schema index resource request
   * NOTE: This method is deprecated. The schema index is now handled as a static resource in index.ts
   * This is kept for backwards compatibility but may be removed in future versions.
   */
  async handleSchemaIndex(params: Record<string, any>) {
    const index = getResourceTypeIndex();
    
    return {
      uri: 'bitbucket://schema/index',
      mimeType: 'application/json',
      text: JSON.stringify({
        schemaVersion: '1.0.0',
        totalTypes: index.length,
        resourceTypes: index,
        note: 'This endpoint is deprecated. Use the static resource bitbucket://schema/index instead.',
        lastUpdated: new Date().toISOString()
      }, null, 2)
    };
  }
  
  /**
   * Handle resource schema request
   */
  async handleResourceSchema(uri: string, resourceType: string, params: Record<string, any>) {
    const schema = getResourceSchema(resourceType);
    if (!schema) {
      throw new McpError(
        ErrorCode.InvalidParams, 
        `Unknown resource type: ${resourceType}. Available types: ${getAllResourceTypes().join(', ')}`
      );
    }
    
    const fields = params.fields?.split(',') || ['fields', 'metadata', 'examples'];
    const fieldDetails = params.field_details || 'full';
    const filterBy = params.filter_by as 'required' | 'optional' | 'readonly' | 'nested' | undefined;
    
    // Get filtered fields if requested
    const filteredFields = getFilteredFields(resourceType, filterBy);
    
    // Build response based on requested fields
    const response: any = {
      resourceType: schema.type,
      description: schema.description,
      schemaVersion: '1.0.0'
    };
    
    if (fields.includes('fields')) {
      response.fields = fieldDetails === 'minimal' 
        ? filteredFields.map(f => ({ name: f.name, type: f.type, required: f.required || false }))
        : filteredFields;
    }
    
    if (fields.includes('metadata')) {
      response.metadata = {
        totalFields: schema.fields.length,
        requiredFields: schema.fields.filter(f => f.required).length,
        readonlyFields: schema.fields.filter(f => f.readonly).length,
        nestedFields: schema.fields.filter(f => f.nested).length,
        optionalFields: schema.fields.filter(f => !f.required).length
      };
    }
    
    if (fields.includes('examples')) {
      response.examples = {
        fieldExamples: schema.fields
          .filter(f => f.example !== undefined)
          .reduce((acc, f) => {
            acc[f.name] = f.example;
            return acc;
          }, {} as Record<string, any>)
      };
    }
    
    if (fields.includes('validation')) {
      response.validation = getValidationRules(resourceType);
    }
    
    // Add filtering information if applied
    if (filterBy) {
      response.filter = {
        appliedFilter: filterBy,
        filteredCount: filteredFields.length,
        totalCount: schema.fields.length
      };
    }
    
    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(response, null, 2)
    };
  }
  
  /**
   * Handle field schema request
   */
  async handleFieldSchema(uri: string, resourceType: string, fieldName: string, params: Record<string, any>) {
    const includeNested = params.include_nested === true || params.include_nested === 'true';
    
    const fieldSchema = getDetailedFieldSchema(resourceType, fieldName, includeNested);
    if (!fieldSchema) {
      const availableFields = getResourceSchema(resourceType)?.fields.map(f => f.name) || [];
      throw new McpError(
        ErrorCode.InvalidParams, 
        `Field '${fieldName}' not found in resource type '${resourceType}'. Available fields: ${availableFields.join(', ')}`
      );
    }
    
    const response = {
      resourceType,
      fieldName,
      schema: fieldSchema,
      schemaVersion: '1.0.0',
      retrievedAt: new Date().toISOString()
    };
    
    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(response, null, 2)
    };
  }
  
  /**
   * Handle validation schema request
   */
  async handleValidationSchema(uri: string, resourceType: string, params: Record<string, any>) {
    const operation = params.operation as 'create' | 'update' | 'read' || 'read';
    
    const validationRules = getValidationRules(resourceType, operation);
    if (!validationRules) {
      throw new McpError(
        ErrorCode.InvalidParams, 
        `Unknown resource type: ${resourceType}. Available types: ${getAllResourceTypes().join(', ')}`
      );
    }
    
    const response = {
      resourceType,
      operation,
      validation: validationRules,
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString()
    };
    
    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(response, null, 2)
    };
  }
  
  /**
   * Parse schema URI and route to appropriate handler
   */
  async handleSchemaResource(uri: string): Promise<any> {
    const url = new URL(uri);
    const pathParts = url.pathname.split('/').filter(p => p);
    
    if (pathParts.length < 2 || pathParts[0] !== 'schema') {
      throw new McpError(ErrorCode.InvalidParams, `Invalid schema URI: ${uri}`);
    }
    
    // Parse query parameters
    const params: Record<string, any> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    const [, schemaType, ...rest] = pathParts;
    
    switch (schemaType) {
      case 'index':
        return this.handleSchemaIndex(params);
        
      case 'validation':
        if (rest.length < 1) {
          throw new McpError(ErrorCode.InvalidParams, 'Resource type required for validation schema');
        }
        return this.handleValidationSchema(uri, rest[0], params);
        
      default:
        // Check if it's a resource type schema
        if (rest.length === 0) {
          // bitbucket://schema/{resource_type}
          return this.handleResourceSchema(uri, schemaType, params);
        } else if (rest.length === 2 && rest[0] === 'field') {
          // bitbucket://schema/{resource_type}/field/{field_name}
          return this.handleFieldSchema(uri, schemaType, rest[1], params);
        } else {
          throw new McpError(ErrorCode.InvalidParams, `Invalid schema URI format: ${uri}`);
        }
    }
  }
}
