import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { simplifiedWalletService } from '@/services/simplified-wallet-service';
import { formatAddress } from '@/lib/utils';
import { 
  Wallet, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Download,
  AlertCircle
} from 'lucide-react';

interface SimplifiedConnectWalletProps {
  isOpen: boolean;
  onClose: () => void;
}

const SimplifiedConnectWallet = ({ isOpen, onClose }: SimplifiedConnectWalletProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletState, setWalletState] = useState(simplifiedWalletService.getState());
  const { toast } = useToast();

  // Subscribe to wallet state changes
  useEffect(() => {
    const unsubscribe = simplifiedWalletService.subscribe(setWalletState);
    return unsubscribe;
  }, []);

  // Check if MetaMask is available
  const isMetaMaskAvailable = simplifiedWalletService.isMetaMaskAvailable();

  const handleConnect = async () => {
    if (!isMetaMaskAvailable) {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to connect your wallet.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    
    try {
      const address = await simplifiedWalletService.connect();
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${formatAddress(address)}`,
      });
      
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    simplifiedWalletService.disconnect();
    toast({
      title: "Wallet Disconnected",
      description: "You have been disconnected from your wallet.",
    });
    onClose();
  };

  const handleReconnect = async () => {
    setIsConnecting(true);
    
    try {
      const address = await simplifiedWalletService.reconnect();
      
      toast({
        title: "Wallet Reconnected",
        description: `Reconnected to ${formatAddress(address)}`,
      });
      
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reconnect wallet';
      
      toast({
        title: "Reconnection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleInstallMetaMask = () => {
    window.open('https://metamask.io/download/', '_blank');
  };

  const handleSwitchNetwork = async () => {
    try {
      await simplifiedWalletService.switchToMainnet();
      toast({
        title: "Network Switched",
        description: "Switched to Ethereum Mainnet",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch network';
      toast({
        title: "Network Switch Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getContent = () => {
    // MetaMask not installed
    if (!isMetaMaskAvailable) {
      return (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
            <Download className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">MetaMask Required</h3>
            <p className="text-sm text-gray-600 mt-1">
              Please install MetaMask to connect your wallet and start trading.
            </p>
          </div>
          <Button onClick={handleInstallMetaMask} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Install MetaMask
          </Button>
        </div>
      );
    }

    // Wallet connected
    if (walletState.isConnected) {
      return (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mt-2">Wallet Connected</h3>
            <p className="text-sm text-gray-600">
              {formatAddress(walletState.address || '')}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {walletState.networkName}
            </p>
          </div>

          {/* Network Status */}
          {!simplifiedWalletService.isOnCorrectNetwork() && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Please switch to Ethereum Mainnet
                </span>
              </div>
              <Button 
                onClick={handleSwitchNetwork} 
                size="sm" 
                className="mt-2 w-full"
                variant="outline"
              >
                Switch to Mainnet
              </Button>
            </div>
          )}

          <div className="flex space-x-2">
            <Button 
              onClick={handleReconnect} 
              variant="outline" 
              className="flex-1"
              disabled={isConnecting}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isConnecting ? 'animate-spin' : ''}`} />
              Reconnect
            </Button>
            <Button 
              onClick={handleDisconnect} 
              variant="destructive" 
              className="flex-1"
            >
              Disconnect
            </Button>
          </div>
        </div>
      );
    }

    // Wallet not connected
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
          <Wallet className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Connect Wallet</h3>
          <p className="text-sm text-gray-600 mt-1">
            Connect your MetaMask wallet to start trading on the DEX.
          </p>
        </div>
        
        {walletState.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800">{walletState.error}</span>
            </div>
          </div>
        )}

        <Button 
          onClick={handleConnect} 
          className="w-full"
          disabled={isConnecting || walletState.isLoading}
        >
          {isConnecting || walletState.isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              Connect MetaMask
            </>
          )}
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Wallet className="w-5 h-5" />
            <span>Wallet Connection</span>
          </DialogTitle>
          <DialogDescription>
            {walletState.isConnected 
              ? "Manage your wallet connection" 
              : "Connect your wallet to start trading"
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {getContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimplifiedConnectWallet;
