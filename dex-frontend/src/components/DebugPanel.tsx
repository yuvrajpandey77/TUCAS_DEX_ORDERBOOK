import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDEXStore } from '@/store/dex-store';
import { useWallet } from '@/hooks/useWallet';
import { dexService } from '@/services/dex-service';
import { ethers } from 'ethers';
import { RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react';

const DebugPanel = () => {
  const { selectedPair, checkContractDeployment } = useDEXStore();
  const { 
    isConnected, 
    address, 
    provider, 
    signer, 
    isLoading, 
    error, 
    chainId,
    networkName 
  } = useWallet();
  const [networkInfo, setNetworkInfo] = React.useState<any>(null);
  const [isContractDeployed, setIsContractDeployed] = React.useState<boolean>(false);

  const checkNetworkInfo = async () => {
    if (!provider || !isConnected) return;
    
    try {
      const network = await provider.getNetwork();
      setNetworkInfo(network);
    } catch (error) {
      setNetworkInfo(null);
    }
  };

  const checkContractStatus = async () => {
    if (!isConnected) {
      setIsContractDeployed(false);
      return;
    }
    
    try {
      const deployed = await checkContractDeployment();
      setIsContractDeployed(deployed);
    } catch (error) {
      setIsContractDeployed(false);
    }
  };

  React.useEffect(() => {
    checkNetworkInfo();
    checkContractStatus();
  }, [provider, isConnected]);

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = (status: boolean) => {
    return status ? 'Deployed' : 'Not Deployed';
  };

  return (
    <Card className="w-full card-glass border-border/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Debug Panel</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              checkNetworkInfo();
              checkContractStatus();
            }}
            className="p-2"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Connection Status */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Wallet Connection</h3>
          <div className="flex items-center space-x-2">
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            {isLoading && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>}
          </div>
          {isConnected && address && (
            <p className="text-xs text-muted-foreground font-mono">
              {address}
            </p>
          )}
        </div>

        {/* Network Information */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Network</h3>
          {isConnected && networkInfo ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Chain ID: {networkInfo.chainId.toString()}
              </p>
              <p className="text-xs text-muted-foreground">
                Name: {networkInfo.name}
              </p>
            </div>
          ) : isConnected && chainId ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Chain ID: {chainId}
              </p>
              <p className="text-xs text-muted-foreground">
                Name: {networkName || 'Unknown'}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Network info unavailable</p>
          )}
        </div>

        {/* Contract Status */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">DEX Contract</h3>
          <div className="flex items-center space-x-2">
            {getStatusIcon(isContractDeployed)}
            <span className="text-xs text-muted-foreground">
              {getStatusText(isContractDeployed)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {dexService.contractAddress}
          </p>
        </div>

        {/* Selected Trading Pair */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Selected Pair</h3>
          {selectedPair ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {selectedPair.baseTokenSymbol}/{selectedPair.quoteTokenSymbol}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                Base: {selectedPair.baseToken}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                Quote: {selectedPair.quoteToken}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No pair selected</p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-red-600">Error</h3>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Debug Actions */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Debug Actions</h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Debug logging removed for production
              }}
              className="text-xs"
            >
              Log State
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // MetaMask check removed for production
              }}
              className="text-xs"
            >
              Check MetaMask
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugPanel; 