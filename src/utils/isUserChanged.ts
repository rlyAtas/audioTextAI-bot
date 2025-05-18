import { User } from '@prisma/client';

/**
 * The function checks whether the user data has been changed
 * @param existingUser
 * @param newData
 * @returns
 */
export function isUserChanged(existingUser: User, newData: Partial<User>): boolean {
  return (Object.keys(newData) as (keyof typeof newData)[]).some(
    (key) => newData[key] !== existingUser[key],
  );
}
