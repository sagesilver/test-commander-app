import { collection, doc, getDocs, setDoc, updateDoc, getDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from './firebase';

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

export const tagService = {
  async listOrgTags(organizationId, { includeDeleted = false } = {}) {
    assert(organizationId, 'organizationId required');
    const colRef = collection(db, 'organizations', organizationId, 'tags');
    const qRef = includeDeleted ? colRef : query(colRef, where('isDeleted', '==', false));
    const snap = await getDocs(qRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async upsertOrgTag(organizationId, tag, { userId = null } = {}) {
    assert(organizationId, 'organizationId required');
    assert(tag && typeof tag === 'object', 'tag required');
    const baseId = tag.id || (tag.name || '').toLowerCase().replace(/\s+/g, '-');
    const id = String(baseId).toLowerCase();
    assert(id, 'tag id required');
    const ref = doc(db, 'organizations', organizationId, 'tags', id);
    const now = serverTimestamp();

    const prev = await getDoc(ref);
    if (prev.exists()) {
      await updateDoc(ref, {
        name: tag.name || id,
        color: tag.color || '#64748b',
        isDeleted: false,
        lastUpdatedAt: now,
        lastUpdatedBy: userId || null,
      });
    } else {
      await setDoc(ref, {
        id,
        name: tag.name || id,
        color: tag.color || '#64748b',
        isDeleted: false,
        createdAt: now,
        createdBy: userId || null,
        lastUpdatedAt: now,
        lastUpdatedBy: userId || null,
      });
    }
    const fresh = await getDoc(ref);
    return { id, ...(fresh.data() || { name: tag.name || id, color: tag.color || '#64748b', isDeleted: false }) };
  },

  async softDeleteOrgTag(organizationId, tagId, { userId = null } = {}) {
    assert(organizationId && tagId, 'organizationId and tagId required');
    const ref = doc(db, 'organizations', organizationId, 'tags', String(tagId).toLowerCase());
    await updateDoc(ref, {
      isDeleted: true,
      lastUpdatedAt: serverTimestamp(),
      lastUpdatedBy: userId || null,
    });
    const fresh = await getDoc(ref);
    return { id: tagId, ...(fresh.data() || {}) };
  },
};
