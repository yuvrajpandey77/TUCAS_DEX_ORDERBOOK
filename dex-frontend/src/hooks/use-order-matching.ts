import { useState, useCallback } from 'react';
import { useDEXStore } from '@/store/dex-store';
import { orderMatchingService, MatchingResult } from '@/services/order-matching-service';
import { useToast } from '@/hooks/use-toast';

interface OrderMatchingState {
  isChecking: boolean;
  isExecuting: boolean;
  canFill: boolean;
  fillAmount?: string;
  fillPrice?: string;
  estimatedSlippage?: string;
  error: string | null;
}

export const useOrderMatching = () => {
  const { selectedPair, isConnected, signer } = useDEXStore();
  const { toast } = useToast();
  const [matchingState, setMatchingState] = useState<OrderMatchingState>({
    isChecking: false,
    isExecuting: false,
    canFill: false,
    error: null
  });

  // Check if a limit order can be filled immediately
  const checkImmediateFill = useCallback(async (
    amount: string,
    price: string,
    isBuy: boolean
  ): Promise<boolean> => {
    if (!isConnected || !signer || !selectedPair) {
      setMatchingState(prev => ({
        ...prev,
        error: 'Wallet not connected or no trading pair selected'
      }));
      return false;
    }

    try {
      setMatchingState(prev => ({
        ...prev,
        isChecking: true,
        error: null
      }));

      const result = await orderMatchingService.checkImmediateFill(
        selectedPair.baseToken,
        selectedPair.quoteToken,
        amount,
        price,
        isBuy,
        signer
      );

      setMatchingState({
        isChecking: false,
        isExecuting: false,
        canFill: result.canFill,
        fillAmount: result.fillAmount,
        fillPrice: result.fillPrice,
        estimatedSlippage: result.estimatedSlippage,
        error: null
      });

      return result.canFill;
    } catch (error) {
      setMatchingState(prev => ({
        ...prev,
        isChecking: false,
        error: error instanceof Error ? error.message : 'Failed to check immediate fill'
      }));
      return false;
    }
  }, [isConnected, signer, selectedPair]);

  // Execute a market order
  const executeMarketOrder = useCallback(async (
    amount: string,
    isBuy: boolean
  ): Promise<MatchingResult> => {
    if (!isConnected || !signer || !selectedPair) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to execute market orders",
        variant: "destructive",
      });
      return { matched: false, error: 'Wallet not connected' };
    }

    try {
      setMatchingState(prev => ({
        ...prev,
        isExecuting: true,
        error: null
      }));

      const result = await orderMatchingService.executeMarketOrder(
        selectedPair.baseToken,
        selectedPair.quoteToken,
        amount,
        isBuy,
        signer
      );

      setMatchingState(prev => ({
        ...prev,
        isExecuting: false
      }));

      if (result.matched && result.matchDetails) {
        toast({
          title: "Market Order Executed Successfully! 🎉",
          description: `Executed ${result.matchDetails.matchedAmount} at ${result.matchDetails.matchedPrice}`,
        });
      } else {
        toast({
          title: "Market Order Failed",
          description: result.error || 'Failed to execute market order',
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      setMatchingState(prev => ({
        ...prev,
        isExecuting: false,
        error: error instanceof Error ? error.message : 'Failed to execute market order'
      }));
      
      toast({
        title: "Market Order Failed",
        description: error instanceof Error ? error.message : 'Failed to execute market order',
        variant: "destructive",
      });

      return { matched: false, error: error instanceof Error ? error.message : 'Failed to execute market order' };
    }
  }, [isConnected, signer, selectedPair, toast]);

  // Get order book depth analysis
  const getOrderBookDepth = useCallback(async () => {
    if (!isConnected || !signer || !selectedPair) {
      return null;
    }

    try {
      return await orderMatchingService.getOrderBookDepth(
        selectedPair.baseToken,
        selectedPair.quoteToken,
        signer
      );
    } catch (error) {
      return null;
    }
  }, [isConnected, signer, selectedPair]);

  // Clear matching state
  const clearMatchingState = useCallback(() => {
    setMatchingState({
      isChecking: false,
      isExecuting: false,
      canFill: false,
      error: null
    });
  }, []);

  return {
    matchingState,
    checkImmediateFill,
    executeMarketOrder,
    getOrderBookDepth,
    clearMatchingState
  };
}; 