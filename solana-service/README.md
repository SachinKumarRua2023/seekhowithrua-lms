# SEEKHO Solana Token Service

Microservice for handling SPL token transfers for SEEKHO (SKO) token.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set environment variables
export SEEKHO_TOKEN_MINT="your_spl_token_mint_address"
export AUTHORITY_KEYPAIR="base58_secret_key"
export SERVICE_SECRET="shared_secret_with_django"
export SOLANA_RPC="https://api.mainnet-beta.solana.com"

# Run
npm start
```

## 🏗️ Architecture

```
Mobile App → Django Backend → Solana Service → Solana Blockchain
     ↓            ↓                ↓
   VCRoom    token_views.py    index.js (this)
```

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `SEEKHO_TOKEN_MINT` | SPL token mint address |
| `AUTHORITY_KEYPAIR` | Base58 secret key of token authority |
| `SERVICE_SECRET` | Shared secret with Django backend |
| `SOLANA_RPC` | Solana RPC endpoint |
| `PORT` | Service port (default: 3001) |

## 📡 API Endpoints

### POST /transfer
Transfer SEEKHO tokens to a wallet.

**Headers:**
```
Authorization: Bearer {SERVICE_SECRET}
Content-Type: application/json
```

**Body:**
```json
{
  "recipient": "wallet_address",
  "amount": 100,
  "token_mint": "optional_override"
}
```

### GET /balance/:address
Check SOL balance of an address.

### GET /health
Health check endpoint.

## 🌐 Deployment

### Railway (Recommended)
```bash
railway login
railway init
railway up
```

### Render
1. Connect GitHub repo
2. Set environment variables
3. Deploy

## 📝 Creating SPL Token

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Create token
spl-token create-token
spl-token create-account <TOKEN_MINT>
spl-token mint <TOKEN_MINT> 1000000

# Save mint address and authority keypair
```
