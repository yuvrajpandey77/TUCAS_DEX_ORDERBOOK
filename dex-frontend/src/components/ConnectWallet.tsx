import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { walletService } from '@/services/wallet-service';
import { formatAddress } from '@/lib/utils';
import { 
  Wallet, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Shield,
  Network,
  Download
} from 'lucide-react';

// Window interface is already declared in wallet-service.ts

interface ConnectWalletProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  isAvailable: boolean;
  isInstalled: boolean;
  installUrl?: string;
}

const ConnectWallet = ({ isOpen, onClose }: ConnectWalletProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStep, setConnectionStep] = useState<'idle' | 'connecting' | 'switching-network' | 'success' | 'error'>('idle');
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [availableWallets, setAvailableWallets] = useState<WalletOption[]>([]);
  const { toast } = useToast();

  // Detect MetaMask only
  useEffect(() => {
    const detectMetaMask = () => {
      if (typeof window === 'undefined') {
        setAvailableWallets([]);
        return;
      }

      const wallets: WalletOption[] = [];
      
      // Check if MetaMask is installed
      const isMetaMaskInstalled = !!(window.ethereum?.isMetaMask);
      
      if (isMetaMaskInstalled) {
        wallets.push({
          id: 'metamask',
          name: 'MetaMask',
          icon: '🦊',
          description: 'Connect with MetaMask wallet',
          isAvailable: true,
          isInstalled: true,
          installUrl: 'https://metamask.io/download/'
        });
      } else {
        wallets.push({
          id: 'metamask-install',
          name: 'MetaMask',
          icon: '🦊',
          description: 'Install MetaMask to connect',
          isAvailable: false,
          isInstalled: false,
          installUrl: 'https://metamask.io/download/'
        });
      }
      
      setAvailableWallets(wallets);
    };

    detectMetaMask();
  }, []);

  const handleConnect = async (walletId: string) => {
    setIsConnecting(true);
    setConnectionStep('connecting');
    setErrorDetails('');

    try {
      // Handle MetaMask installation
      if (walletId === 'metamask-install') {
        window.open('https://metamask.io/download/', '_blank');
        setIsConnecting(false);
        setConnectionStep('idle');
        return;
      }

      // Connect to MetaMask
      if (walletId === 'metamask') {
        const address = await walletService.connect();
        
        setConnectionStep('success');
        
        toast({
          title: "MetaMask Connected",
          description: `Successfully connected: ${formatAddress(address)}`,
          variant: "default",
        });
        
        // Close modal after success
        setTimeout(() => {
          onClose();
          setIsConnecting(false);
          setConnectionStep('idle');
        }, 1500);
      }
      
    } catch (error) {
      console.error('MetaMask connection failed:', error);
      setConnectionStep('error');
      setErrorDetails(error instanceof Error ? error.message : 'Failed to connect MetaMask');
      
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : 'Failed to connect MetaMask',
        variant: "destructive",
      });
    }
  };

  const handleRetry = () => {
    setConnectionStep('idle');
    setErrorDetails('');
    setIsConnecting(false);
  };



  const getStepContent = () => {
    switch (connectionStep) {
      case 'connecting':
        return (
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <div>
              <h3 className="text-lg font-semibold">Connecting Wallet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Please approve the connection in your wallet
              </p>
            </div>
          </div>
        );

      case 'switching-network':
        return (
          <div className="text-center space-y-4">
            <Network className="h-12 w-12 text-primary mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Switching Network</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Switching to Polygon Amoy...
              </p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-600">Connected Successfully</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your wallet is now connected
              </p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-4">
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-red-600">Connection Failed</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {errorDetails || 'Failed to connect wallet'}
              </p>
            </div>
            <Button onClick={handleRetry} variant="outline" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Choose a wallet to connect to Tucas DEX
              </p>
            </div>

            <div className="space-y-3">
              {availableWallets.map((wallet) => (
                <Button
                  key={wallet.id}
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => handleConnect(wallet.id)}
                  disabled={isConnecting}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <span className="text-2xl">{wallet.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{wallet.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {wallet.description}
                      </div>
                    </div>
                    {wallet.isInstalled ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Download className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </Button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Security Notice</p>
                  <p>
                    By connecting your wallet, you agree to our terms of service. 
                    We never request your private keys or seed phrases.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Wallet className="w-5 h-5" />
            <span>Connect Wallet</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {getStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectWallet;
