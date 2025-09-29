import express from 'express';
import { NeusClient } from '@neus/sdk';

const app = express();
const client = new NeusClient();

app.use(express.json());

// Simple forwarder for browser apps (same-origin proxy)
// Frontend base: http://localhost:3001/api/neus
const NEUS_API_BASE = 'https://api.neus.network';

app.all('/api/neus/*', async (req, res) => {
  try {
    const basePath = '/api/neus/';
    const idx = req.originalUrl.indexOf(basePath);
    const suffix = idx >= 0 ? req.originalUrl.slice(idx + basePath.length) : '';
    const targetUrl = `${NEUS_API_BASE}/${suffix}`;

    const headers = new Headers();
    headers.set('content-type', 'application/json');
    const auth = req.headers['authorization'];
    if (auth) headers.set('authorization', auth);

    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body || {});

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.set('content-type', upstream.headers.get('content-type') || 'application/json');
    res.send(text);
  } catch (err) {
    res.status(502).json({ success: false, error: 'Upstream error', detail: String(err && err.message || err) });
  }
});

// Verify content ownership before publishing
app.post('/api/publish', async (req, res) => {
  try {
    const { content, author, title } = req.body;
    
    // Verify content ownership with NEUS
    const proof = await client.verify({
      verifier: 'ownership-basic',
      content: content
    });
    
    // Simulate saving to database
    const article = {
      id: Date.now(),
      title,
      content,
      author,
      proofId: proof.qHash,
      verified: true,
      createdAt: new Date().toISOString()
    };
    
    console.log('Article published with verification:', article.id);
    
    res.json({
      success: true,
      article,
      verification: {
        qHash: proof.qHash,
        status: proof.status
      }
    });
    
  } catch (error) {
    console.error('Publication failed:', error.message);
    res.status(400).json({
      success: false,
      error: 'Content verification failed: ' + error.message
    });
  }
});

// Verify NFT ownership before marketplace listing
app.post('/api/list-nft', async (req, res) => {
  try {
    const { contractAddress, tokenId, sellerWallet, chainId } = req.body;
    
    // Verify NFT ownership
    const proof = await client.verify({
      verifier: 'nft-ownership',
      data: {
        ownerAddress: sellerWallet,
        contractAddress,
        tokenId,
        chainId
      }
    });
    
    // Simulate marketplace listing
    const listing = {
      id: Date.now(),
      contractAddress,
      tokenId,
      seller: sellerWallet,
      proofId: proof.qHash,
      verified: true,
      listedAt: new Date().toISOString()
    };
    
    console.log('NFT listed with ownership verification:', listing.id);
    
    res.json({
      success: true,
      listing,
      verification: {
        qHash: proof.qHash,
        status: proof.status
      }
    });
    
  } catch (error) {
    console.error('Listing failed:', error.message);
    res.status(400).json({
      success: false,
      error: 'NFT ownership verification failed: ' + error.message
    });
  }
});

// Check voting eligibility for DAO
app.post('/api/check-voting', async (req, res) => {
  try {
    const { walletAddress, proposalId, tokenContract } = req.body;
    
    // Verify token holdings for voting eligibility
    const proof = await client.verify({
      verifier: 'token-holding',
      data: {
        ownerAddress: walletAddress,
        contractAddress: tokenContract,
        minBalance: '1000.0', // Minimum tokens required to vote
        chainId: 1
      }
    });
    
    // Grant voting access
    const vote = {
      proposalId,
      voterAddress: walletAddress,
      eligibilityProofId: proof.qHash,
      canVote: true,
      verifiedAt: new Date().toISOString()
    };
    
    console.log('Voting eligibility verified:', walletAddress.slice(0, 8));
    
    res.json({
      success: true,
      vote,
      verification: {
        qHash: proof.qHash,
        status: proof.status
      }
    });
    
  } catch (error) {
    console.error('Voting check failed:', error.message);
    res.status(400).json({
      success: false,
      error: 'Voting eligibility verification failed: ' + error.message
    });
  }
});

// Get proof status
app.get('/api/proof/:qHash', async (req, res) => {
  try {
    const { qHash } = req.params;
    const status = await client.getStatus(qHash);
    
    res.json({
      success: true,
      proof: status
    });
    
  } catch (error) {
    res.status(404).json({
      success: false,
      error: 'Proof not found'
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`NEUS Backend Example running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  POST /api/publish - Verify content before publishing');
  console.log('  POST /api/list-nft - Verify NFT ownership before listing');
  console.log('  POST /api/check-voting - Verify token holdings for DAO voting');
  console.log('  GET /api/proof/:qHash - Check proof status');
});

export default app;
