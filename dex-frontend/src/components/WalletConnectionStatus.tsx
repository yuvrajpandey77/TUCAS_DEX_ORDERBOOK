import React from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wallet, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw,
  AlertCircle 
} from 'lucide-react';
import { formatAddress } from '@/lib/utils';

const WalletConnectionStatus = () => {
  const {
    isConnected,
    address,
    chainId,
    networkName,
    error,
    isLoading,
    isAutoReconnecting,
    connectWallet,
    disconnectWallet,
    clearError,
  } = useWallet();

  const getStatusIcon = () => {
    if (isAutoReconnecting) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    }
    if (isLoading) {
      return <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />;
    }
    if (isConnected) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (error) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    return <AlertCircle className="w-4 h-4 text-gray-500" />;
  };

  const getStatusText = () => {
    if (isAutoReconnecting) return 'Auto-reconnecting...';
    if (isLoading) return 'Connecting...';
    if (isConnected) return 'Connected';
    if (error) return 'Error';
    return 'Disconnected';
  };

  const getStatusColor = () => {
    if (isAutoReconnecting) return 'bg-blue-500';
    if (isLoading) return 'bg-yellow-500';
    if (isConnected) return 'bg-green-500';
    if (error) return 'bg-red-500';
    return 'bg-gray-500';
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wallet className="w-5 h-5" />
          <span>Wallet Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
          <Badge 
            variant="secondary" 
            className={`${getStatusColor()} text-white`}
          >
            {isConnected ? 'ONLINE' : 'OFFLINE'}
          </Badge>
        </div>

        {/* Connection Details */}
        {isConnected && address && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Address:</span>
              <span className="font-mono">{formatAddress(address)}</span>
            </div>
            {chainId && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Network:</span>
                <span>{networkName || chainId}</span>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Error</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearError}
              className="mt-2"
            >
              Clear Error
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          {!isConnected ? (
            <Button 
              onClick={connectWallet}
              disabled={isLoading || isAutoReconnecting}
              className="flex-1"
            >
              {isAutoReconnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Reconnecting...
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={disconnectWallet}
              className="flex-1"
            >
              Disconnect
            </Button>
          )}
          
          {isConnected && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Auto-reconnection Info */}
        {isAutoReconnecting && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-700">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Auto-reconnecting</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Attempting to reconnect to your previously connected wallet...
            </p>
          </div>
        )}

        {/* Test Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Test Auto-reconnection:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Connect your wallet</li>
            <li>Refresh the page (F5)</li>
            <li>Watch for auto-reconnection</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletConnectionStatus; 