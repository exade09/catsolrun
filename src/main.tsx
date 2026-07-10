import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { SolanaWalletProvider } from './wallet'
import './styles/global.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('The application root element was not found.')
}

createRoot(root).render(
  <StrictMode>
    <SolanaWalletProvider>
      <App />
    </SolanaWalletProvider>
  </StrictMode>,
)
