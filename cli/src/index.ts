#!/usr/bin/env node

/**
 * TrustWork CLI
 *
 * Usage:
 *   trustwork deploy              - Deploy a new contract instance
 *   trustwork register            - Register as a worker with a private score
 *   trustwork verify <threshold>  - Verify score meets a threshold
 *   trustwork status              - Check contract state
 */

import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import { TrustWorkAPI, createWorkerPrivateState, TrustWorkPrivateState } from "@trustwork/api";

const STATE_FILE = path.join(process.env.HOME || ".", ".trustwork-state.json");

function loadState(): { privateState: TrustWorkPrivateState; contractAddress: string } | null {
  try {
    if (!fs.existsSync(STATE_FILE)) return null;
    const raw = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    return {
      privateState: {
        secretKey: new Uint8Array(raw.secretKey),
        reputationScore: raw.reputationScore,
        scoreNonce: new Uint8Array(raw.scoreNonce),
      },
      contractAddress: raw.contractAddress,
    };
  } catch {
    return null;
  }
}

function saveState(privateState: TrustWorkPrivateState, contractAddress: string) {
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify({
      secretKey: Array.from(privateState.secretKey),
      reputationScore: privateState.reputationScore,
      scoreNonce: Array.from(privateState.scoreNonce),
      contractAddress,
    }),
    "utf-8"
  );
  console.log(`\nPrivate state saved to ${STATE_FILE}`);
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); });
  });
}

async function main() {
  const [, , command, ...args] = process.argv;
  console.log("\nTrustWork Proof of Reputation - Midnight Network");
  console.log("=================================================");

  switch (command) {
    case "deploy": {
      const { buildMidnightProviders } = await import("./providers");
      const providers = await buildMidnightProviders();
      const deployed = await TrustWorkAPI.deploy(providers, providers.walletProvider);
      console.log(`\nContract Address: ${deployed.deployTxData.public.contractAddress}`);
      break;
    }
    case "register": {
      const scoreInput = await prompt("Enter your reputation score (0-100): ");
      const score = parseInt(scoreInput, 10);
      if (isNaN(score) || score < 0 || score > 100) {
        console.error("Invalid score."); process.exit(1);
      }
      const contractAddress = await prompt("Enter the contract address: ");
      const privateState = createWorkerPrivateState(score);
      const { buildMidnightProviders } = await import("./providers");
      const providers = await buildMidnightProviders();
      const contract = await (providers as any).midnight.findDeployedContract(contractAddress);
      await TrustWorkAPI.register(contract, privateState, providers);
      saveState(privateState, contractAddress);
      console.log(`\nRegistered. Your score (${score}) is private.`);
      break;
    }
    case "verify": {
      const saved = loadState();
      if (!saved) { console.error("Run register first."); process.exit(1); }
      const thresholdInput = args[0] || await prompt("Enter threshold (0-100): ");
      const threshold = parseInt(thresholdInput, 10);
      const { buildMidnightProviders } = await import("./providers");
      const providers = await buildMidnightProviders();
      const contract = await (providers as any).midnight.findDeployedContract(saved.contractAddress);
      const passed = await TrustWorkAPI.verifyAboveThreshold(
        contract, threshold, saved.privateState, providers
      );
      console.log(passed
        ? `\nVERIFIED: Score is at or above ${threshold}.`
        : `\nNOT VERIFIED: Score does not meet threshold of ${threshold}.`
      );
      break;
    }
    case "status": {
      const saved = loadState();
      const address = saved?.contractAddress || await prompt("Enter contract address: ");
      const { buildMidnightProviders } = await import("./providers");
      const providers = await buildMidnightProviders();
      const contract = await (providers as any).midnight.findDeployedContract(address);
      const registered = await TrustWorkAPI.isRegistered(contract);
      const count = await TrustWorkAPI.getWorkerCount(contract);
      console.log(`\nRegistered: ${registered}`);
      console.log(`Total workers: ${count}`);
      break;
    }
    default:
      console.log("\nCommands: deploy | register | verify [threshold] | status");
  }
}

main().catch((err) => { console.error("\nError:", err.message || err); process.exit(1); });
