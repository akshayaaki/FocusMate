"use client";

import * as React from "react";
import { getCurrentUser, type FocusMateUser, DEFAULT_USER_ID } from "./get-user";

export interface FocusMateAuthUser extends FocusMateUser {}

interface AuthContextType {
  user: FocusMateAuthUser;
  loading: boolean;
  signOut: () => Promise<void>;
}

const defaultUser: FocusMateAuthUser = {
  id: DEFAULT_USER_ID,
  email: "student@focusmate.app",
  displayName: "Student",
  photoURL: null,
};

const AuthContext = React.createContext<AuthContextType>({
  user: defaultUser,
  loading: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user] = React.useState<FocusMateAuthUser>(defaultUser);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: false,
        signOut: async () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return React.useContext(AuthContext);
}
