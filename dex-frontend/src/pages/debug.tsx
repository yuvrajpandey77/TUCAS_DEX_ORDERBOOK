import { ContractTest } from '@/components/debug/contract-test'

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-foreground">🚀 DEX Debug & Testing</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Test the frontend integration with deployed smart contracts on Monad testnet.
            </p>
          </div>

          <ContractTest />

          <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">📋 Deployment Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="font-medium">Network:</span>
                <span className="text-muted-foreground">Monad Testnet</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="font-medium">RPC URL:</span>
                <span className="text-muted-foreground text-xs break-all">https://monad-testnet.g.alchemy.com/v2/hl5Gau0XVV37m-RDdhcRzqCh7ISwmOAe</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="font-medium">Token Contract:</span>
                <span className="text-muted-foreground text-xs font-mono">0x0000000000000000000000000000000000000000</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="font-medium">DEX Contract:</span>
                <span className="text-muted-foreground text-xs font-mono">0x39DC69400B5A2eC3DC2b13fDd1D8c7f78b3D573e</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium">Explorer:</span>
                <a href="https://explorer.monad.xyz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://explorer.monad.xyz</a>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">📊 Next Steps</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span><strong>Smart Contracts Deployed</strong> - Both token and DEX contracts are live</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span><strong>Frontend Configuration Updated</strong> - Contract addresses and network settings updated</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">🔄</span>
                <span><strong>Test Contract Connection</strong> - Use the test above to verify connectivity</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-yellow-500">⏳</span>
                <span><strong>Add Trading Pairs</strong> - Configure trading pairs in the DEX</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-yellow-500">⏳</span>
                <span><strong>Test Order Placement</strong> - Test limit and market orders</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-yellow-500">⏳</span>
                <span><strong>Deploy Frontend</strong> - Deploy to Vercel/Netlify</span>
              </li>
            </ul>
          </div>

          <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">🎯 Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a href="/trading" className="block p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                <h3 className="font-semibold mb-2">📈 Trading Interface</h3>
                <p className="text-sm text-muted-foreground">Test the main trading functionality</p>
              </a>
              <a href="/" className="block p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                <h3 className="font-semibold mb-2">🏠 Home Page</h3>
                <p className="text-sm text-muted-foreground">Return to the main application</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 