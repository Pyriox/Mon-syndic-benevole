// Génère l'apple-touch-icon (180×180) pour iOS/iPadOS.
// Servi automatiquement par Next.js à /apple-icon.png
// et injecté via <link rel="apple-touch-icon"> dans le <head>.
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '180px',
          height: '180px',
          borderRadius: '40px',
          background: 'linear-gradient(135deg, #3b5bdb 0%, #1e3a8a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Maison — silhouette simplifiée */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Toit */}
          <div
            style={{
              width: '0',
              height: '0',
              borderLeft: '44px solid transparent',
              borderRight: '44px solid transparent',
              borderBottom: '38px solid white',
              marginBottom: '-2px',
            }}
          />
          {/* Corps */}
          <div
            style={{
              width: '70px',
              height: '52px',
              background: 'white',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '0px',
            }}
          >
            {/* Porte */}
            <div
              style={{
                width: '22px',
                height: '30px',
                background: 'linear-gradient(135deg, #3b5bdb 0%, #1e3a8a 100%)',
                borderRadius: '3px 3px 0 0',
              }}
            />
          </div>
        </div>
      </div>
    ),
    { width: 180, height: 180 },
  );
}
