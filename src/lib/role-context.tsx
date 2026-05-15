import { createContext, useContext, useState, type ReactNode } from "react";

export type Role = "admin" | "collector" | "manager" | "sysadmin" | "accounting_clerk";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  collector: "Collector",
  manager: "Manager",
  sysadmin: "System Administrator",
  accounting_clerk: "Accounting Clerk",
};

const RoleCtx = createContext<{
  role: Role;
  setRole: (r: Role) => void;
  user: { name: string; email: string };
}>({
  role: "admin",
  setRole: () => {},
  user: { name: "Alex Dela Cruz", email: "alex@lendpro.ph" },
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("admin");
  return (
    <RoleCtx.Provider
      value={{
        role,
        setRole,
        user: { name: "Alex Dela Cruz", email: "alex@lendpro.ph" },
      }}
    >
      {children}
    </RoleCtx.Provider>
  );
}

export const useRole = () => useContext(RoleCtx);
