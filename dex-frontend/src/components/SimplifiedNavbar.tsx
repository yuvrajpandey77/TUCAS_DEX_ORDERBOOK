import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSimplifiedWallet } from '@/hooks/useSimplifiedWallet';
import { formatAddress } from '@/lib/utils';
import { Wallet, Menu, X, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Coins, RefreshCw, Loader2 } from 'lucide-react';
import SimplifiedConnectWallet from './SimplifiedConnectWallet';

const SimplifiedNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);
  const tokenDropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    isConnected,
    address,
    chainId,
    networkName,
    isLoading,
    error,
    isOnCorrectNetwork,
    switchToMainnet,
    connect,
    disconnect,
    formattedAddress
  } = useSimplifiedWallet();

  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tokenDropdownRef.current && !tokenDropdownRef.current.contains(event.target as Node)) {
        setIsTokenDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNetworkStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-3 w-3 animate-spin" />;
    if (!isOnCorrectNetwork) return <AlertCircle className="h-3 w-3 text-yellow-500" />;
    return <CheckCircle className="h-3 w-3 text-green-500" />;
  };

  const getNetworkStatusText = () => {
    if (isLoading) return 'Connecting...';
    if (!isOnCorrectNetwork) return 'Wrong Network';
    return networkName || 'Unknown';
  };

  const handleConnect = async () => {
    try {
      await connect();
      setIsWalletModalOpen(false);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsWalletModalOpen(false);
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchToMainnet();
    } catch (error) {
      console.error('Network switch failed:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DEX
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                Home
              </Link>
              <Link
                to="/swap"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/swap') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                Swap
              </Link>
              <Link
                to="/uniswap-demo"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/uniswap-demo') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                Uniswap Demo
              </Link>
            </div>

            {/* Wallet Section */}
            <div className="flex items-center space-x-4">
              {isConnected ? (
                <div className="flex items-center space-x-3">
                  {/* Network Status */}
                  <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-600">
                    <div>{getNetworkStatusIcon()}</div>
                    <span>{getNetworkStatusText()}</span>
                    {!isOnCorrectNetwork && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSwitchNetwork}
                        className="h-6 px-2"
                      >
                        Switch to Mainnet
                      </Button>
                    )}
                  </div>

                  {/* Wallet Address */}
                  <div className="flex items-center space-x-2">
                    <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                      {formattedAddress}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsWalletModalOpen(true)}
                      className="h-8 px-3"
                    >
                      <Wallet className="w-4 h-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setIsWalletModalOpen(true)}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect Wallet
                    </>
                  )}
                </Button>
              )}

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2"
                >
                  {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col space-y-2">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/') 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/swap"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/swap') 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Swap
                </Link>
                <Link
                  to="/uniswap-demo"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/uniswap-demo') 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Uniswap Demo
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Wallet Modal */}
      <SimplifiedConnectWallet
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  );
};

export default SimplifiedNavbar;
