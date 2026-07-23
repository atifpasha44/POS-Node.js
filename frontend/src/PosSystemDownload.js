import React from 'react';

// In dev mode the web dashboard runs on CRA's dev server (port 3000), which intercepts
// normal browser navigations itself and never forwards them to the backend. Pointing this
// link straight at the backend's own origin avoids that entirely, in both dev and production.
const BACKEND_PORT = 3001;
const downloadUrl = `${window.location.protocol}//${window.location.hostname}:${BACKEND_PORT}/downloads/ithots-pos-terminal-setup.exe`;

export default function PosSystemDownload() {
  return (
    <div style={{
      background: '#fff', border: '2.5px solid #222', borderRadius: '16px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.10)', width: '100%', maxWidth: '700px',
      margin: '60px auto', padding: '36px', textAlign: 'center'
    }}>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px', color: '#222' }}>
        ithots touch POS
      </div>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Install the ithots touch POS terminal app on this or any till-point PC to start taking orders.
      </p>

      <a
        href={downloadUrl}
        download="ithots-pos-terminal-setup.exe"
        style={{
          display: 'inline-block', background: '#1976d2', color: '#fff', padding: '14px 32px',
          borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', textDecoration: 'none'
        }}
      >
        ⬇ Download ithots touch POS for Windows
      </a>

      <div style={{ marginTop: '24px', textAlign: 'left', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px', padding: '16px', fontSize: '0.9rem', color: '#7a5c00' }}>
        <strong>Note:</strong> since this installer isn't code-signed, Windows SmartScreen will show
        a warning when you run it. Click <em>"More info"</em> then <em>"Run anyway"</em> to continue.
        After installing, the app will ask once for your server's address (e.g. <code>192.168.1.50:3001</code>)
        so it knows which backend to connect to — this only needs to be entered once per terminal.
      </div>
    </div>
  );
}
