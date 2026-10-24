// src/lib/widev/wiip.js
// wiIp v10.3: Telemetría de dispositivo y navegador con fallback resiliente sin errores de CORS
export const wiIp = async (geo) => {
  if (typeof window === 'undefined') return null;

  const ua = navigator.userAgent;
  let data = {};

  const token = import.meta.env.VITE_WIIP || '';
  const url = token ? `https://ipinfo.io/json?token=${token}` : 'https://ipinfo.io/json';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const r = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (r.ok) {
      data = await r.json();
    }
  } catch (e) {
    // Fallback silencioso sin ensuciar la consola con excepciones rojas de CORS
  }

  const [lat, lng] = (data.loc || '0,0').split(',').map(Number);
  
  const ipData = {
    ip: data.ip || '127.0.0.1',
    city: data.city || 'Lima',
    region: data.region || 'Lima',
    country: data.country || 'PE',
    postal: data.postal || '',
    lat: isNaN(lat) ? 0 : lat,
    lng: isNaN(lng) ? 0 : lng,
    browser: /Edg/i.test(ua) ? 'Edge' : /Chrome/i.test(ua) ? 'Chrome' : /Firefox/i.test(ua) ? 'Firefox' : /Safari/i.test(ua) && !/Chrome/i.test(ua) ? 'Safari' : 'Otro',
    os: /Windows/i.test(ua) ? 'Windows' : /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iOS' : /Mac/i.test(ua) ? 'macOS' : 'Linux',
    device: /Mobile|Android|iPhone|iPad/i.test(ua) ? 'Móvil' : /Tablet|iPad/i.test(ua) ? 'Tablet' : 'Escritorio',
    screen: typeof screen !== 'undefined' ? `${screen.width}×${screen.height}` : '0×0',
    language: navigator.language || 'es',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    utcOffset: new Date().getTimezoneOffset() / -60,
    online: navigator.onLine
  };

  if (typeof geo === 'function') return geo(ipData);
  if (geo === 'ciudad') return `${ipData.city}, ${ipData.country}`;
  return geo ? ipData[geo] : ipData;
};