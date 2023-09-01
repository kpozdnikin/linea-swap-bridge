export const delay = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Утилиты и валидация
export const validateInput = (input: any, expectedType: string): boolean => {
  return typeof input === expectedType;
};

export function equalsIgnoreCase(value1: string, value2: string): boolean {
  if (typeof value1 !== "string" || typeof value2 !== "string") {
    return false;
  }

  if (value1 === value2) {
    return true;
  }

  return value1.toUpperCase() === value2.toUpperCase();
}
