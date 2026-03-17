import {
  createMidnightClient,
  MidnightProviders,
  DeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import { WalletProvider } from "@midnight-ntwrk/midnight-js-types";
import * as crypto from "crypto";

export type TrustWorkPrivateState = {
  secretKey: Uint8Array;
  reputationScore: number;
  scoreNonce: Uint8Array;
};

export function createWorkerPrivateState(score: number): TrustWorkPrivateState {
  if (score < 0 || score > 100) {
    throw new Error("Reputation score must be between 0 and 100");
  }
  return {
    secretKey: crypto.getRandomValues(new Uint8Array(32)),
    reputationScore: score,
    scoreNonce: crypto.getRandomValues(new Uint8Array(32)),
  };
}

export function buildWitnessProvider(privateState: TrustWorkPrivateState) {
  return {
    secretKey: () => privateState.secretKey,
    reputationScore: () => BigInt(privateState.reputationScore),
    scoreNonce: () => privateState.scoreNonce,
  };
}

export const TrustWorkAPI = {
  async deploy(providers: any, wallet: any) {
    const midnight = createMidnightClient(providers);
    console.log("Deploying TrustWork contract...");
    const deployed = await midnight.deployContract({}, wallet);
    console.log(`Contract deployed at: ${deployed.deployTxData.public.contractAddress}`);
    return deployed;
  },

  async register(contract: any, privateState: TrustWorkPrivateState, providers: any) {
    const witnessProvider = buildWitnessProvider(privateState);
    const midnight = createMidnightClient(providers);
    console.log("Registering worker with private reputation score...");
    await midnight.callContract(
      contract,
      "register",
      [BigInt(privateState.reputationScore)],
      witnessProvider
    );
    console.log("Worker registered. Score committed on-chain. Actual score: private.");
  },

  async verifyAboveThreshold(
    contract: any,
    threshold: number,
    privateState: TrustWorkPrivateState,
    providers: any
  ): Promise<boolean> {
    const witnessProvider = buildWitnessProvider(privateState);
    const midnight = createMidnightClient(providers);
    console.log(`Generating ZK proof that score >= ${threshold}...`);
    try {
      const result = await midnight.callContract(
        contract,
        "verify_above_threshold",
        [BigInt(threshold)],
        witnessProvider
      );
      return Boolean(result);
    } catch {
      return false;
    }
  },

  async getWorkerCount(contract: any): Promise<bigint> {
    return await contract.callEntryPoint("get_worker_count", []);
  },

  async isRegistered(contract: any): Promise<boolean> {
    return Boolean(await contract.callEntryPoint("is_registered", []));
  },
};
