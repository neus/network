'use client';

import { useState } from 'react';
import { NeusClient } from '@neus/sdk';
import { VerifyGate, ProofBadge } from '@neus/widgets';

const client = new NeusClient({ apiUrl: '/api/neus' });

export default function HomePage() {
  const [proofs, setProofs] = useState([]);
  const [status, setStatus] = useState('');

  const createContentProof = async () => {
    try {
      setStatus('Creating proof...');
      const proof = await client.verify({
        verifier: 'ownership-basic',
        content: `Blog post created at ${new Date().toISOString()}`
      });
      setProofs(prev => [...prev, proof]);
      setStatus('Content verified!');
    } catch (error) {
      setStatus('Error: ' + error.message);
    }
  };

  return (
    <div className="container">
      <h1>NEUS Next.js Example</h1>
      
      {/* Content creation verification */}
      <section className="section">
        <h2>Content Verification</h2>
        <p>Verify content ownership for blog posts, articles, or media.</p>
        <button onClick={createContentProof} className="button">
          Verify New Content
        </button>
        <p className="status">{status}</p>
      </section>

      {/* NFT holder exclusive area */}
      <section className="section">
        <h2>NFT Holder Area</h2>
        <VerifyGate 
          requiredVerifiers={['nft-ownership']}
          apiUrl="/api/neus"
          verifierData={{
            'nft-ownership': {
              contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
              tokenId: '1',
              chainId: 1
            }
          }}
          onVerified={() => alert('Welcome, NFT holder!')}
        >
          <div className="premium-content">
            <h3>🎉 Exclusive NFT Holder Content</h3>
            <p>Special offers, early access, and community features.</p>
          </div>
        </VerifyGate>
      </section>

      {/* Proof gallery */}
      <section className="section">
        <h2>Your Proofs</h2>
        {proofs.length === 0 ? (
          <p>No proofs created yet.</p>
        ) : (
          <div className="proof-grid">
            {proofs.map((proof, index) => (
              <div key={index} className="proof-card">
                <div>Proof #{index + 1}</div>
                <ProofBadge qHash={proof.qHash} proof={proof} />
                <code>{proof.qHash.slice(0, 16)}...</code>
              </div>
            ))}
          </div>
        )}
      </section>

      <style jsx global>{`
        .container { max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
        .section { margin: 40px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .button { background: #0070f3; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; }
        .button:hover { background: #0051cc; }
        .status { color: #666; font-style: italic; }
        .premium-content { background: #e8f5e8; padding: 20px; border-radius: 8px; }
        .proof-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
        .proof-card { padding: 16px; border: 1px solid #eee; border-radius: 8px; text-align: center; }
      `}</style>
    </div>
  );
}
