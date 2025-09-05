import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { createTokenService } from '@/services/token-service';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/useWallet';
import { CONTRACTS } from '@/config/contracts';

interface ApprovalState {
  isChecking: boolean;
  isApproving: boolean;
  isApproved: boolean;
  allowance: string;
  requiredAmount: string;
  error: string | null;
}

export const useTokenApproval = () => {
  const { signer, address, isConnected } = useWallet();
  const { toast } = useToast();
  const [approvalStates, setApprovalStates] = useState<{
    [tokenAddress: string]: ApprovalState;
  }>({});

  // Check if tokens need approval
  const checkApproval = useCallback(async (
    tokenAddress: string,
    spenderAddress: string,
    requiredAmount: string
  ): Promise<boolean> => {
    if (!isConnected || !signer || !address) {
      return false;
    }

    try {
      setApprovalStates(prev => ({
        ...prev,
        [tokenAddress]: {
          ...prev[tokenAddress],
          isChecking: true,
          error: null,
          requiredAmount
        }
      }));

      const tokenService = createTokenService(tokenAddress);
      await tokenService.initialize(signer);

      // Check if token is native (no approval needed)
      if (tokenService.isNative()) {
        setApprovalStates(prev => ({
          ...prev,
          [tokenAddress]: {
            isChecking: false,
            isApproving: false,
            isApproved: true,
            allowance: ethers.MaxUint256.toString(),
            requiredAmount,
            error: null
          }
        }));
        return true;
      }

      const allowance = await tokenService.getAllowance(address, spenderAddress);
      const isApproved = ethers.parseUnits(allowance, 18) >= ethers.parseUnits(requiredAmount, 18);

      setApprovalStates(prev => ({
        ...prev,
        [tokenAddress]: {
          isChecking: false,
          isApproving: false,
          isApproved,
          allowance,
          requiredAmount,
          error: null
        }
      }));

      return isApproved;
    } catch (error) {
      setApprovalStates(prev => ({
        ...prev,
        [tokenAddress]: {
          isChecking: false,
          isApproving: false,
          isApproved: false,
          allowance: '0',
          requiredAmount,
          error: error instanceof Error ? error.message : 'Failed to check approval'
        }
      }));
      return false;
    }
  }, [isConnected, signer, address]);

  // Approve tokens
  const approveTokens = useCallback(async (
    tokenAddress: string,
    spenderAddress: string,
    amount: string
  ): Promise<boolean> => {
    if (!isConnected || !signer || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to approve tokens",
        variant: "destructive",
      });
      return false;
    }

    try {
      setApprovalStates(prev => ({
        ...prev,
        [tokenAddress]: {
          ...prev[tokenAddress],
          isApproving: true,
          error: null
        }
      }));

      const tokenService = createTokenService(tokenAddress);
      await tokenService.initialize(signer);

      // Native tokens don't need approval
      if (tokenService.isNative()) {
        setApprovalStates(prev => ({
          ...prev,
          [tokenAddress]: {
            isChecking: false,
            isApproving: false,
            isApproved: true,
            allowance: ethers.MaxUint256.toString(),
            requiredAmount: amount,
            error: null
          }
        }));
        return true;
      }

      const txHash = await tokenService.approve(spenderAddress, amount);

      toast({
        title: "Approval Successful! 🎉",
        description: `Tokens approved successfully. Transaction: ${txHash.slice(0, 10)}...`,
      });

      // Update approval state
      setApprovalStates(prev => ({
        ...prev,
        [tokenAddress]: {
          isChecking: false,
          isApproving: false,
          isApproved: true,
          allowance: amount,
          requiredAmount: amount,
          error: null
        }
      }));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve tokens';
      
      setApprovalStates(prev => ({
        ...prev,
        [tokenAddress]: {
          ...prev[tokenAddress],
          isApproving: false,
          error: errorMessage
        }
      }));

      toast({
        title: "Approval Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    }
  }, [isConnected, signer, address, toast]);

  // Get approval state for a token
  const getApprovalState = useCallback((tokenAddress: string): ApprovalState => {
    return approvalStates[tokenAddress] || {
      isChecking: false,
      isApproving: false,
      isApproved: false,
      allowance: '0',
      requiredAmount: '0',
      error: null
    };
  }, [approvalStates]);

  // Check and approve tokens for trading
  const ensureApproval = useCallback(async (
    tokenAddress: string,
    amount: string
  ): Promise<boolean> => {
    const dexContractAddress = CONTRACTS.ORDERBOOK_DEX.address;
    
    // Check current approval
    const isApproved = await checkApproval(tokenAddress, dexContractAddress, amount);
    
    if (isApproved) {
      return true;
    }

    // Approve tokens
    return await approveTokens(tokenAddress, dexContractAddress, amount);
  }, [checkApproval, approveTokens]);

  return {
    checkApproval,
    approveTokens,
    ensureApproval,
    getApprovalState,
    approvalStates
  };
}; 