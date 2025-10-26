import { useState } from 'react';
import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function AppProviders({ children }: PropsWithChildren) {
	const [client] = useState(() => new QueryClient());
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
