import GatedContent from './GatedContent.jsx';

export default function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>NEUS · VerifyGate</h1>
      <GatedContent />
    </main>
  );
}
