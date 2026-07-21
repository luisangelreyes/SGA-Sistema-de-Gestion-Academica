import { useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from './lib/trpc';
import { queryClient } from './lib/query-client';
import { router } from './router';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/trpc',
          // Pasamos el token en cada request
          headers() {
            const currentToken = useAuth.getState().token;
            return currentToken ? { Authorization: `Bearer ${currentToken}` } : {};
          },
        }),
      ],
      transformer: undefined
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
