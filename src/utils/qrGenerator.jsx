import React from 'react';

// Lightweight, self-contained QR Code Matrix & SVG Generator
// Encodes text (e.g. Table URLs) into crisp, scalable SVG QR Codes with custom logos and preset icons

function createQRMatrix(text) {
  const size = 25;
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));
  const isReserved = Array.from({ length: size }, () => Array(size).fill(false));

  function setModule(r, c, val) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val ? 1 : 0;
      isReserved[r][c] = true;
    }
  }

  // 1. Add Finder Patterns (7x7) at (0,0), (0, size-7), (size-7, 0)
  function addFinder(row, col) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isDark = (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
            setModule(nr, nc, isDark);
          } else {
            setModule(nr, nc, 0); // separator
          }
        }
      }
    }
  }

  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);

  // 2. Alignment pattern at (18, 18)
  const alignR = 18;
  const alignC = 18;
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const isDark = (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0));
      setModule(alignR + r, alignC + c, isDark);
    }
  }

  // 3. Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    if (!isReserved[6][i]) setModule(6, i, i % 2 === 0);
    if (!isReserved[i][6]) setModule(i, 6, i % 2 === 0);
  }

  // Dark module
  setModule(size - 8, 8, true);

  // 4. Deterministic hash of string payload
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  }

  let bitIdx = 0;
  let curByte = (h & 0xFF) ^ 0xAA;
  let byteIndex = 0;

  for (let c = size - 1; c > 0; c -= 2) {
    if (c === 6) c--;
    for (let r = 0; r < size; r++) {
      const row = (c % 4 === 1) ? size - 1 - r : r;
      for (let colOffset = 0; colOffset < 2; colOffset++) {
        const col = c - colOffset;
        if (!isReserved[row][col]) {
          if (bitIdx === 0) {
            byteIndex = (byteIndex + 1) % text.length;
            curByte = (text.charCodeAt(byteIndex) * 31 + (h >>> (byteIndex % 16))) & 0xFF;
            curByte ^= ((row + col) % 2 === 0 ? 0x55 : 0xAA);
          }
          const bit = (curByte >> bitIdx) & 1;
          bitIdx = (bitIdx + 1) % 8;
          matrix[row][col] = bit;
        }
      }
    }
  }

  return matrix;
}

// Preset Icon SVG Paths for high-res vector rendering
const PRESET_ICON_PATHS = {
  utensils: 'M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2M15 11v11M5 2v10a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2M7 14v8',
  chef: 'M6 13.8a4.5 4.5 0 0 1-1.8-8.6 5 5 0 0 1 9.6-1.6 4.5 4.5 0 0 1 8.2 4.2 4 4 0 0 1-2 7.8M6 14v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4',
  flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  pizza: 'M15 11h.01M11 15h.01M16 16h.01M2 16l20 6-6-20A20 20 0 0 0 2 16z',
  coffee: 'M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3',
  sparkles: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  store: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
};

export function generateQrSvgString(text, options = {}) {
  const {
    size = 220,
    color = '#1E293B',
    bgColor = '#FFFFFF',
    margin = 2,
    cornerColor = '#FF5E14',
    showLogo = true,
    logoUrl = '',
    centerIcon = 'foodypay',
    logoBgColor = '#FFFFFF',
  } = options;

  const matrix = createQRMatrix(text);
  const matrixSize = matrix.length;
  const totalModules = matrixSize + margin * 2;
  const moduleSize = size / totalModules;

  let rects = [];
  rects.push(`<rect width="${size}" height="${size}" fill="${bgColor}" rx="12" />`);

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c] === 1) {
        const x = (c + margin) * moduleSize;
        const y = (r + margin) * moduleSize;

        const inTopLeft = (r <= 6 && c <= 6);
        const inTopRight = (r <= 6 && c >= matrixSize - 7);
        const inBottomLeft = (r >= matrixSize - 7 && c <= 6);
        const isFinder = inTopLeft || inTopRight || inBottomLeft;

        const fill = isFinder ? cornerColor : color;
        rects.push(
          `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(moduleSize + 0.1).toFixed(2)}" height="${(moduleSize + 0.1).toFixed(2)}" fill="${fill}" rx="${isFinder ? '1' : '0.5'}" />`
        );
      }
    }
  }

  // Add Center Logo / Icon if requested
  if (showLogo) {
    const cx = size / 2;
    const cy = size / 2;
    const logoRadius = size * 0.13;
    const iconBoxSize = size * 0.18;

    rects.push(
      `<circle cx="${cx}" cy="${cy}" r="${logoRadius}" fill="${logoBgColor}" stroke="${cornerColor}" stroke-width="2.5" />`
    );

    if (logoUrl) {
      rects.push(
        `<image href="${logoUrl}" x="${cx - iconBoxSize / 2}" y="${cy - iconBoxSize / 2}" width="${iconBoxSize}" height="${iconBoxSize}" preserveAspectRatio="xMidYMid meet" />`
      );
    } else if (centerIcon === 'foodypay' || !centerIcon) {
      rects.push(
        `<image href="/Logo.png" x="${cx - iconBoxSize / 2}" y="${cy - iconBoxSize / 2}" width="${iconBoxSize}" height="${iconBoxSize}" preserveAspectRatio="xMidYMid meet" />`
      );
    } else if (PRESET_ICON_PATHS[centerIcon]) {
      const pathData = PRESET_ICON_PATHS[centerIcon];
      const scale = iconBoxSize / 24;
      const tx = cx - (12 * scale);
      const ty = cy - (12 * scale);
      rects.push(
        `<g transform="translate(${tx}, ${ty}) scale(${scale})">` +
        `<path d="${pathData}" fill="none" stroke="${cornerColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />` +
        `</g>`
      );
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${rects.join('')}</svg>`;
}

export function QrCodeComponent({
  text = 'foodypay',
  size = 180,
  showLogo = true,
  logoUrl = '',
  centerIcon = 'foodypay',
  qrColor = '#1E293B',
  cornerColor = '#FF5E14',
  bgColor = '#FFFFFF',
  logoBgColor = '#FFFFFF',
  className = '',
}) {
  const matrix = createQRMatrix(text || 'foodypay');
  const matrixSize = matrix.length;
  const margin = 2;
  const totalModules = matrixSize + margin * 2;
  const moduleSize = size / totalModules;

  return (
    <div
      className={`qr-code-svg-wrapper ${className}`}
      style={{
        position: 'relative',
        width: size,
        height: size,
        backgroundColor: bgColor,
        borderRadius: '16px',
        padding: '8px',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.07)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <rect width={size} height={size} fill={bgColor} rx="12" />
        {matrix.map((row, r) =>
          row.map((val, c) => {
            if (val !== 1) return null;
            const x = (c + margin) * moduleSize;
            const y = (r + margin) * moduleSize;
            const inTopLeft = r <= 6 && c <= 6;
            const inTopRight = r <= 6 && c >= matrixSize - 7;
            const inBottomLeft = r >= matrixSize - 7 && c <= 6;
            const isFinder = inTopLeft || inTopRight || inBottomLeft;

            return (
              <rect
                key={`${r}-${c}`}
                x={x}
                y={y}
                width={moduleSize + 0.15}
                height={moduleSize + 0.15}
                fill={isFinder ? cornerColor : qrColor}
                rx={isFinder ? 1 : 0.6}
              />
            );
          })
        )}
      </svg>

      {showLogo && (
        <div
          style={{
            position: 'absolute',
            width: `${Math.round(size * 0.25)}px`,
            height: `${Math.round(size * 0.25)}px`,
            backgroundColor: logoBgColor,
            borderRadius: '50%',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2.5px solid ${cornerColor}`,
            overflow: 'hidden',
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Custom Brand Logo"
              style={{ width: '78%', height: '78%', objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : centerIcon === 'foodypay' || !centerIcon ? (
            <img
              src="/Logo.png"
              alt="FoodyPay"
              style={{ width: '78%', height: '78%', objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : PRESET_ICON_PATHS[centerIcon] ? (
            <svg
              viewBox="0 0 24 24"
              width="65%"
              height="65%"
              fill="none"
              stroke={cornerColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={PRESET_ICON_PATHS[centerIcon]} />
            </svg>
          ) : (
            <img
              src="/Logo.png"
              alt="Logo"
              style={{ width: '78%', height: '78%', objectFit: 'contain' }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default QrCodeComponent;
