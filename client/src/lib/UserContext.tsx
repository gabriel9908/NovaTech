import { createContext, useContext } from "react";
import { User } from "firebase/auth";

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children, value }: { children: React.ReactNode; value: UserContextType }) {
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
