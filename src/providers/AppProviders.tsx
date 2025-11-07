import { useState } from 'react';
import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from "../i18n"; // đường dẫn tuỳ bạn

export function AppProviders({ children }: PropsWithChildren) {
  const [client] = useState(() => new QueryClient());

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    </I18nextProvider>
  );
}
