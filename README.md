# TrustWork Proof of Reputation 00000000000000000000000000

A privacy-preserving worker reputation system built on [Midnight Network](https://midnight.network).

Workers register a private reputation score on-chain. Employers verify the score meets a minimum threshold — without ever seeing the actual score.

Built with Midnight's zero-knowledge proofs and Compact smart contracts.

---

## Why this matters

In emerging markets, workers often can't prove their trustworthiness across platforms. Sharing a raw score exposes sensitive data. TrustWork Proof of Reputation solves this with selective disclosure: prove you qualify without revealing how much you qualify by.

**Example:** A freelancer with a score of 94 can prove to a client their score is above 80 — without revealing it's 94.

---

## How it works

```
Worker                         Blockchain (Midnight)         Employer
  |                                    |                        |
  |-- register(score=94) -----------> |                        |
  |   [score stays private]           |                        |
  |   [commitment stored on-chain] -->|                        |
  |                                   |                        |
  |<-- verify_above_threshold(80) ----|<-- verify request -----|
  |   [ZK proof generated locally]    |                        |
  |   [proof: score >= 80, TRUE] ---->|                        |
  |                                   |-- result: VERIFIED --> |
  |                                   |   (actual score: ???)  |
```

1. Worker calls `register()` with their private score
2. A cryptographic commitment to the score is stored on-chain — not the score itself
3. An employer requests verification with a minimum threshold
4. The worker's proof server generates a ZK proof that `score >= threshold`
5. The network verifies the proof — the actual score is never revealed

---

## Project structure

```
trustwork-proof/
├── contract/
│   └── src/
│       └── trustwork.compact     # Compact smart contract
├── api/
│   └── src/
│       └── index.ts              # TypeScript API layer
├── cli/
│   └── src/
│       ├── index.ts              # CLI commands
│       └── providers.ts          # Midnight network providers
└── package.json
```

---

## Prerequisites

- Node.js >= 22
- Docker (for running the local devnet)
- Midnight toolchain: `npm install -g @midnight-ntwrk/midnight-js-cli`
- Compact compiler: `npm install -g @midnight-ntwrk/compactc`
- Lace wallet (browser extension)

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/barnazaka/trustwork-proof
cd trustwork-proof
npm install
```

### 2. Start the local devnet

```bash
npx midnight-js-cli start-devnet
```

This starts the local blockchain, proof server, and indexer via Docker.

### 3. Compile the contract

```bash
npm run compile-contract
```

### 4. Build the project

```bash
npm run build
```

### 5. Deploy the contract

```bash
npx trustwork deploy
```

Copy the contract address from the output.

### 6. Register as a worker

```bash
npx trustwork register
```

Enter your score (0-100) and the contract address. Your score is kept private.

### 7. Verify against a threshold

```bash
npx trustwork verify 75
```

This generates a ZK proof that your score is at or above 75. No one sees your actual score.

### 8. Check contract status

```bash
npx trustwork status
```

---

## Environment variables

For testnet deployment, override these defaults:

```bash
MIDNIGHT_PROOF_SERVER_URL=http://127.0.0.1:6300
MIDNIGHT_INDEXER_URL=http://127.0.0.1:8088/api/v1/graphql
MIDNIGHT_INDEXER_WS_URL=ws://127.0.0.1:8088/api/v1/graphql
MIDNIGHT_NODE_URL=http://127.0.0.1:9944
```

---

## Key design decisions

**Why commitments and not direct storage?**
Storing `score = 94` on-chain would make the score public forever. Instead we store `commitment = hash(score, nonce)`. This is binding (you can't change your score later) and hiding (nobody can reverse-engineer the score from the commitment).

**Why does the threshold stay public?**
The threshold is the employer's requirement - it's not sensitive. The worker's score is what stays private. The ZK proof only asserts `score >= threshold` without revealing `score`.

**Why a round counter?**
The round counter ensures that a worker's derived public key changes between registration cycles, preventing linkability across contract interactions.

---

## Built with

- [Midnight Network](https://midnight.network)
- [Compact](https://docs.midnight.network/compact) - Midnight's smart contract language
- [Midnight SDK](https://docs.midnight.network/sdks)
- TypeScript

---

## Related

This project is a simplified on-chain prototype of [TrustWork](https://github.com/barnazaka) — a portable worker reputation infrastructure for emerging markets.
