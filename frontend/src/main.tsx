import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'
import './i18n'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401 || error?.response?.status === 403) return false
        return failureCount < 2
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
)
