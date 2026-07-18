"use client";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { api } from "@/services/api";
import type { User } from "@/types";

const AuthContext = createContext<{ user?: User; loading: boolean; logout: () => Promise<void>; refresh: () => Promise<void> }>({ loading: true, logout: async () => {}, refresh: async () => {} });
function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({ queryKey: ["me"], queryFn: () => api.get<User>("/auth/me"), retry: false, staleTime: 60_000 });
  const logout = async () => { await api.post("/auth/logout"); queryClient.setQueryData(["me"], undefined); window.location.href = "/"; };
  const refresh = async () => { await queryClient.invalidateQueries({ queryKey: ["me"] }); };
  return <AuthContext.Provider value={{ user, loading: isLoading, logout, refresh }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } }));
  return <QueryClientProvider client={client}><AuthProvider>{children}</AuthProvider><Toaster richColors position="top-right" /></QueryClientProvider>;
}
