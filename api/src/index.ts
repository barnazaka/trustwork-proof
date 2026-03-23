import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { TrustWork, witnesses } from '../../contract/src/index.js';
import type { TrustWorkPrivateState } from '../../contract/src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ZK_CONFIG_PATH = path.resolve(__dirname, '../../contract/src/managed/trustwork');
const PRIVATE_STATE_ID = 'trustworkPrivateState' as const;

export type { TrustWorkPrivateState };

export interface Config {
  indexer: string;
  indexerWS: string;
  proofServer: string;
}

export const DEVNET_CONFIG: Config = {
  indexer: 'http://127.0.0.1:8088/api/v1/graphql',
  indexerWS: 'ws://127.0.0.1:8088/api/v1/graphql',
  proofServer: 'http://127.0.0.1:6300',
};

const compiledContract = CompiledContract.make('trustwork', TrustWork.Contract).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets(ZK_CONFIG_PATH),
);

export const buildProviders = (
  walletProvider: any,
  midnightProvider: any,
  config: Config = DEVNET_CONFIG,
) => {
  const zkConfigProvider = new NodeZkConfigProvider(ZK_CONFIG_PATH);
  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: PRIVATE_STATE_ID,
      walletProvider,
    }),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider,
  };
};

export const deployTrustWork = async (
  providers: ReturnType<typeof buildProviders>,
  score: bigint,
  nonce: Uint8Array,
) => {
  const initialPrivateState: TrustWorkPrivateState = { score, nonce };
  const deployed = await deployContract(providers, {
    compiledContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState,
  });
  console.log(`Contract deployed at: ${deployed.deployTxData.public.contractAddress}`);
  return deployed;
};

export const joinTrustWork = async (
  providers: ReturnType<typeof buildProviders>,
  contractAddress: string,
  score: bigint,
  nonce: Uint8Array,
) => {
  return await findDeployedContract(providers, {
    contractAddress,
    compiledContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: { score, nonce },
  });
};

export const register = async (contract: any) => {
  const tx = await contract.callTx.register();
  console.log(`Score registered. TX: ${tx.public.txId} in block ${tx.public.blockHeight}`);
  return tx.public;
};

export const verifyAboveThreshold = async (contract: any, threshold: bigint) => {
  const tx = await contract.callTx.verify_above_threshold(threshold);
  console.log(`Verified score >= ${threshold}. TX: ${tx.public.txId}`);
  return tx.public;
};

export const getContractState = async (
  providers: ReturnType<typeof buildProviders>,
  contractAddress: string,
) => {
  const state = await providers.publicDataProvider.queryContractState(contractAddress);
  if (!state) return null;
  return TrustWork.ledger(state.data);
};
