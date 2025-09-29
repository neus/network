import React, { useState } from 'react';
import { NeusClient } from '@neus/sdk';
import { VerifyGate, ProofBadge } from '@neus/widgets';

const client = new NeusClient({ apiUrl: '/api/neus' });

function App() {
  const [proof, setProof] = useState(null);
  const [status, setStatus] = useState('');

  // Simple verification example
  const handleVerify = async () => {
    try {
      setStatus('Creating proof...');
      const result = await client.verify({
        verifier: 'ownership-basic',
        content: 'My React app verification'
      });
      setProof(result);
      setStatus('Proof created!');
    } catch (error) {
      console.error('Verification failed:', error);
      setStatus('Error: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>NEUS Network React Example</h1>
      
      {/* Basic verification button */}
      <section>
        <h2>1. Basic Verification</h2>
        <button onClick={handleVerify}>
          Create Proof
        </button>
        <p>Status: {status}</p>
        {proof && (
          <div>
            <p>Proof ID: {proof.qHash}</p>
            <ProofBadge qHash={proof.qHash} proof={proof} />
          </div>
        )}
      </section>

      {/* NFT-gated content example */}
      <section>
        <h2>2. NFT-Gated Content</h2>
        <VerifyGate 
          apiUrl={'/api/neus'}
          requiredVerifiers={['nft-ownership']}
          verifierData={{
            'nft-ownership': {
              contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', // BAYC
              tokenId: '1', 
              chainId: 1
            }
          }}
          onVerified={(result) => {
            console.log('NFT ownership verified:', result);
            alert('Access granted! You own this NFT.');
          }}
        >
          <div style={{ background: '#e8f5e8', padding: '20px', borderRadius: '8px' }}>
            <h3>🎉 Premium NFT Holder Content</h3>
            <p>This content is only visible to BAYC token holders.</p>
          </div>
        </VerifyGate>
      </section>

      {/* Token holder verification */}
      <section>
        <h2>3. Token Holder Verification</h2>
        <VerifyGate
          apiUrl={'/api/neus'}
          requiredVerifiers={['token-holding']}
          verifierData={{
            'token-holding': {
              contractAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI
              minBalance: '100.0',
              chainId: 1
            }
          }}
          onVerified={(result) => {
            console.log('Token balance verified:', result);
            alert('Governance access granted!');
          }}
        >
          <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '8px' }}>
            <h3>🗳️ DAO Governance Portal</h3>
            <p>Access for UNI holders with 100+ tokens.</p>
          </div>
        </VerifyGate>
      </section>
    </div>
  );
}

export default App;
