import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { randomBytes } from 'node:crypto';
import { buildFreshWallet, buildWallet, createProviders } from './providers.js';
import {
  deployTrustWork,
  joinTrustWork,
  register,
  verifyAboveThreshold,
  getContractState,
  DEVNET_CONFIG,
} from '../../api/src/index.js';

const rli = createInterface({ input, output, terminal: true });

const ask = (q: string) => rli.question(q);

const main = async () => {
  console.log('\n TrustWork Proof of Reputation - Midnight Network\n');
  console.log('1) Create new wallet');
  console.log('2) Restore wallet from seed');

  const walletChoice = await ask('\n> ');
  const walletCtx =
    walletChoice.trim() === '2'
      ? await buildWallet(DEVNET_CONFIG, await ask('Enter seed: '))
      : await buildFreshWallet(DEVNET_CONFIG);

  const providers = await createProviders(walletCtx, DEVNET_CONFIG);

  console.log('\n1) Deploy new contract');
  console.log('2) Join existing contract');

  const deployChoice = await ask('\n> ');

  let contract: any;
  const scoreInput = BigInt(await ask('Enter your reputation score (0-100): '));
  const nonce = randomBytes(32);

  if (deployChoice.trim() === '1') {
    contract = await deployTrustWork(providers, scoreInput, nonce);
  } else {
    const addr = await ask('Enter contract address: ');
    contract = await joinTrustWork(providers, addr, scoreInput, nonce);
  }

  while (true) {
    console.log('\n1) Register score on-chain');
    console.log('2) Verify score above threshold');
    console.log('3) Check contract state');
    console.log('4) Exit');

    const action = await ask('\n> ');

    if (action.trim() === '1') {
      await register(contract);
    } else if (action.trim() === '2') {
      const threshold = BigInt(await ask('Enter threshold: '));
      await verifyAboveThreshold(contract, threshold);
    } else if (action.trim() === '3') {
      const state = await getContractState(providers, contract.deployTxData.public.contractAddress);
      console.log('Contract state:', state);
    } else if (action.trim() === '4') {
      break;
    }
  }

  await walletCtx.wallet.stop();
  rli.close();
  console.log('\nGoodbye.');
};

main().catch(console.error);
