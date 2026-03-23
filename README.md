# TrustWork Proof of Reputation

A privacy-preserving worker reputation system built on [Midnight Network](https://midnight.network).

Workers register a private score on-chain using ZK commitments. Employers verify the score meets a threshold without ever seeing the actual score.

---

## How it works

1. Worker calls `register()` — score is committed on-chain using `persistentCommit`, never stored raw
2. Employer requests verification with a minimum threshold
3. Worker's local proof server generates a ZK proof that `score >= threshold`
4. Network verifies the proof. Score stays private.

---

## Project structure
```
trustwork-proof/
├── contract/
│   └── src/
│       ├── trustwork.compact         # Compact smart contract
│       ├── witnesses.ts              # Private state witness implementations
│       ├── index.ts                  # Contract exports
│       └── managed/trustwork/        # Compiled artifacts (generated)
├── api/
│   ├── tsconfig.json
│   └── src/
│       └── index.ts                  # TypeScript API using Midnight SDK
├── cli/
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                  # Interactive CLI
│       └── providers.ts              # Wallet + provider setup
└── package.json
```

---

## Prerequisites

- Node.js >= 22
- Docker (for the proof server)
- Compact compiler:
```bash
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
```

---

## Getting started
```bash
git clone https://github.com/barnazaka/trustwork-proof
cd trustwork-proof
npm install
```

Start the proof server:
```bash
docker run -p 6300:6300 midnightntwrk/proof-server:7.0.0 -- midnight-proof-server -v
```

Compile the contract:
```bash
npm run compile-contract
```

Build:
```bash
npm run build
```

Run:
```bash
npm start
```

---

## Environment
```
MIDNIGHT_PROOF_SERVER_URL=http://127.0.0.1:6300
MIDNIGHT_INDEXER_URL=http://127.0.0.1:8088/api/v1/graphql
MIDNIGHT_NODE_URL=http://127.0.0.1:9944
```

---

## Built with

- [Midnight Network](https://midnight.network)
- [Compact](https://docs.midnight.network/compact)
- [Midnight JS SDK](https://docs.midnight.network/sdks)
- TypeScript
