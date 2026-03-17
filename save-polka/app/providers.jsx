"use client";

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';


// Custom configuration for your specific Polkadot EVM Testnet
const polkaTestnet = {
  id: 420420417, 
  name: 'PolkaVM Testnet',
  iconUrl: 'https://polkadot.network/assets/img/logo-polkadot.svg',
  iconBackground: '#fff',
  nativeCurrency: { name: 'Test DOT', symbol: 'DOT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://eth-rpc-testnet.polkadot.io'] },
  },
};

const config = getDefaultConfig({
  appName: 'Save Polka',
  projectId: 'b1ebe6094e352a32bbff3ce73c2e41cd', 
  chains: [polkaTestnet],
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact"
          theme={lightTheme({
            accentColor: 'black',
            accentColorForeground: 'white',
            borderRadius: 'none',
            fontStack: 'system',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}