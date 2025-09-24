// Simple market data backend for Uniswap V3 (Mainnet)
// Endpoints:
//  - GET /candles?pool=0x...&interval=1h&limit=200
//  - GET /ticker?pool=0x...

const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');

const PORT = process.env.PORT || 4001;
const RPC_URL = process.env.MAINNET_RPC_URL || 'https://ethereum.publicnode.com';
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Uniswap V3 Subgraph (mainnet)
const UNISWAP_V3_SUBGRAPH = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';

const app = express();
app.use(cors());

async function querySubgraph(query, variables) {
  const res = await fetch(UNISWAP_V3_SUBGRAPH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  if (!res.ok) {
    throw new Error(`Subgraph error: ${res.status}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(JSON.stringify(json.errors));
  }
  return json.data;
}

// Map interval string to subgraph entity and seconds
function resolveInterval(interval) {
  switch ((interval || '1h').toLowerCase()) {
    case '1d':
      return { entity: 'poolDayDatas', seconds: 86400 };
    case '1h':
    default:
      return { entity: 'poolHourDatas', seconds: 3600 };
  }
}

// GET /candles
app.get('/candles', async (req, res) => {
  try {
    const pool = String(req.query.pool || '').toLowerCase();
    const interval = String(req.query.interval || '1h');
    const limit = Math.min(parseInt(req.query.limit || '200', 10), 500);
    if (!pool || !pool.startsWith('0x') || pool.length !== 42) {
      return res.status(400).json({ error: 'Invalid pool address' });
    }
    const { entity } = resolveInterval(interval);

    const query = `
      query($pool: String!, $first: Int!) {
        ${entity}(first: $first, orderBy: periodStartUnix, orderDirection: desc, where: { pool: $pool }) {
          periodStartUnix
          open
          high
          low
          close
          volumeToken0
          volumeToken1
        }
      }
    `;
    const data = await querySubgraph(query, { pool, first: limit });
    const rows = data[entity] || [];
    const candles = rows
      .map(r => ({
        timestamp: Number(r.periodStartUnix) * 1000,
        open: Number(r.open),
        high: Number(r.high),
        low: Number(r.low),
        close: Number(r.close),
        volume: Number(r.volumeToken0) + Number(r.volumeToken1)
      }))
      .reverse();
    return res.json({ interval, candles });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Server error' });
  }
});

// GET /ticker
app.get('/ticker', async (req, res) => {
  try {
    const pool = String(req.query.pool || '').toLowerCase();
    if (!pool || !pool.startsWith('0x') || pool.length !== 42) {
      return res.status(400).json({ error: 'Invalid pool address' });
    }
    const query = `
      query($pool: String!) {
        pool(id: $pool) {
          id
          token0 { symbol decimals }
          token1 { symbol decimals }
          feeTier
          liquidity
          sqrtPrice
          tick
          volumeUSD
          totalValueLockedUSD
        }
        poolDayDatas(first: 2, orderBy: date, orderDirection: desc, where: { pool: $pool }) {
          date
          volumeUSD
          high
          low
          open
          close
        }
      }
    `;
    const data = await querySubgraph(query, { pool });
    const p = data.pool;
    const d0 = (data.poolDayDatas || [])[0];
    const d1 = (data.poolDayDatas || [])[1];
    const price = d0 ? Number(d0.close) : 0;
    const prev = d1 ? Number(d1.close) : price;
    const change = prev ? ((price - prev) / prev) * 100 : 0;
    const volume24h = d0 ? Number(d0.volumeUSD) : 0;
    const high24h = d0 ? Number(d0.high) : price;
    const low24h = d0 ? Number(d0.low) : price;
    return res.json({
      pool: p?.id,
      token0: p?.token0?.symbol,
      token1: p?.token1?.symbol,
      feeTier: p?.feeTier,
      price,
      changePercent24h: change,
      volume24h,
      high24h,
      low24h,
      timestamp: Date.now()
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Market backend listening on :${PORT}`);
});


