import { QueryClient } from "@tanstack/react-query";

export const appQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes GC
      retry: 1,
      refetchOnWindowFocus: false, // Firebase handles real-time updates
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
