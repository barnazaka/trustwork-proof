# TrustWork Proof of Reputation

A privacy-preserving worker reputation system built on [Midnight Network](https://midnight.network).

Workers register a private reputation score on-chain. Employers verify the score meets a minimum threshold without ever seeing the actual score.

---

## How it works

1. Worker calls `register()` with their private score
2. A cryptographic commitment to the score is stored on-chain, not the score itself
3. An employer requests verification with a minimum threshold
4. The worker's local proof server generates a ZK proof that `score >= threshold`
5. The network verifies the proof. The actual score is never revealed

---

## Project structure
```
trustwork-proof/
├── contract/
│   └── src/
│       ├── trustwork.compact         # Compact smart contract
│       └── managed/trustwork/        # Compiled contract artifacts (generated)
├── api/
│   └── src/
│       └── index.ts                  # TypeScript API using Midnight SDK
├── cli/
│   └── src/
│       ├── index.ts                  # CLI commands
│       └── providers.ts              # Midnight provider setup
├── api/tsconfig.json
├── cli/tsconfig.json
└── package.json
```

---

## Prerequisites

- Node.js >= 22
- Docker (for running the local proof server)
- Compact compiler — install via:
```bash
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
```

---

## Getting started

### 1. Clone and install
```bash
git clone https://github.com/barnazaka/trustwork-proof
cd trustwork-proof
npm install
```

### 2. Start the proof server
```bash
docker run -p 6300:6300 midnightntwrk/proof-server:7.0.0 -- midnight-proof-server -v
```

### 3. Compile the contract
```bash
npm run compile-contract
```

This generates the `contract/src/managed/trustwork/` directory with compiled artifacts.

### 4. Build the project
```bash
npm run build
```

### 5. Run the CLI
```bash
npm start
```

---

## Environment variables
```
MIDNIGHT_PROOF_SERVER_URL=http://127.0.0.1:6300
MIDNIGHT_INDEXER_URL=http://127.0.0.1:8088/api/v1/graphql
MIDNIGHT_INDEXER_WS_URL=ws://127.0.0.1:8088/api/v1/graphql
MIDNIGHT_NODE_URL=http://127.0.0.1:9944
```

---

## Key design decisions

**Why commitments instead of direct storage?**
Storing `score = 94` on-chain makes the score public forever. Instead we store `commitment = hash(score, nonce)`. Binding, hiding, and the actual score never touches the chain.

**Why does the threshold stay public?**
The threshold is the employer's requirement, not sensitive data. The ZK proof only asserts `score >= threshold` without revealing what the score is.

---

## Built with

- [Midnight Network](https://midnight.network)
- [Compact](https://docs.midnight.network/compact) — Midnight's smart contract language
- [Midnight JS SDK](https://docs.midnight.network/sdks)
- TypeScript

---

## Related

Simplified on-chain prototype of [TrustWork](https://github.com/barnazaka) — portable worker reputation infrastructure for emerging markets.
