import Navbar from '@/components/Navbar';
import YellowSwapCard from '@/components/YellowSwapCard';
import UniswapSwapCard from '@/components/UniswapSwapCard';
import HybridSwapCard from '@/components/HybridSwapCard';
import FloatingOrbs from '@/components/FloatingOrbs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Globe, Shield, Layers, RefreshCw } from 'lucide-react';

const Swap = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <FloatingOrbs />
      <Navbar />
      <main className="relative z-10 container mx-auto px-4 pt-20 pb-12">
      
        

        {/* Swap Interface with Multiple Options */}
        <section className="relative max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Decentralized Exchange
            </h1>
            <p className="text-muted-foreground text-lg">
              Trade with real liquidity on Ethereum Sepolia testnet
            </p>
          </div>

          <Tabs defaultValue="hybrid" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="uniswap" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Uniswap V3
              </TabsTrigger>
              <TabsTrigger value="yellow" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Yellow Network
              </TabsTrigger>
              <TabsTrigger value="hybrid" className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Hybrid (Best Route)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="uniswap" className="relative">
              <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-tr from-blue-500/10 via-transparent to-blue-500/10 blur-3xl" />
              <div className="relative">
                <UniswapSwapCard />
              </div>
            </TabsContent>

            <TabsContent value="yellow" className="relative">
              <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-tr from-primary/10 via-transparent to-primary/10 blur-3xl" />
              <div className="relative">
                <YellowSwapCard />
              </div>
            </TabsContent>

            <TabsContent value="hybrid" className="relative">
              <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-tr from-purple-500/10 via-transparent to-blue-500/10 blur-3xl" />
              <div className="relative">
                <HybridSwapCard />
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Features Section */}
        <section className="mt-12 max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Powered by Uniswap V3 & Yellow Network</h2>
            <p className="text-muted-foreground">
              Experience the best of both worlds: proven liquidity and innovative state channels
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Uniswap V3 Features */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-blue-500/30 to-white/10 grid place-items-center">
                  <Globe className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="font-semibold">Real Liquidity</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Access to Uniswap V3's proven liquidity pools with real ETH/USDC trading.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-blue-500/30 to-white/10 grid place-items-center">
                  <RefreshCw className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="font-semibold">Live Price Discovery</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Real-time price feeds and accurate quotes from Uniswap V3's AMM.
              </p>
            </div>

            {/* Yellow Network Features */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-primary/30 to-white/10 grid place-items-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">Instant Settlement</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Trade instantly through state channels without waiting for blockchain confirmation.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-purple-500/30 to-white/10 grid place-items-center">
                  <Layers className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="font-semibold">Hybrid Routing</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatically choose the best route between Uniswap V3 and Yellow Network.
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Ready to Trade?</h3>
              <p className="text-muted-foreground mb-4">
                Connect your wallet and start trading with real liquidity on Ethereum Sepolia testnet
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                <span>• Real ETH/USDC pairs</span>
                <span>• Live price feeds</span>
                <span>• Gas fee optimization</span>
                <span>• Transaction history</span>
              </div>
            </div>
          </div>
        </section>

      
       
      </main>
    </div>
  );
};

export default Swap;


