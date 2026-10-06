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

/**
 * Returns user's deterministic numeric Kora ID or guest ID.
 * Fixed, stable and permanently locked in local records and synced with database.
 */
export function getUserOrGuestNumericId(user: any): string {
  if (user?.uid) {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`kora_permanent_id_${user.uid}`) || localStorage.getItem(`kora_user_numeric_id_${user.uid}`);
      if (cached && /^\d{8}$/.test(cached)) {
        return cached;
      }
    }
    const generated = getNumericUserId(user.uid);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`kora_permanent_id_${user.uid}`, generated);
      localStorage.setItem(`kora_user_numeric_id_${user.uid}`, generated);
    }
    return generated;
  }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('kora_guest_id') || localStorage.getItem('kora_guest_numeric_id');
    if (cached && /^\d{8}$/.test(cached)) {
      localStorage.setItem('kora_guest_id', cached);
      localStorage.setItem('kora_guest_numeric_id', cached);
      return cached;
    }
    const newId = (Math.floor(Math.random() * 90000000) + 10000000).toString();
    localStorage.setItem('kora_guest_id', newId);
    localStorage.setItem('kora_guest_numeric_id', newId);
    return newId;
  }

  return '84920153';
}

