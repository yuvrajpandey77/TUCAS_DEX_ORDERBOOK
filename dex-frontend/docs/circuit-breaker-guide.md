# MetaMask Circuit Breaker Error Handling Guide

## What is the Circuit Breaker Error?

The MetaMask circuit breaker is a built-in protection mechanism that prevents excessive RPC (Remote Procedure Call) requests to the blockchain. When triggered, it returns an error like:

```
Execution prevented because the circuit breaker is open
```

## Why Does This Happen?

1. **Excessive RPC Requests**: Too many blockchain calls in a short time period
2. **Network Congestion**: High gas prices or network issues
3. **MetaMask Internal Limits**: Built-in protection against spam/abuse
4. **Poor Network Connection**: Intermittent connectivity issues

## Implemented Solutions

### 1. Retry Logic with Exponential Backoff

The `DEXService` now includes a `executeWithRetry` method that:

- Detects circuit breaker errors automatically
- Implements exponential backoff (2s, 4s, 8s delays)
- Retries up to 3 times before giving up
- Provides clear error messages

```typescript
// Example usage in addTradingPair method
return this.executeWithRetry(async () => {
  // Transaction logic here
}, 3, 2000); // 3 retries, 2 second base delay
```

### 2. Circuit Breaker Detection Hook

The `useCircuitBreaker` hook provides:

- Automatic detection of circuit breaker errors
- State management for circuit breaker status
- User-friendly guidance messages
- Retry count tracking

```typescript
const { 
  detectCircuitBreakerError, 
  resetCircuitBreakerState, 
  getCircuitBreakerGuidance,
  isCircuitBreakerActive 
} = useCircuitBreaker();
```

### 3. Enhanced Error Handling

All blockchain operations now include specific error handling for:

- Circuit breaker errors
- Network connection issues
- Gas/nonce problems
- User rejection
- Contract-specific errors

### 4. User Interface Improvements

- Visual indicators when circuit breaker is active
- Disabled buttons during circuit breaker state
- Clear error messages with actionable guidance
- Toast notifications with specific instructions

## User Guidance

When users encounter circuit breaker errors, they should:

1. **Wait 30-60 seconds** before trying again
2. **Refresh the page** to reset MetaMask state
3. **Check internet connection** for stability
4. **Switch networks** in MetaMask if needed
5. **Close and reopen MetaMask** if the issue persists

## Best Practices for Developers

### 1. Implement Retry Logic

Always wrap blockchain operations in retry logic:

```typescript
const result = await executeWithRetry(async () => {
  return await contract.someFunction();
}, 3, 2000);
```

### 2. Provide Clear User Feedback

Show users what's happening and what they can do:

```typescript
if (isCircuitBreakerError) {
  toast({
    title: "MetaMask Circuit Breaker Active",
    description: "Please wait a moment and try again.",
    variant: "destructive",
  });
}
```

### 3. Graceful Degradation

When circuit breaker is active, fall back to mock data or cached data:

```typescript
if (isCircuitBreakerError) {
  setError('Using demo data - MetaMask circuit breaker active');
  // Use mock data instead
}
```

### 4. Rate Limiting

Implement client-side rate limiting to prevent triggering the circuit breaker:

```typescript
// Limit requests to once per 10 seconds
const lastRequestTime = useRef<number>(0);
const minInterval = 10000; // 10 seconds

if (Date.now() - lastRequestTime.current < minInterval) {
  return; // Skip request
}
```

## Monitoring and Debugging

### Console Logging

The implementation includes comprehensive logging:

```typescript
console.log(`Circuit breaker error detected. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
```

### Error Tracking

Track circuit breaker occurrences to identify patterns:

```typescript
// In your analytics or monitoring system
trackEvent('circuit_breaker_triggered', {
  operation: 'addTradingPair',
  retryCount: attempt,
  errorMessage: error.message
});
```

## Testing Circuit Breaker Handling

### Manual Testing

1. Trigger multiple rapid requests
2. Check retry behavior
3. Verify user feedback
4. Test fallback mechanisms

### Automated Testing

```typescript
describe('Circuit Breaker Handling', () => {
  it('should retry on circuit breaker errors', async () => {
    // Mock circuit breaker error
    // Verify retry logic
    // Check user feedback
  });
});
```

## Future Improvements

1. **Smart Retry Scheduling**: Use network conditions to adjust retry timing
2. **Circuit Breaker Prediction**: Monitor request patterns to prevent triggering
3. **Alternative RPC Providers**: Fallback to different providers when MetaMask is blocked
4. **Request Batching**: Combine multiple requests to reduce RPC calls
5. **Caching Strategy**: Cache frequently accessed data to reduce blockchain calls

## Related Files

- `src/services/dex-service.ts` - Main retry logic implementation
- `src/hooks/use-circuit-breaker.ts` - Circuit breaker detection hook
- `src/components/AddTradingPair.tsx` - UI integration example
- `src/hooks/use-order-book.ts` - Order book with circuit breaker handling 