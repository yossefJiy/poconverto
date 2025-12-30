/**
 * Generate a simple device fingerprint based on browser characteristics
 * This is not meant to be cryptographically secure, just reasonably unique per device
 */
export function generateDeviceFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    navigator.platform || 'unknown',
  ];

  const fingerprint = components.join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Return as hex string with some additional entropy from localStorage
  const storedId = localStorage.getItem('device_id') || crypto.randomUUID();
  localStorage.setItem('device_id', storedId);
  
  return `${Math.abs(hash).toString(16)}-${storedId.slice(0, 8)}`;
}
