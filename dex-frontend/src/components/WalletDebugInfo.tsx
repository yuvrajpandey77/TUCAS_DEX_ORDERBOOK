import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Info, RefreshCw, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WalletDebugInfoProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletDebugInfo = ({ isOpen, onClose }: WalletDebugInfoProps) => {
  const { toast } = useToast();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const getDebugInfo = async () => {
    setIsLoading(true);
    const info: any = {};

    try {
      // MetaMask availability
      info.metaMask = {
        available: typeof window.ethereum !== 'undefined',
        isMetaMask: window.ethereum?.isMetaMask || false,
        version: (window.ethereum as any)?.networkVersion || 'unknown',
      };

      // Connection status
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
          info.accounts = {
            count: accounts?.length || 0,
            addresses: accounts || [],
          };
        } catch (error) {
          info.accounts = { error: error instanceof Error ? error.message : 'Unknown error' };
        }

        // Network info
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
          info.network = {
            chainId,
            isMonad: chainId === '0x279f' || chainId === '10143',
          };
        } catch (error) {
          info.network = { error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }

      // Browser info
      info.browser = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
      };

    } catch (error) {
      info.general = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    setDebugInfo(info);
    setIsLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Debug information copied to clipboard",
    });
  };

  useEffect(() => {
    if (isOpen) {
      getDebugInfo();
    }
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-40"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="debug-modal-title"
    >
      <div 
        className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-background rounded-lg shadow-2xl max-w-2xl w-full max-h-[calc(100vh-5rem)] overflow-y-auto"
        role="document"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold" id="debug-modal-title">Wallet Debug Information</h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              ×
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading debug information...
            </div>
          ) : (
            <div className="space-y-4">
              {/* MetaMask Status */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  {debugInfo.metaMask?.available ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  MetaMask Status
                </h3>
                <div className="pl-6 space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Available:</span>
                    <Badge variant={debugInfo.metaMask?.available ? "default" : "destructive"}>
                      {debugInfo.metaMask?.available ? "Yes" : "No"}
                    </Badge>
                  </div>
                  {debugInfo.metaMask?.isMetaMask && (
                    <div className="flex items-center justify-between">
                      <span>Is MetaMask:</span>
                      <Badge variant="default">Yes</Badge>
                    </div>
                  )}
                  {debugInfo.metaMask?.version && (
                    <div className="flex items-center justify-between">
                      <span>Network Version:</span>
                      <span className="font-mono text-xs">{debugInfo.metaMask.version}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Accounts */}
              {debugInfo.accounts && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center">
                    <Info className="h-4 w-4 text-blue-500 mr-2" />
                    Connected Accounts
                  </h3>
                  <div className="pl-6 space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Count:</span>
                      <Badge variant="outline">{debugInfo.accounts.count}</Badge>
                    </div>
                    {debugInfo.accounts.addresses?.map((address: string, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="font-mono text-xs truncate max-w-32">
                          {address}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(address)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Network */}
              {debugInfo.network && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center">
                    <Info className="h-4 w-4 text-blue-500 mr-2" />
                    Network
                  </h3>
                  <div className="pl-6 space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Chain ID:</span>
                      <span className="font-mono text-xs">{debugInfo.network.chainId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Is Monad:</span>
                      <Badge variant={debugInfo.network.isMonad ? "default" : "secondary"}>
                        {debugInfo.network.isMonad ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Browser Info */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <Info className="h-4 w-4 text-blue-500 mr-2" />
                  Browser Information
                </h3>
                <div className="pl-6 space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Platform:</span>
                    <span className="text-xs">{debugInfo.browser?.platform}</span>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {Object.entries(debugInfo).some(([key, value]) => 
                value && typeof value === 'object' && 'error' in value
              ) && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center text-red-500">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Errors
                  </h3>
                  <div className="pl-6 space-y-1 text-sm">
                    {Object.entries(debugInfo).map(([key, value]) => 
                      value && typeof value === 'object' && 'error' in value && (
                        <div key={key} className="text-red-500">
                          <strong>{key}:</strong> {(value as any).error}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-4">
                <Button onClick={getDebugInfo} disabled={isLoading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(JSON.stringify(debugInfo, null, 2))}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletDebugInfo; 