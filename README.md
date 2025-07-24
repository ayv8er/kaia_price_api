# Kaia Price API (TypeScript)

A simple Express.js API written in TypeScript that fetches the price of the **KAIA** token from the **Kaia network** using **Orakl Network premium price feeds**.

## Prerequisites

- Node.js
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository_url>
   cd kaia_price_api
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory (optional) for unique RPC URL

## Running the API

### For Production/Staging

1. Compile TypeScript:
   ```bash
   npm run build
   ```

2. Start the server:
   ```bash
   npm start
   ```

   The API will be running on `http://localhost:3000` (or other specified port).

### For Local Development

You can run the application directly using `ts-node`:

   ```bash
   npm run dev
   ```

   The API will be running on `http://localhost:3000` (or other specified port).

## Endpoint

### GET /price

Fetches the current price of the KAIA token from Orakl Network price feeds.

- **URL:** `/price`
- **Method:** `GET`
- **Query Parameters:**
  - `denom` (optional): Specifies the denomination for the price.
    - `usd` (default): Returns the price in USD.
    - `eth`: Returns the price in ETH.

- **Success Response:**
  - **Code:** `200 OK`
  - **Content Example (denom=usd):**
    ```json
    {
      "symbol": "KAIA",
      "price_usd": "0.07325000"
    }
    ```
  - **Content Example (denom=eth):**
    ```json
    {
      "symbol": "KAIA",
      "price_eth": "0.00002215"
    }
    ```

- **Error Response:**
  - **Code:** `500 Internal Server Error`
  - **Content Example:**
    ```json
    {
      "error": "Error message describing the issue"
    }
    ```

## How it Works

The API uses [`viem`](https://viem.sh) to interact with **Orakl FeedProxy contracts** deployed on the **Kaia blockchain**, accessed via a public RPC.

1. **KAIA/USDT Price**: Fetched from the Orakl premium proxy at  
   `0x9254cd72f207cc231a2307eac5e4bfa316eb0c2e`

2. **ETH/USDT Price**: If `denom=eth` is provided, the ETH/USDT price is fetched from  
   `0xbf61f1f8d45ecb33006a335e7c76f306689dcaab`, and KAIA/ETH is computed as:  
   ```
   KAIA/ETH = (KAIA/USDT) ÷ (ETH/USDT)
   ```

Both proxies conform to Orakl’s updated `latestRoundData()` signature:
```solidity
function latestRoundData()
  external
  view
  returns (uint64 roundId, int256 answer, uint256 updatedAt)
```

A separate `decimals()` function is called for proper fixed-point formatting.

## License

ISC
