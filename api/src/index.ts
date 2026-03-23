import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { TrustWork, witnesses } from '../../../contract/src/managed/trustwork/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ZK_CONFIG_PATH = path.resolve(__dirname, '../../../contract/src/managed/trustwork');

const PRIVATE_STATE_ID = 'trustworkPrivateState' as const;

export const DEVNET_CONFIG = {
  indexer: 'http://127.0.0.1:8088/api/v1/graphql',
  indexerWS: 'ws://127.0.0.1:8088/api/v1/graphql',
  node: 'http://127.0.0.1:9944',
  proofServer: 'http://127.0.0.1:6300',
};

export type TrustWorkPrivateState = {
  score: bigint;
};

const compiledContract = CompiledContract.make('trustwork', TrustWork.Contract).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets(ZK_CONFIG_PATH),
);

export const buildProviders = (
  walletProvider: any,
  midnightProvider: any,
  config = DEVNET_CONFIG,
) => {
  setNetworkId('undeployed');
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

export const deployTrustWork = async (providers: any, initialScore: bigint) => {
  const initialPrivateState: TrustWorkPrivateState = { score: initialScore };

  const deployed = await deployContract(providers, {
    compiledContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState,
  });

  console.log(`Contract deployed at: ${deployed.deployTxData.public.contractAddress}`);
  return deployed;
};

export const joinTrustWork = async (providers: any, contractAddress: string) => {
  return await findDeployedContract(providers, {
    contractAddress,
    compiledContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: { score: 0n },
  });
};

export const register = async (contract: any, score: bigint) => {
  const tx = await contract.callTx.register(score);
  console.log(`Registered score. TX: ${tx.public.txId} in block ${tx.public.blockHeight}`);
  return tx.public;
};

export const verifyAboveThreshold = async (contract: any, threshold: bigint) => {
  const tx = await contract.callTx.verify_above_threshold(threshold);
  console.log(`Verified. TX: ${tx.public.txId} in block ${tx.public.blockHeight}`);
  return tx.public;
};

export const getContractState = async (providers: any, contractAddress: string) => {
  const state = await providers.publicDataProvider.queryContractState(contractAddress);
  if (!state) return null;
  return TrustWork.ledger(state.data);
};
