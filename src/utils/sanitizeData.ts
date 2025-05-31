'use client';

/**
 * Client-side utility to help serialize MongoDB-like objects
 * Use this in components when you need to sanitize data that might contain ObjectIDs, etc.
 * 
 * @example
 * // Client-side usage
 * const sanitizedData = sanitizeData(possiblyProblematicObject);
 */
export function sanitizeData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (data instanceof Date) {
    return data.toISOString() as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item)) as unknown as T;
  }

  if (typeof data === 'object' && data !== null) {
    // Handle objects with toJSON
    if ('toJSON' in data && typeof data.toJSON === 'function') {
      return sanitizeData(data.toJSON());
    }

    // Handle MongoDB ObjectID-like objects
    if (typeof data === 'object' && 
        '_bsontype' in data && 
        typeof (data as { toString: () => string }).toString === 'function') {
      return (data as { toString: () => string }).toString() as unknown as T;
    }

    // Process each property of the object
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip fields that begin with underscore for serialization safety
      if (!key.startsWith('__')) {
        result[key] = sanitizeData(value);
      }
    }
    return result as T;
  }

  return data;
}
