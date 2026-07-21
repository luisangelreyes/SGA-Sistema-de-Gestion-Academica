import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../back-end/src/router'; // We need the types from the backend!

export const trpc = createTRPCReact<AppRouter>();
