export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

export interface FocusMateUser {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
}

export function getCurrentUserId(): string {
  return DEFAULT_USER_ID;
}

export function getCurrentUser(): FocusMateUser {
  return {
    id: DEFAULT_USER_ID,
    email: "student@focusmate.app",
    displayName: "Student",
    photoURL: null,
  };
}
