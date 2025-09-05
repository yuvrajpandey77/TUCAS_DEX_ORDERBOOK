import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDEXStore } from '@/store/dex-store';
import { walletService } from '@/services/wallet-service';
import { dexService } from '@/services/dex-service';
import { AlertCircle, CheckCircle, Info, ExternalLink, Shield, Settings } from 'lucide-react';

const ContractStatus = () => {
  const { checkContractDeployment } = useDEXStore();
  const [isConnected, setIsConnected] = useState(false);
  const [isContractDeployed, setIsContractDeployed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Check wallet connection and contract deployment
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Check if wallet is connected
        const signer = walletService.getSigner();
        const connected = !!signer;
        setIsConnected(connected);

        if (connected) {
          setIsChecking(true);
          try {
            // Initialize DEX service
            await dexService.initialize(signer);
            
            // Check contract deployment
            const deployed = await dexService.isContractDeployed();
            setIsContractDeployed(deployed);
          } catch (error) {
            setIsContractDeployed(false);
          } finally {
            setIsChecking(false);
          }
        } else {
          setIsContractDeployed(false);
        }
      } catch (error) {
        setIsConnected(false);
        setIsContractDeployed(false);
      }
    };

    // Check immediately
    checkStatus();

    // Set up interval to check periodically
    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Custom check contract deployment function
  const handleCheckContractDeployment = async () => {
    setIsChecking(true);
    try {
      const result = await checkContractDeployment();
      setIsContractDeployed(result);
    } catch (error) {
      setIsContractDeployed(false);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card className="w-full card-glass border-border/20 h-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center">
          <Shield className="h-3 w-3 mr-1 text-blue-400" />
          Contract Status
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {!isConnected ? (
          // Wallet not connected - Red warning
          <div className="flex items-center space-x-2 p-2 rounded bg-red-50 border border-red-200">
            <AlertCircle className="h-3 w-3 text-red-500" />
            <div className="flex-1">
              <p className="text-xs font-medium text-red-600">Wallet Not Connected</p>
              <p className="text-xs text-red-500">Connect wallet to check contract status (Amoy)</p>
            </div>
            <Badge variant="destructive" className="text-xs">
              Disconnected
            </Badge>
          </div>
        ) : (
          // Wallet connected - Normal status
          <div className="flex items-center space-x-2 p-2 rounded bg-accent/20">
            {isChecking ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-600">Checking...</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Checking
                </Badge>
              </>
            ) : isContractDeployed ? (
              <>
                <CheckCircle className="h-3 w-3 text-green-500" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-green-600">Deployed</p>
                </div>
                <Badge variant="default" className="text-xs">
                  Active
                </Badge>
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 text-yellow-500" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-yellow-600">Not Deployed</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Inactive
                </Badge>
              </>
            )}
          </div>
        )}

        {!isConnected && (
          <div className="flex space-x-1">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                // This would typically trigger wallet connection
              }}
              className="text-xs h-5 px-2"
            >
              <Shield className="h-2 w-2 mr-1" />
              Connect Wallet
            </Button>
          </div>
        )}
        
        {isConnected && !isContractDeployed && (
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckContractDeployment}
              disabled={isChecking}
              className="text-xs h-5 px-2"
            >
              <Settings className="h-2 w-2 mr-1" />
              {isChecking ? 'Checking...' : 'Check'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
              }}
              className="text-xs h-5 px-2"
            >
              <ExternalLink className="h-2 w-2 mr-1" />
              Help
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContractStatus; 