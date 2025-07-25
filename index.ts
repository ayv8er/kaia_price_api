import express from 'express'
import { createPublicClient, http } from 'viem'
import { defineChain } from 'viem/utils'

const app = express()
const port = 3000

const kaia = defineChain({
  id: 8217,
  name: 'Kaia',
  nativeCurrency: {
    name: 'Kaia',
    symbol: 'KAIA',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://public-en.node.kaia.io'] },
    public: { http: ['https://public-en.node.kaia.io'] },
  },
})

const KAIA_USDT_PROXY = '0x9254cd72f207cc231a2307eac5e4bfa316eb0c2e'
const ETH_USDT_PROXY = '0xbf61f1f8d45ecb33006a335e7c76f306689dcaab'

const FEED_ABI = [
  {
    name: 'latestRoundData',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'roundId', type: 'uint64' },
      { name: 'answer', type: 'int256' },
      { name: 'updatedAt', type: 'uint256' },
    ],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const

const client = createPublicClient({
  chain: kaia,
  transport: http(),
})

function formatFixedPoint(value: bigint, decimals: number = 8): string {
  const multiplier = 10n ** BigInt(decimals)
  const integerPart = value / multiplier
  const fractionalPart = value % multiplier
  return `${integerPart}.${fractionalPart.toString().padStart(decimals, '0')}`
}

async function fetchPrice(proxy: `0x${string}`) {
  const [[roundId, answer, updatedAt], decimals] = await Promise.all([
    client.readContract({
      address: proxy,
      abi: FEED_ABI,
      functionName: 'latestRoundData',
    }),
    client.readContract({
      address: proxy,
      abi: FEED_ABI,
      functionName: 'decimals',
    }),
  ])
  return { roundId: Number(roundId), price: BigInt(answer), updatedAt: Number(updatedAt), decimals }
}

app.get('/price', async (req, res) => {
  const denom = req.query.denom === 'eth' ? 'eth' : 'usd'
  const scale = 10n ** 8n

  try {
    const kaia = await fetchPrice(KAIA_USDT_PROXY)
    const kaiaUsd = (kaia.price * scale) / 10n ** BigInt(kaia.decimals)

    let result = kaiaUsd

    if (denom === 'eth') {
      const eth = await fetchPrice(ETH_USDT_PROXY)
      const ethUsd = (eth.price * scale) / 10n ** BigInt(eth.decimals)
      result = (kaiaUsd * scale) / ethUsd
    }

    res.json({
      symbol: 'KAIA',
      [`price_${denom}`]: formatFixedPoint(result, 8),
    })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

app.listen(port, () => {
  console.log(`Kaia price API running on http://localhost:${port}`)
})
