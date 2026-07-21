import { createTRPCProxyClient, httpLink } from '@trpc/client';
import type { AppRouter } from './src/router';

const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpLink({
      url: 'http://localhost:3000/trpc',
      fetch: globalThis.fetch
    }),
  ],
});

async function main() {
  try {
    const becas = await client.becas.getBecas.query();
    console.log("Success:", becas);
  } catch (error) {
    console.error("Error calling trpc:", error);
  }
}

main();
