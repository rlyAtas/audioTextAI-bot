/**
 * Check if environment variable is set
 * @param {string} name - Environment variable name
 * @returns {string} value - Environment variable value
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
}
