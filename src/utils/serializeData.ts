'use server';

/**
 * Serializes MongoDB data to ensure it can be safely passed to client components
 * This function converts MongoDB document objects with special types to plain JavaScript objects
 * Made async to comply with Next.js Server Actions requirements
 * 
 * @example
 * // Server-side usage (in Server Action)
 * const data = await serializeData(mongoDocument);
 */
export async function serializeData<T>(data: T): Promise<T> {
  if (data === null || data === undefined) {
    return data;
  }

  if (data instanceof Date) {
    return data.toISOString() as unknown as T;
  }

  if (Array.isArray(data)) {
    const results = await Promise.all(data.map(item => serializeData(item)));
    return results as unknown as T;
  }

  if (typeof data === 'object' && data !== null) {
    if ('toJSON' in data && typeof data.toJSON === 'function') {
      return await serializeData(data.toJSON());
    }

    if ('_bsontype' in data) {
      // Handle special MongoDB types (like ObjectId)
      if ((data as { _bsontype: string })._bsontype === 'ObjectID') {
        return (data as { toString: () => string }).toString() as unknown as T;
      }
      // Add other BSON type handlers as needed
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip fields that begin with underscore for serialization safety
      if (!key.startsWith('__')) {
        result[key] = await serializeData(value);
      }
    }
    return result as T;
  }

  return data;
}
