import React from 'react';
import Navbar from '@/components/Navbar';
import FloatingOrbs from '@/components/FloatingOrbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Droplets, Plus, Minus, TrendingUp, Activity } from 'lucide-react';

const Pool = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Background Orbs */}
      <FloatingOrbs />
      
      {/* Navigation */}
      <Navbar />
      
      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 pt-20 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 font-display">
            Liquidity <span className="text-primary">Pools</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Provide liquidity to earn trading fees and participate in the Monad DeFi ecosystem.
          </p>
        </div>

        {/* Pool Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
          <Card className="card-glass border-border/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Value Locked</p>
                  <p className="text-2xl font-bold text-foreground">$2.4M</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass border-border/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">24h Volume</p>
                  <p className="text-2xl font-bold text-foreground">$847K</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass border-border/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Pools</p>
                  <p className="text-2xl font-bold text-foreground">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pool List */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Available Pools</h2>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Pool
            </Button>
          </div>

          <div className="space-y-4">
            {/* MONAD/MONAD Pool */}
            <Card className="card-glass border-border/20 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">M</span>
                      </div>
                      <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">M</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">MONAD/MONAD</h3>
                      <p className="text-sm text-muted-foreground">Monad Token / Native MONAD</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">$1.2M</p>
                    <p className="text-sm text-muted-foreground">TVL</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                    <Button variant="outline" size="sm">
                      <Minus className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Example Pools */}
            {[
              { name: 'MONAD/USDC', desc: 'Monad Token / USDC', tvl: '$856K', apy: '12.5%' },
              { name: 'MONAD/ETH', desc: 'Monad Token / ETH', tvl: '$234K', apy: '8.2%' },
              { name: 'USDC/ETH', desc: 'USDC / ETH', tvl: '$98K', apy: '15.7%' },
            ].map((pool, index) => (
              <Card key={index} className="card-glass border-border/20 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">T</span>
                        </div>
                        <div className="w-8 h-8 bg-gradient-to-r from-secondary to-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">T</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{pool.name}</h3>
                        <p className="text-sm text-muted-foreground">{pool.desc}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-foreground">{pool.tvl}</p>
                      <p className="text-sm text-muted-foreground">TVL</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                      <Button variant="outline" size="sm">
                        <Minus className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">How Liquidity Pools Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-glass border-border/20">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <CardTitle className="text-center">Provide Liquidity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  Deposit equal values of both tokens in a trading pair to create a liquidity position.
                </p>
              </CardContent>
            </Card>

            <Card className="card-glass border-border/20">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-secondary">2</span>
                </div>
                <CardTitle className="text-center">Earn Fees</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  Earn a portion of trading fees from every swap that uses your liquidity.
                </p>
              </CardContent>
            </Card>

            <Card className="card-glass border-border/20">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-500">3</span>
                </div>
                <CardTitle className="text-center">Withdraw Anytime</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  Remove your liquidity at any time and receive your tokens plus accumulated fees.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pool; 