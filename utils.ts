export const delay = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Утилиты и валидация
export const validateInput = (input: any, expectedType: string): boolean => {
  return typeof input === expectedType;
};
