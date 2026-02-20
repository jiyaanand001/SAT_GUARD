// Store and retrieve uploaded detection images using localStorage
const STORAGE_KEY = 'satguard_detection_images';

function getStore(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveDetectionImage(detectionId: string, dataUrl: string) {
  const store = getStore();
  store[detectionId] = dataUrl;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage full — evict oldest entries
    const keys = Object.keys(store);
    if (keys.length > 20) {
      keys.slice(0, keys.length - 20).forEach(k => delete store[k]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }
  }
}

export function getDetectionImage(detectionId: string): string | null {
  return getStore()[detectionId] || null;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
