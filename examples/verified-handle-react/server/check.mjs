import { NeusClient } from '@neus/sdk';

const client = new NeusClient();

export async function checkCreatorEligibility(walletAddress) {
  const result = await client.gateCheck({
    gateId: 'gate_acme-creator',
    address: walletAddress,
  });

  return result.data?.eligible === true;
}

// Demo: run with `node server/check.mjs 0x...`
if (process.argv[2]) {
  const eligible = await checkCreatorEligibility(process.argv[2]);
  console.log(eligible ? 'Eligible' : 'Not eligible');
}
