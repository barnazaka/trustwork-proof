import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";

const PROOF_SERVER_URL = process.env.MIDNIGHT_PROOF_SERVER_URL || "http://127.0.0.1:6300";
const INDEXER_URL = process.env.MIDNIGHT_INDEXER_URL || "http://127.0.0.1:8088/api/v1/graphql";
const INDEXER_WS_URL = process.env.MIDNIGHT_INDEXER_WS_URL || "ws://127.0.0.1:8088/api/v1/graphql";

export async function buildMidnightProviders() {
  return {
    proofProvider: httpClientProofProvider(PROOF_SERVER_URL),
    publicDataProvider: indexerPublicDataProvider(INDEXER_URL, INDEXER_WS_URL),
    walletProvider: null,
  };
}
