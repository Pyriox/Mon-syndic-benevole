import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Mon Syndic Bénévole — Logiciel de gestion de copropriété';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #0d2547 60%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        {/* Logo / badge */}
        <div
          style={{
            background: '#2563eb',
            borderRadius: '16px',
            padding: '12px 28px',
            marginBottom: '36px',
            fontSize: '18px',
            fontWeight: '700',
            color: '#ffffff',
            letterSpacing: '-0.3px',
          }}
        >
          MON SYNDIC BÉNÉVOLE
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: '800',
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.1,
            letterSpacing: '-2px',
            marginBottom: '24px',
            maxWidth: '900px',
          }}
        >
          La gestion de copropriété simple &amp; abordable
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: '26px',
            color: '#93c5fd',
            textAlign: 'center',
            marginBottom: '44px',
            maxWidth: '700px',
            lineHeight: 1.4,
          }}
        >
          Charges · Appels de fonds · Assemblées générales · Documents
        </div>

        {/* CTA badge */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
          }}
        >
          <div
            style={{
              background: '#1e3a5f',
              border: '1px solid #2563eb',
              borderRadius: '12px',
              padding: '14px 32px',
              fontSize: '20px',
              color: '#93c5fd',
              fontWeight: '600',
            }}
          >
            ✓ 30 jours gratuits
          </div>
          <div
            style={{
              background: '#1e3a5f',
              border: '1px solid #2563eb',
              borderRadius: '12px',
              padding: '14px 32px',
              fontSize: '20px',
              color: '#93c5fd',
              fontWeight: '600',
            }}
          >
            ✓ À partir de 300 €/an
          </div>
          <div
            style={{
              background: '#1e3a5f',
              border: '1px solid #2563eb',
              borderRadius: '12px',
              padding: '14px 32px',
              fontSize: '20px',
              color: '#93c5fd',
              fontWeight: '600',
            }}
          >
            ✓ Sans engagement
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
