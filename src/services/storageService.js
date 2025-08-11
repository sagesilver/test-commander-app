import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app, { auth, functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

const bucket = (process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || '').startsWith('gs://')
  ? process.env.REACT_APP_FIREBASE_STORAGE_BUCKET
  : `gs://${process.env.REACT_APP_FIREBASE_STORAGE_BUCKET}`;
const storage = getStorage(app, bucket);

function slugify(name) {
  return (name || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 60);
}

function yyyymm() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return { y, m };
}

export const storageService = {
  async uploadEditorAsset(file) {
    // Diagnostic: surface basics in console for local triage
    try {
      // no-op to ensure auth context is evaluated
      // eslint-disable-next-line no-unused-expressions
      auth?.currentUser?.uid;
    } catch (_) {}
    const { y, m } = yyyymm();
    const ext = (file.name && file.name.split('.').pop()) || 'bin';
    const base = slugify(file.name?.replace(/\.[^.]+$/, ''));
    const uid = crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    const path = `editor/${y}/${m}/${uid}-${base}.${ext}`;
    // Primary path: call CF to upload (avoids browser CORS)
    try {
      const toBase64 = (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const base64 = await toBase64(file);
      const callable = httpsCallable(functions, 'uploadEditorAsset');
      const res = await callable({ base64, contentType: file.type || 'image/png', fileName: file.name || 'image' });
      return res?.data || null;
    } catch (cfErr) {
      console.warn('CF upload failed, attempting direct upload', cfErr);
      // Fallback: direct upload if CF unavailable
      const storageRef = ref(storage, path);
      const snap = await uploadBytes(storageRef, file, { contentType: file.type });
      const downloadURL = await getDownloadURL(storageRef);
      return { downloadURL, path, contentType: file.type, size: file.size };
    }
  },
};

export default storageService;


