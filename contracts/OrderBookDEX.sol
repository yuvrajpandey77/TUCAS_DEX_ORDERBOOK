// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
/**
 * @title OrderBookDEX
 * @dev High-performance on-chain order book DEX for Ethereum
 * Features: Limit orders, market orders, order matching, liquidity pools
 */
contract OrderBookDEX is ReentrancyGuard, Ownable {
    
    // Structs
    struct Order {
        uint256 id;
        address trader;
        address baseToken;
        address quoteToken;
        uint256 amount;
        uint256 price;
        bool isBuy;
        bool isActive;
        uint256 timestamp;
    }
    
    struct TradingPair {
        address baseToken;
        address quoteToken;
        bool isActive;
        uint256 minOrderSize;
        uint256 pricePrecision;
    }
    
    // State variables
    uint256 private _orderIdCounter;
    mapping(uint256 => Order) public orders;
    mapping(address => mapping(address => TradingPair)) public tradingPairs;
    mapping(address => uint256[]) public userOrders;
    mapping(address => mapping(address => uint256)) public balances;
    
    // Events
    event OrderPlaced(uint256 indexed orderId, address indexed trader, address baseToken, address quoteToken, uint256 amount, uint256 price, bool isBuy);
    event OrderMatched(uint256 indexed buyOrderId, uint256 indexed sellOrderId, address baseToken, address quoteToken, uint256 amount, uint256 price);
    event OrderCancelled(uint256 indexed orderId, address indexed trader);
    event TradingPairAdded(address indexed baseToken, address indexed quoteToken, uint256 minOrderSize);
    event LiquidityAdded(address indexed provider, address baseToken, address quoteToken, uint256 baseAmount, uint256 quoteAmount);
    event LiquidityRemoved(address indexed provider, address baseToken, address quoteToken, uint256 baseAmount, uint256 quoteAmount);
    
    // Constants
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant TRADING_FEE = 30; // 0.3%
    uint256 public constant LIQUIDITY_FEE = 25; // 0.25%
    
    // Native token address
    address public constant NATIVE_TOKEN = address(0);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Add a new trading pair
     */
    function addTradingPair(
        address baseToken,
        address quoteToken,
        uint256 minOrderSize,
        uint256 pricePrecision
    ) external onlyOwner {
        require(baseToken != quoteToken, "Tokens must be different");
        require(baseToken != address(0) || quoteToken != address(0), "At least one token must be non-zero");
        
        tradingPairs[baseToken][quoteToken] = TradingPair({
            baseToken: baseToken,
            quoteToken: quoteToken,
            isActive: true,
            minOrderSize: minOrderSize,
            pricePrecision: pricePrecision
        });
        
        emit TradingPairAdded(baseToken, quoteToken, minOrderSize);
    }
    
    /**
     * @dev Place a limit order
     */
    function placeLimitOrder(
        address baseToken,
        address quoteToken,
        uint256 amount,
        uint256 price,
        bool isBuy
    ) external payable nonReentrant returns (uint256 orderId) {
        TradingPair memory pair = tradingPairs[baseToken][quoteToken];
        require(pair.isActive, "Trading pair not active");
        require(amount >= pair.minOrderSize, "Order size too small");
        require(price > 0, "Invalid price");
        
        // Transfer tokens from trader
        if (isBuy) {
            uint256 quoteAmount = (amount * price) / pair.pricePrecision;
            
            if (quoteToken == NATIVE_TOKEN) {
                // Handle native token (ETH)
                require(msg.value >= quoteAmount, "Insufficient native token sent");
                balances[msg.sender][quoteToken] += quoteAmount;
            } else {
                // Handle ERC-20 tokens
                IERC20(quoteToken).transferFrom(msg.sender, address(this), quoteAmount);
                balances[msg.sender][quoteToken] += quoteAmount;
            }
        } else {
            if (baseToken == NATIVE_TOKEN) {
                // Handle native token (ETH)
                require(msg.value >= amount, "Insufficient native token sent");
                balances[msg.sender][baseToken] += amount;
            } else {
                // Handle ERC-20 tokens
                IERC20(baseToken).transferFrom(msg.sender, address(this), amount);
                balances[msg.sender][baseToken] += amount;
            }
        }
        
        // Create order
        orderId = _orderIdCounter;
        _orderIdCounter++;
        
        orders[orderId] = Order({
            id: orderId,
            trader: msg.sender,
            baseToken: baseToken,
            quoteToken: quoteToken,
            amount: amount,
            price: price,
            isBuy: isBuy,
            isActive: true,
            timestamp: block.timestamp
        });
        
        userOrders[msg.sender].push(orderId);
        
        emit OrderPlaced(orderId, msg.sender, baseToken, quoteToken, amount, price, isBuy);
        
        // Try to match orders
        _tryMatchOrders(baseToken, quoteToken);
    }
    
    /**
     * @dev Place a market order
     */
    function placeMarketOrder(
        address baseToken,
        address quoteToken,
        uint256 amount,
        bool isBuy
    ) external payable nonReentrant {
        TradingPair memory pair = tradingPairs[baseToken][quoteToken];
        require(pair.isActive, "Trading pair not active");
        require(amount >= pair.minOrderSize, "Order size too small");
        
        if (isBuy) {
            // Market buy - find best sell orders
            _executeMarketBuy(baseToken, quoteToken, amount);
        } else {
            // Market sell - find best buy orders
            _executeMarketSell(baseToken, quoteToken, amount);
        }
    }
    
    /**
     * @dev Cancel an order
     */
    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.trader == msg.sender, "Not your order");
        require(order.isActive, "Order already cancelled");
        
        order.isActive = false;
        
        // Return tokens to trader
        if (order.isBuy) {
            uint256 quoteAmount = (order.amount * order.price) / tradingPairs[order.baseToken][order.quoteToken].pricePrecision;
            balances[msg.sender][order.quoteToken] -= quoteAmount;
            
            if (order.quoteToken == NATIVE_TOKEN) {
                // Return native tokens
                (bool success, ) = payable(msg.sender).call{value: quoteAmount}("");
                require(success, "Failed to return native tokens");
            } else {
                // Return ERC-20 tokens
                IERC20(order.quoteToken).transfer(msg.sender, quoteAmount);
            }
        } else {
            balances[msg.sender][order.baseToken] -= order.amount;
            
            if (order.baseToken == NATIVE_TOKEN) {
                // Return native tokens
                (bool success, ) = payable(msg.sender).call{value: order.amount}("");
                require(success, "Failed to return native tokens");
            } else {
                // Return ERC-20 tokens
                IERC20(order.baseToken).transfer(msg.sender, order.amount);
            }
        }
        
        emit OrderCancelled(orderId, msg.sender);
    }
    
    /**
     * @dev Get order book for a trading pair
     */
    function getOrderBook(address baseToken, address quoteToken) external view returns (
        uint256[] memory buyPrices,
        uint256[] memory buyAmounts,
        uint256[] memory sellPrices,
        uint256[] memory sellAmounts
    ) {
        // Count orders first
        uint256 buyCount = 0;
        uint256 sellCount = 0;
        
        for (uint256 i = 0; i < _orderIdCounter; i++) {
            Order memory order = orders[i];
            if (order.isActive && 
                order.baseToken == baseToken && 
                order.quoteToken == quoteToken) {
                if (order.isBuy) buyCount++;
                else sellCount++;
            }
        }
        
        // Initialize arrays
        buyPrices = new uint256[](buyCount);
        buyAmounts = new uint256[](buyCount);
        sellPrices = new uint256[](sellCount);
        sellAmounts = new uint256[](sellCount);
        
        uint256 buyIndex = 0;
        uint256 sellIndex = 0;
        
        // Fill arrays
        for (uint256 i = 0; i < _orderIdCounter; i++) {
            Order memory order = orders[i];
            if (order.isActive && 
                order.baseToken == baseToken && 
                order.quoteToken == quoteToken) {
                if (order.isBuy) {
                    buyPrices[buyIndex] = order.price;
                    buyAmounts[buyIndex] = order.amount;
                    buyIndex++;
                } else {
                    sellPrices[sellIndex] = order.price;
                    sellAmounts[sellIndex] = order.amount;
                    sellIndex++;
                }
            }
        }
    }
    
    /**
     * @dev Get user's active orders
     */
    function getUserOrders(address user) external view returns (uint256[] memory) {
        uint256[] memory userOrderIds = userOrders[user];
        uint256 activeCount = 0;
        
        // Count active orders
        for (uint256 i = 0; i < userOrderIds.length; i++) {
            if (orders[userOrderIds[i]].isActive) {
                activeCount++;
            }
        }
        
        uint256[] memory activeOrders = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < userOrderIds.length; i++) {
            if (orders[userOrderIds[i]].isActive) {
                activeOrders[index] = userOrderIds[i];
                index++;
            }
        }
        
        return activeOrders;
    }
    
    /**
     * @dev Internal function to try matching orders
     */
    function _tryMatchOrders(address baseToken, address quoteToken) internal {
        // Find best buy and sell orders
        uint256 bestBuyOrderId = 0;
        uint256 bestSellOrderId = 0;
        uint256 bestBuyPrice = 0;
        uint256 bestSellPrice = type(uint256).max;
        
        for (uint256 i = 0; i < _orderIdCounter; i++) {
            Order memory order = orders[i];
            if (order.isActive && 
                order.baseToken == baseToken && 
                order.quoteToken == quoteToken) {
                
                if (order.isBuy && order.price > bestBuyPrice) {
                    bestBuyPrice = order.price;
                    bestBuyOrderId = i;
                } else if (!order.isBuy && order.price < bestSellPrice) {
                    bestSellPrice = order.price;
                    bestSellOrderId = i;
                }
            }
        }
        
        // Match if possible (buy price >= sell price)
        if (bestBuyPrice >= bestSellPrice && bestBuyOrderId != 0 && bestSellOrderId != 0) {
            _executeMatch(bestBuyOrderId, bestSellOrderId);
        }
    }
    
    /**
     * @dev Execute a match between buy and sell orders
     */
    function _executeMatch(uint256 buyOrderId, uint256 sellOrderId) internal {
        Order storage buyOrder = orders[buyOrderId];
        Order storage sellOrder = orders[sellOrderId];
        
        require(buyOrder.isActive && sellOrder.isActive, "Orders not active");
        require(buyOrder.isBuy && !sellOrder.isBuy, "Invalid order types");
        
        uint256 matchAmount = buyOrder.amount < sellOrder.amount ? buyOrder.amount : sellOrder.amount;
        uint256 matchPrice = (buyOrder.price + sellOrder.price) / 2; // Average price
        
        // Calculate fees
        uint256 tradingFee = (matchAmount * TRADING_FEE) / FEE_DENOMINATOR;
        uint256 baseAmount = matchAmount - tradingFee;
        uint256 quoteAmount = (baseAmount * matchPrice) / tradingPairs[buyOrder.baseToken][buyOrder.quoteToken].pricePrecision;
        
        // Transfer tokens between traders
        balances[buyOrder.trader][buyOrder.baseToken] += baseAmount;
        balances[sellOrder.trader][buyOrder.quoteToken] += quoteAmount;
        
        // Update order amounts
        buyOrder.amount -= matchAmount;
        sellOrder.amount -= matchAmount;
        
        // Deactivate orders if fully filled
        if (buyOrder.amount == 0) buyOrder.isActive = false;
        if (sellOrder.amount == 0) sellOrder.isActive = false;
        
        emit OrderMatched(buyOrderId, sellOrderId, buyOrder.baseToken, buyOrder.quoteToken, baseAmount, matchPrice);
    }
    
    /**
     * @dev Execute market buy
     */
    function _executeMarketBuy(address baseToken, address quoteToken, uint256 amount) internal {
        uint256 remainingAmount = amount;
        uint256 totalCost = 0;
        
        // Find sell orders and execute
        for (uint256 i = 0; i < _orderIdCounter && remainingAmount > 0; i++) {
            Order memory order = orders[i];
            if (order.isActive && 
                !order.isBuy && 
                order.baseToken == baseToken && 
                order.quoteToken == quoteToken) {
                
                uint256 matchAmount = remainingAmount < order.amount ? remainingAmount : order.amount;
                uint256 cost = (matchAmount * order.price) / tradingPairs[baseToken][quoteToken].pricePrecision;
                
                totalCost += cost;
                remainingAmount -= matchAmount;
                
                // Update order
                orders[i].amount -= matchAmount;
                if (orders[i].amount == 0) orders[i].isActive = false;
            }
        }
        
        require(remainingAmount == 0, "Insufficient liquidity");
        
        // Transfer quote tokens from buyer
        if (quoteToken == NATIVE_TOKEN) {
            require(msg.value >= totalCost, "Insufficient native token sent");
        } else {
            IERC20(quoteToken).transferFrom(msg.sender, address(this), totalCost);
        }
        
        balances[msg.sender][baseToken] += amount;
    }
    
    /**
     * @dev Execute market sell
     */
    function _executeMarketSell(address baseToken, address quoteToken, uint256 amount) internal {
        uint256 remainingAmount = amount;
        uint256 totalRevenue = 0;
        
        // Find buy orders and execute
        for (uint256 i = 0; i < _orderIdCounter && remainingAmount > 0; i++) {
            Order memory order = orders[i];
            if (order.isActive && 
                order.isBuy && 
                order.baseToken == baseToken && 
                order.quoteToken == quoteToken) {
                
                uint256 matchAmount = remainingAmount < order.amount ? remainingAmount : order.amount;
                uint256 revenue = (matchAmount * order.price) / tradingPairs[baseToken][quoteToken].pricePrecision;
                
                totalRevenue += revenue;
                remainingAmount -= matchAmount;
                
                // Update order
                orders[i].amount -= matchAmount;
                if (orders[i].amount == 0) orders[i].isActive = false;
            }
        }
        
        require(remainingAmount == 0, "Insufficient liquidity");
        
        // Transfer base tokens from seller
        if (baseToken == NATIVE_TOKEN) {
            require(msg.value >= amount, "Insufficient native token sent");
        } else {
            IERC20(baseToken).transferFrom(msg.sender, address(this), amount);
        }
        
        balances[msg.sender][quoteToken] += totalRevenue;
    }
    
    /**
     * @dev Withdraw tokens from contract
     */
    function withdraw(address token, uint256 amount) external nonReentrant {
        require(balances[msg.sender][token] >= amount, "Insufficient balance");
        balances[msg.sender][token] -= amount;
        
        if (token == NATIVE_TOKEN) {
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "Failed to withdraw native tokens");
        } else {
            IERC20(token).transfer(msg.sender, amount);
        }
    }
    
    /**
     * @dev Get user balance
     */
    function getUserBalance(address user, address token) external view returns (uint256) {
        return balances[user][token];
    }
    
    /**
     * @dev Check if trading pair is active
     */
    function isTradingPairActive(address baseToken, address quoteToken) external view returns (bool) {
        return tradingPairs[baseToken][quoteToken].isActive;
    }
    
    /**
     * @dev Receive function for native tokens
     */
    receive() external payable {
        // Allow receiving native tokens
    }
    
    /**
     * @dev Fallback function
     */
    fallback() external payable {
        // Allow receiving native tokens
    }
} 