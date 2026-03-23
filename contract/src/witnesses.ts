import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';

export type TrustWorkPrivateState = {
  score: bigint;
  nonce: Uint8Array;
};

export const witnesses = {
  secret_score: ({ privateState }: WitnessContext<TrustWorkPrivateState>): bigint => {
    return privateState.score;
  },
  secret_nonce: ({ privateState }: WitnessContext<TrustWorkPrivateState>): Uint8Array => {
    return privateState.nonce;
  },
};
