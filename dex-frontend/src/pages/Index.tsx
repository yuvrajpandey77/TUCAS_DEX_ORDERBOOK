import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import FloatingOrbs from '@/components/FloatingOrbs';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Zap, Globe, BarChart3, Sparkles } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Background Orbs */}
      <FloatingOrbs />
      
      {/* Navigation */}
      <Navbar />
      
      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 pt-16 pb-16">
        {/* Hero */}
        <section className="py-16 md:py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left: Copy & CTAs */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs text-muted-foreground mb-5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Next‑gen DEX experience
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              Swap it anywhere,
              <br />
              <span className="text-primary">anytime.</span>
            </h1>

            <p className="mt-5 text-lg text-muted-foreground">
              Premium multi‑chain swapping with institutional‑grade routing. Non‑custodial, secure, and designed for speed.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/swap" className="w-full sm:w-auto">
                <Button className="hero-button w-full sm:w-auto text-base py-6 gap-2">
                  Launch Swap
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/trading" className="w-full sm:w-auto">
                <Button variant="outline" className="outline-button w-full sm:w-auto">
                  Advanced Trading
                </Button>
              </Link>
            </div>

            {/* Trust/Value Props */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Multi‑chain</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Non‑custodial</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Best prices</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Pro tools</span>
              </div>
            </div>
          </div>

          {/* Right: Swap preview card */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-tr from-primary/20 via-transparent to-primary/0 blur-xl" />
            <div className="swap-card relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">From</span>
                <span className="text-xs text-muted-foreground">Preview</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary/60 to-white/20" />
                    <span className="font-medium">ETH</span>
                  </div>
                  <input className="token-input w-40 text-right" readOnly value="0.25" />
                </div>
              </div>

              <div className="my-3 flex items-center justify-center">
                <div className="h-9 w-9 rounded-full bg-white/10 border border-white/10 grid place-items-center">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-white/20 to-primary/60" />
                    <span className="font-medium">MATIC</span>
                  </div>
                  <input className="token-input w-40 text-right" readOnly value="≈ 120.34" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  Route: <span className="text-foreground">Optimized</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  Price Impact: <span className="text-foreground">Low</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  Fee: <span className="text-foreground">0.1%</span>
                </div>
              </div>

              <Link to="/swap">
                <Button className="hero-button w-full mt-5 py-5">Start swapping</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mt-10 lg:mt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-primary/30 to-white/10 grid place-items-center">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold">Cross‑chain by default</h3>
              </div>
              <p className="text-sm text-muted-foreground">Swap seamlessly across 12+ networks with intelligent routing.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-primary/30 to-white/10 grid place-items-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold">Non‑custodial security</h3>
              </div>
              <p className="text-sm text-muted-foreground">You always control your keys. No sign‑ups, no custody.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-primary/30 to-white/10 grid place-items-center">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold">Best execution</h3>
              </div>
              <p className="text-sm text-muted-foreground">Optimized routes for minimal slippage and superior prices.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-primary/30 to-white/10 grid place-items-center">
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold">Pro insights</h3>
              </div>
              <p className="text-sm text-muted-foreground">Advanced charts and data when you need to go deeper.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
