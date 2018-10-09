export function isFunction(obj: any) {
  return !!(obj && obj.constructor && obj.call && obj.apply);
}

export function isPrimitive(value: any): boolean {
  switch (typeof value) {
    case 'string':
    case 'number':
    case 'boolean':
      return true;
  }
  return (
    value instanceof String ||
    value === String ||
    value instanceof Number ||
    value === Number ||
    value instanceof Boolean ||
    value === Boolean
  );
}

export function isArray(value: any): boolean {
  if (value === Array) {
    return true;
  } else if (typeof Array.isArray === 'function') {
    return Array.isArray(value);
  } else {
    return value instanceof Array;
  }
}
