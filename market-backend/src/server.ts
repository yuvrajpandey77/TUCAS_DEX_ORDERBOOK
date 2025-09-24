import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { fetch } from 'undici';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT || 4001);
const RPC_URL = process.env.MAINNET_RPC_URL || 'https://ethereum.publicnode.com';
const provider = new ethers.JsonRpcProvider(RPC_URL);

const UNISWAP_V3_SUBGRAPH = process.env.GRAPH_API_KEY
  ? `https://gateway.thegraph.com/api/${process.env.GRAPH_API_KEY}/subgraphs/name/uniswap/uniswap-v3`
  : 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';

const app = express();
app.use(cors());

async function querySubgraph<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(UNISWAP_V3_SUBGRAPH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Subgraph error: ${res.status} ${text}`);
  }
  const json = await res.json() as any;
  if (json.errors) {
    throw new Error(JSON.stringify(json.errors));
  }
  return json.data as T;
}

function resolveInterval(interval?: string): { entity: 'poolHourDatas' | 'poolDayDatas'; seconds: number } {
  switch ((interval || '1h').toLowerCase()) {
    case '1d':
      return { entity: 'poolDayDatas', seconds: 86400 };
    case '1h':
    default:
      return { entity: 'poolHourDatas', seconds: 3600 };
  }
}

app.get('/candles', async (req, res) => {
  try {
    const pool = String(req.query.pool || '').toLowerCase();
    const interval = String(req.query.interval || '1h');
    const limit = Math.min(parseInt(String(req.query.limit || '200'), 10), 500);
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
    type Resp = { [k: string]: Array<{ periodStartUnix: string; open: string; high: string; low: string; close: string; volumeToken0: string; volumeToken1: string }> };
    let data = await querySubgraph<Resp>(query, { pool, first: limit });
    let rows = data[entity] || [];
    // Fallback: if no hourly data, try daily
    if (!rows.length && entity === 'poolHourDatas') {
      const q2 = `
        query($pool: String!, $first: Int!) {
          poolDayDatas(first: $first, orderBy: date, orderDirection: desc, where: { pool: $pool }) {
            date
            open
            high
            low
            close
            volumeUSD
          }
        }
      `;
      type R2 = { poolDayDatas: Array<{ date: number; open: string; high: string; low: string; close: string; volumeUSD: string }> };
      const d2 = await querySubgraph<R2>(q2, { pool, first: Math.min(limit, 365) });
      const candles = (d2.poolDayDatas || [])
        .map(r => ({
          timestamp: Number(r.date) * 1000,
          open: Number(r.open),
          high: Number(r.high),
          low: Number(r.low),
          close: Number(r.close),
          volume: Number(r.volumeUSD)
        }))
        .reverse();
      return res.json({ interval: '1d', candles });
    }
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
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
});

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
    type Day = { date: number; volumeUSD: string; high: string; low: string; open: string; close: string };
    type Resp = { pool: any; poolDayDatas: Day[] };
    const data = await querySubgraph<Resp>(query, { pool });
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
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Market backend listening on :${PORT}`);
});

// WebSocket for real-time ticks using slot0
type Sub = { pool: string };
const wss = new WebSocketServer({ port: PORT + 1 });
console.log(`WS listening on :${PORT + 1}`);

const POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)'
];

const subs = new Map<any, Sub>();

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(String(raw));
      if (msg.type === 'subscribe' && typeof msg.pool === 'string') {
        subs.set(ws, { pool: msg.pool.toLowerCase() });
        ws.send(JSON.stringify({ type: 'subscribed', pool: msg.pool }));
      }
    } catch {}
  });
  ws.on('close', () => subs.delete(ws));
});

// Broadcast slot0 ticks every 2s
setInterval(async () => {
  const entries = Array.from(subs.entries());
  if (!entries.length) return;
  for (const [ws, sub] of entries) {
    if (ws.readyState !== ws.OPEN) continue;
    try {
      const pool = new ethers.Contract(sub.pool, POOL_ABI, provider);
      const s = await pool.slot0();
      // Convert sqrtPriceX96 to price ratio token1/token0
      const sqrt = BigInt(s.sqrtPriceX96.toString());
      const priceX192 = sqrt * sqrt; // Q192
      const Q192 = 2n ** 192n;
      const price = Number(priceX192) / Number(Q192); // approximate
      ws.send(JSON.stringify({
        type: 'tick',
        pool: sub.pool,
        tick: Number(s.tick),
        price,
        ts: Date.now()
      }));
    } catch (e) {
      // ignore per-connection errors
    }
  }
}, 2000);


