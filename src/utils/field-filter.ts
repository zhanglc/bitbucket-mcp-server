/**
 * Utility functions for filtering object fields based on field specifications
 * Supports dot notation for nested field access and array element access
 */

/**
 * Parse a comma-separated fields parameter into an array of field names
 * @param fieldsParam - Comma-separated field names (e.g., "id,title,reviewers.name")
 * @returns Array of trimmed field names
 */
export function parseFieldsParameter(fieldsParam: string): string[] {
  if (!fieldsParam || fieldsParam.trim() === '') {
    return [];
  }
  
  return fieldsParam
    .split(',')
    .map(field => field.trim())
    .filter(field => field.length > 0);
}

/**
 * Get a nested value from an object using dot notation
 * Supports array access with numeric indices and property access on all array elements
 * @param obj - The source object
 * @param path - Dot-separated path (e.g., "reviewers.0.name" or "reviewers.name")
 * @returns The value at the specified path, or undefined if not found
 */
export function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) {
    return undefined;
  }

  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    if (current === null || current === undefined) {
      return undefined;
    }

    // Check if the part is a numeric index for array access
    const isNumericIndex = /^\d+$/.test(part);
    
    if (isNumericIndex) {
      const index = parseInt(part, 10);
      if (Array.isArray(current) && index < current.length) {
        current = current[index];
      } else {
        return undefined;
      }
    } else {
      // Check if current is an array and we want to get a property from all elements
      if (Array.isArray(current)) {
        // Get the property from all array elements
        const remainingPath = parts.slice(i).join('.');
        return current.map(item => getNestedValue(item, remainingPath)).filter(val => val !== undefined);
      } else if (current.hasOwnProperty(part)) {
        current = current[part];
      } else {
        return undefined;
      }
    }
  }

  return current;
}

/**
 * Set a nested value in an object using dot notation
 * Creates intermediate objects and arrays as needed
 * @param obj - The target object to modify
 * @param path - Dot-separated path (e.g., "reviewers.0.name")
 * @param value - The value to set
 */
export function setNestedValue(obj: any, path: string, value: any): void {
  if (!obj || !path) {
    return;
  }

  const parts = path.split('.');
  let current = obj;

  // Special handling for array values that need to be distributed to array elements
  // e.g., setting "reviewers.name" to ["Jane", "Bob"] should create [{ name: "Jane" }, { name: "Bob" }]
  if (Array.isArray(value) && parts.length > 1 && !parts.some(part => /^\d+$/.test(part))) {
    const containerPath = parts.slice(0, -1);
    const propertyName = parts[parts.length - 1];
    
    // Navigate to the container
    let container = obj;
    for (const part of containerPath) {
      if (!container[part]) {
        container[part] = [];
      }
      container = container[part];
    }
    
    if (Array.isArray(container)) {
      value.forEach((val, index) => {
        // Ensure array is large enough
        while (container.length <= index) {
          container.push({});
        }
        if (!container[index]) {
          container[index] = {};
        }
        container[index][propertyName] = val;
      });
    }
    return;
  }

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const nextPart = parts[i + 1];
    const isNumericIndex = /^\d+$/.test(part);
    const nextIsNumericIndex = /^\d+$/.test(nextPart);

    if (isNumericIndex) {
      const index = parseInt(part, 10);
      if (!Array.isArray(current)) {
        return; // Cannot set array index on non-array
      }
      
      // Ensure array is large enough
      while (current.length <= index) {
        current.push({});
      }
      
      if (!current[index]) {
        current[index] = nextIsNumericIndex ? [] : {};
      }
      current = current[index];
    } else {
      if (!current[part]) {
        current[part] = nextIsNumericIndex ? [] : {};
      }
      current = current[part];
    }
  }

  // Set the final value
  const lastPart = parts[parts.length - 1];
  const isNumericIndex = /^\d+$/.test(lastPart);

  if (isNumericIndex) {
    const index = parseInt(lastPart, 10);
    if (Array.isArray(current)) {
      // Ensure array is large enough
      while (current.length <= index) {
        current.push({});
      }
      current[index] = value;
    }
  } else {
    current[lastPart] = value;
  }
}

/**
 * Filter an object to include only the specified fields
 * Supports dot notation for nested field access
 * @param obj - The source object to filter
 * @param fields - Array of field names to include (supports dot notation)
 * @returns A new object containing only the specified fields
 */
export function filterFields(obj: any, fields: string[]): any {
  if (!obj || !fields || fields.length === 0) {
    return obj;
  }

  const result: any = {};

  // Sort fields to process indexed access before batch access
  // This ensures indexed fields don't get overwritten by batch operations
  const sortedFields = fields.sort((a, b) => {
    const aHasIndex = /\.\d+\./.test(a);
    const bHasIndex = /\.\d+\./.test(b);
    if (aHasIndex && !bHasIndex) return -1;
    if (!aHasIndex && bHasIndex) return 1;
    return 0;
  });

  for (const field of sortedFields) {
    const value = getNestedValue(obj, field);
    
    if (value !== undefined) {
      // Special handling for array values that should be distributed to array elements
      if (Array.isArray(value) && field.includes('.') && !/\.\d+\./.test(field)) {
        const parts = field.split('.');
        
        // For "participants.user.email", we need to find existing "participants" array
        // and set user.email on each element
        
        // Simple heuristic: assume the first part is the array container
        const arrayPath = parts[0];
        const remainingPath = parts.slice(1).join('.');
        
        // Check if array container already exists in result
        if (result[arrayPath] && Array.isArray(result[arrayPath])) {
          // Merge with existing array
          const existingArray = result[arrayPath];
          value.forEach((val, index) => {
            if (index < existingArray.length) {
              setNestedValue(existingArray[index], remainingPath, val);
            } else {
              // Extend array if needed
              while (existingArray.length <= index) {
                existingArray.push({});
              }
              setNestedValue(existingArray[index], remainingPath, val);
            }
          });
        } else {
          // No existing array, use normal setNestedValue
          setNestedValue(result, field, value);
        }
      } else {
        setNestedValue(result, field, value);
      }
    }
  }

  return result;
}

/**
 * Apply field filtering to an array of objects
 * @param objects - Array of objects to filter
 * @param fieldsParam - Comma-separated field names or empty string for all fields
 * @returns Array of filtered objects
 */
export function applyFieldsFilter(objects: any[], fieldsParam?: string): any[] {
  if (!fieldsParam || fieldsParam.trim() === '') {
    return objects; // Return all fields if no filter specified
  }

  const fields = parseFieldsParameter(fieldsParam);
  return objects.map(obj => filterFields(obj, fields));
}