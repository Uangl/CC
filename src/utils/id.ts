let counter = 0;

export function generateId(): string {
  counter++;
  return `${Date.now()}_${counter}_${Math.random().toString(36).substring(2, 8)}`;
}
