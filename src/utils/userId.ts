/**
 * Generates a deterministic numeric user ID based on Firebase UID,
 * consisting ONLY of numbers (8 digits, e.g. "84920153").
 */
export function getNumericUserId(uid: string): string {
  if (!uid) return '10000000';
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 31 + uid.charCodeAt(i)) & 0x7fffffff;
  }
  const val = (hash % 90000000) + 10000000;
  return val.toString();
}
