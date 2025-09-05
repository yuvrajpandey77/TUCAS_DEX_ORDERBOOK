export const NETWORK_CONFIG = {
  chainId: '0x13882', // 80002 in hex (Polygon Amoy)
  chainName: 'Polygon Amoy',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18
  },
  rpcUrls: ['https://rpc-amoy.polygon.technology'],
  blockExplorerUrls: ['https://amoy.polygonscan.com']
}

// Alternative network config for better MetaMask compatibility
export const ETH_NETWORK_CONFIG = {
  chainId: '0x13882', // 80002 in hex (Polygon Amoy)
  chainName: 'Polygon Amoy',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18
  },
  rpcUrls: ['https://rpc-amoy.polygon.technology'],
  blockExplorerUrls: ['https://amoy.polygonscan.com']
}

export const CONTRACT_ADDRESSES = {
  ORDERBOOK_DEX: '0x0000000000000000000000000000000000000000' // Update when deployed on Sepolia/Mainnet
}