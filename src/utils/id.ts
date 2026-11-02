/**
 * Id generation. Not cryptographic — these only need to be unique within one
 * device's local data, and `crypto.randomUUID` isn't available everywhere
 * React Native runs.
 */

export function createId(prefix = ''): string {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}${prefix ? '_' : ''}${time}${random}`;
}
