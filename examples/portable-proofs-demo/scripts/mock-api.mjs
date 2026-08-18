import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { createNeusMockCore } from './neus-mock-core.mjs';

const PORT = Number(process.env.NEUS_MOCK_API_PORT) || 8787;

const core = createNeusMockCore({
  newProofId: () => `0x${randomBytes(32).toString('hex')}`
});

function setCors(res, req) {
  const requestOrigin = req.headers.origin;
  res.setHeader(
    'Access-Control-Allow-Origin',
    requestOrigin && requestOrigin !== 'null' ? requestOrigin : '*'
  );
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Accept, Authorization, X-Neus-Sdk, X-Neus-App, X-Client-Origin, ' +
    'X-Wallet-Address, X-Signature, X-Signed-Timestamp, X-Chain, X-Signature-Method, PAYMENT-SIGNATURE'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

const server = http.createServer((req, res) => {
  setCors(res, req);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '', `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/api/v1/verification') {
    let body = '';
    req.on('data', (c) => {
      body += c;
    });
    req.on('end', () => {
      const out = core.handle('POST', url.pathname, url.search, body);
      if (!out) {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: { message: 'Not found' } }));
        return;
      }
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(out.status);
      res.end(JSON.stringify(out.json));
    });
    return;
  }

  const out = core.handle(req.method || 'GET', url.pathname, url.search, '');
  if (out) {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(out.status);
    res.end(JSON.stringify(out.json));
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.writeHead(404);
  res.end(JSON.stringify({ success: false, error: { message: 'Not found' } }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[neus mock api] http://127.0.0.1:${PORT}`);
});
