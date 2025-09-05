import React from 'react';
import Navbar from '@/components/Navbar';
import FloatingOrbs from '@/components/FloatingOrbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart3, Activity, Globe } from 'lucide-react';

const Explore = () => {
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
            Explore the <span className="text-primary">Ethereum Ecosystem</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover trading opportunities, market trends, and the latest developments in the Monad blockchain.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="card-glass border-border/20 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Market Analytics</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Real-time market data, price charts, and trading volume analysis for all Monad tokens.
              </p>
            </CardContent>
          </Card>

          <Card className="card-glass border-border/20 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-secondary" />
                </div>
                <CardTitle className="text-lg">Trading Pairs</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Explore all available trading pairs and their current market status.
              </p>
            </CardContent>
          </Card>

          <Card className="card-glass border-border/20 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-green-500" />
                </div>
                <CardTitle className="text-lg">Network Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Monitor network statistics, transaction volume, and blockchain activity.
              </p>
            </CardContent>
          </Card>

          <Card className="card-glass border-border/20 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-500" />
                </div>
                <CardTitle className="text-lg">DeFi Ecosystem</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Discover other DeFi protocols and applications built on Monad.
              </p>
            </CardContent>
          </Card>

          <Card className="card-glass border-border/20 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <CardTitle className="text-lg">Portfolio Tracker</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Track your trading performance and portfolio value over time.
              </p>
            </CardContent>
          </Card>

          <Card className="card-glass border-border/20 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-orange-500" />
                </div>
                <CardTitle className="text-lg">Advanced Charts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Professional trading charts with technical indicators and analysis tools.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-16 text-center">
          <div className="bg-primary/10 rounded-2xl p-8 border border-border/20">
            <h2 className="text-2xl font-bold text-foreground mb-4">More Features Coming Soon</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're constantly working on new features to enhance your trading experience. 
              Stay tuned for advanced analytics, social trading, and more!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Explore; 