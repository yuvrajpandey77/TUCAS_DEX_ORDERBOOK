import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MoreVertical } from 'lucide-react';

interface Token {
  symbol: string;
  name: string;
  address: string;
  logo: string;
  volume?: string;
  decimals?: number;
}

const popularTokens: Token[] = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x0000000000000000000000000000000000000000', // Native ETH on Ethereum Mainnet
    logo: '⬟',
    volume: '$2.1B',
    decimals: 18
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Official USDC on Ethereum Mainnet
    logo: '🪙',
    volume: '$1.2B',
    decimals: 6
  }
];

interface TokenSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (token: Token) => void;
}

const TokenSelectorModal: React.FC<TokenSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectToken
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('tokens');

  const filteredTokens = popularTokens.filter(token =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTokenSelect = (token: Token) => {
    onSelectToken(token);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Search tokens and pools
          </DialogTitle>
          <DialogDescription>
            Select a token to trade with
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="pools">Pools</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, symbol, or address"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted border-border"
              />
            </div>
          </div>

          <TabsContent value="all" className="mt-4 space-y-2 max-h-80 overflow-y-auto">
            {filteredTokens.map((token) => (
              <Button
                key={token.address}
                variant="ghost"
                onClick={() => handleTokenSelect(token)}
                className="flex items-center justify-between w-full p-4 h-auto"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-lg">
                    {token.logo}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground">{token.symbol}</div>
                    <div className="text-sm text-muted-foreground">{token.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {token.address.slice(0, 6)}...{token.address.slice(-4)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {token.volume && (
                    <div className="text-sm text-muted-foreground">{token.volume}</div>
                  )}
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            ))}
          </TabsContent>

          <TabsContent value="tokens" className="mt-4 space-y-2 max-h-80 overflow-y-auto">
            {filteredTokens.map((token) => (
              <Button
                key={token.address}
                variant="ghost"
                onClick={() => handleTokenSelect(token)}
                className="flex items-center justify-between w-full p-4 h-auto"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-lg">
                    {token.logo}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground">{token.symbol}</div>
                    <div className="text-sm text-muted-foreground">{token.name}</div>
                  </div>
                </div>
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
            ))}
          </TabsContent>

          <TabsContent value="pools" className="mt-4">
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-lg font-medium mb-2">No pools found</div>
              <div className="text-sm">Try searching for tokens instead</div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TokenSelectorModal;