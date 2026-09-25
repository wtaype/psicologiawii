// src/core/servicios/r2Storage.js
// Conector global nativo a Cloudflare R2 con firma AWS SigV4 pura (0 dependencias npm / Web Crypto API)

const ACCOUNT_ID = import.meta.env.PUBLIC_R2_ACCOUNT_ID;
const ACCESS_KEY_ID = import.meta.env.PUBLIC_R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = import.meta.env.PUBLIC_R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = import.meta.env.PUBLIC_R2_BUCKET_NAME || 'gaswii-media';
const PUBLIC_R2_URL = import.meta.env.PUBLIC_R2_URL || 'https://media.solgassurquillo.com';

// Utilidades criptográficas nativas usando crypto.subtle del navegador
async function hmacSha256(key, data) {
  const cryptoKey = typeof key === 'string'
    ? await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    : await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, typeof data === 'string' ? new TextEncoder().encode(data) : data);
  return new Uint8Array(signature);
}

async function sha256Hex(data) {
  const hash = await crypto.subtle.digest('SHA-256', typeof data === 'string' ? new TextEncoder().encode(data) : data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hex(buffer) {
  return Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sube cualquier archivo directamente a Cloudflare R2 mediante firma SigV4 nativa
 * Reutilizable para: Productos, Comprobantes de Clientes, Fotos de Perfil, Documentos
 * @param {File|Blob} file - Archivo seleccionado
 * @param {string} [slug] - Nombre base o prefijo sugerido (ej. "solgas-10kg" o "comprobante-123")
 * @returns {Promise<{ ok: boolean, url: string, key: string, size: number }>}
 */
export async function subirImagenR2(file, slug = '') {
  if (!file) throw new Error('No se ha proporcionado ningún archivo para subir');
  if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !ACCOUNT_ID) {
    throw new Error('Faltan credenciales de Cloudflare R2 en las variables de entorno (.env)');
  }

  // 1. Sanitizar nombre y extensión
  const ext = file.name ? file.name.split('.').pop().toLowerCase() : 'webp';
  const baseLimpia = slug
    ? slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-')
    : 'media';
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const fileName = `${baseLimpia}-${Date.now().toString().slice(-4)}-${randomSuffix}.${ext}`;
  const contentType = file.type || 'image/webp';

  const fileBuffer = await file.arrayBuffer();
  const payloadHash = await sha256Hex(fileBuffer);

  // 2. Fecha y timestamp ISO para SigV4
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  // 3. Endpoint canónico de Cloudflare R2
  const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${BUCKET_NAME}/${fileName}`;

  // 4. Cabeceras canónicas ordenadas alfabéticamente
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalHeaders = 
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;

  // 5. Canonical Request
  const canonicalRequest = [
    'PUT',
    canonicalUri,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');

  const canonicalRequestHash = await sha256Hex(canonicalRequest);

  // 6. String to Sign
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    canonicalRequestHash
  ].join('\n');

  // 7. Derivación de Clave de Firma SigV4
  const kDate = await hmacSha256(`AWS4${SECRET_ACCESS_KEY}`, dateStamp);
  const kRegion = await hmacSha256(kDate, 'auto');
  const kService = await hmacSha256(kRegion, 's3');
  const kSigning = await hmacSha256(kService, 'aws4_request');
  const signatureBytes = await hmacSha256(kSigning, stringToSign);
  const signature = hex(signatureBytes);

  // 8. Cabecera Authorization
  const authHeader = `${algorithm} Credential=${ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  // 9. Petición PUT directa al endpoint R2
  const uploadUrl = `https://${host}${canonicalUri}`;
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      'Authorization': authHeader
    },
    body: fileBuffer
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error('Error Cloudflare R2 Upload:', res.status, errBody);
    throw new Error(`Cloudflare R2 respondió con error (${res.status}): ${errBody || res.statusText}`);
  }

  // 10. URL pública oficial servida por la CDN de Cloudflare
  const publicUrl = `${PUBLIC_R2_URL.replace(/\/$/, '')}/${fileName}`;
  return {
    ok: true,
    url: publicUrl,
    key: fileName,
    size: file.size
  };
}
