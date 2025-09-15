export const NETWORK_CONFIG = {
  chainId: '0xAA36A7', // 11155111 in hex (Sepolia)
  chainName: 'Sepolia',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
  blockExplorerUrls: ['https://sepolia.etherscan.io']
}

// Alternative network config for better MetaMask compatibility
export const ETH_NETWORK_CONFIG = {
  chainId: '0xAA36A7', // 11155111 in hex (Sepolia)
  chainName: 'Sepolia',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
  blockExplorerUrls: ['https://sepolia.etherscan.io']
}

export const CONTRACT_ADDRESSES = {
  ORDERBOOK_DEX: '0x0000000000000000000000000000000000000000' // Update when deployed on Sepolia/Mainnet
}