import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

export const DEFAULT_GLOBAL_TEST_TYPES = [
  { code: 'smoke', name: 'Smoke Test', category: 'Stability', description: 'Basic build verification', icon: { pack: 'lucide', name: 'wind', src: 'local', url: '/icons/test-types/lucide/wind.svg', colorLight: '#2563eb', colorDark: '#60a5fa' }, status: 'ACTIVE' },
  { code: 'sanity', name: 'Sanity Test', category: 'Stability', description: 'Quick narrow checks after small changes', icon: { pack: 'lucide', name: 'smile', src: 'local', url: '/icons/test-types/lucide/smile.svg', colorLight: '#0ea5e9', colorDark: '#67e8f9' }, status: 'ACTIVE' },
  { code: 'regression', name: 'Regression Test', category: 'Coverage', description: 'Re-validate previously working functionality', icon: { pack: 'lucide', name: 'rotate-cw', src: 'local', url: '/icons/test-types/lucide/rotate-cw.svg', colorLight: '#f59e0b', colorDark: '#fbbf24' }, status: 'ACTIVE' },
  { code: 'integration', name: 'Integration Test', category: 'Coverage', description: 'Validate interfaces between modules/services', icon: { pack: 'lucide', name: 'git-merge', src: 'local', url: '/icons/test-types/lucide/git-merge.svg', colorLight: '#fb923c', colorDark: '#fdba74' }, status: 'ACTIVE' },
  { code: 'system', name: 'System Test', category: 'System', description: 'End-to-end at the system level (non-browser)', icon: { pack: 'lucide', name: 'monitor', src: 'local', url: '/icons/test-types/lucide/monitor.svg', colorLight: '#60a5fa', colorDark: '#93c5fd' }, status: 'ACTIVE' },
  { code: 'e2e', name: 'End-to-End Test', category: 'System', description: 'End-to-end user workflow validation', icon: { pack: 'lucide', name: 'globe', src: 'local', url: '/icons/test-types/lucide/globe.svg', colorLight: '#22c55e', colorDark: '#86efac' }, status: 'ACTIVE' },
  { code: 'exploratory', name: 'Exploratory Test', category: 'Technique', description: 'Unscripted, exploratory testing sessions', icon: { pack: 'lucide', name: 'search', src: 'local', url: '/icons/test-types/lucide/search.svg', colorLight: '#14b8a6', colorDark: '#5eead4' }, status: 'ACTIVE' },
  { code: 'performance', name: 'Performance Test', category: 'Non-Functional', description: 'Throughput, latency, and load', icon: { pack: 'lucide', name: 'activity', src: 'local', url: '/icons/test-types/lucide/activity.svg', colorLight: '#a78bfa', colorDark: '#c4b5fd' }, status: 'ACTIVE' },
  { code: 'security', name: 'Security Test', category: 'Non-Functional', description: 'Vulnerability and threat validation', icon: { pack: 'lucide', name: 'shield', src: 'local', url: '/icons/test-types/lucide/shield.svg', colorLight: '#ef4444', colorDark: '#f87171' }, status: 'ACTIVE' },
  { code: 'accessibility', name: 'Accessibility Test', category: 'Non-Functional', description: 'WCAG/assistive tech checks', icon: { pack: 'lucide', name: 'eye', src: 'local', url: '/icons/test-types/lucide/eye.svg', colorLight: '#22d3ee', colorDark: '#67e8f9' }, status: 'ACTIVE' },
  { code: 'api', name: 'API Test', category: 'Interface', description: 'HTTP/GraphQL/contract tests', icon: { pack: 'lucide', name: 'code', src: 'local', url: '/icons/test-types/lucide/code.svg', colorLight: '#f97316', colorDark: '#fdba74' }, status: 'ACTIVE' },
  { code: 'database', name: 'Database Test', category: 'Data', description: 'Schema, queries, and integrity', icon: { pack: 'lucide', name: 'database', src: 'local', url: '/icons/test-types/lucide/database.svg', colorLight: '#06b6d4', colorDark: '#22d3ee' }, status: 'ACTIVE' },
  { code: 'mobile', name: 'Mobile Test', category: 'Platform', description: 'iOS/Android app validation', icon: { pack: 'lucide', name: 'smartphone', src: 'local', url: '/icons/test-types/lucide/smartphone.svg', colorLight: '#eab308', colorDark: '#fde047' }, status: 'ACTIVE' },
  { code: 'cross-browser', name: 'Cross-Browser Test', category: 'Platform', description: 'Multi-browser/device coverage', icon: { pack: 'lucide', name: 'globe-2', src: 'local', url: '/icons/test-types/lucide/globe-2.svg', colorLight: '#10b981', colorDark: '#34d399' }, status: 'ACTIVE' },
  // Functional / Acceptance
  { code: 'uat', name: 'User Acceptance Test', category: 'Functional', description: 'Business/user acceptance validation', icon: { pack: 'lucide', name: 'user-check', src: 'local', url: '/icons/test-types/lucide/user-check.svg', colorLight: '#22c55e', colorDark: '#86efac' }, status: 'ACTIVE' },
  // Non-functional
  { code: 'load', name: 'Load Test', category: 'Non-Functional', description: 'Expected user load levels', icon: { pack: 'lucide', name: 'gauge', src: 'local', url: '/icons/test-types/lucide/gauge.svg', colorLight: '#06b6d4', colorDark: '#22d3ee' }, status: 'ACTIVE' },
  { code: 'stress', name: 'Stress Test', category: 'Non-Functional', description: 'Beyond capacity limits', icon: { pack: 'lucide', name: 'flame', src: 'local', url: '/icons/test-types/lucide/flame.svg', colorLight: '#ef4444', colorDark: '#f87171' }, status: 'ACTIVE' },
  { code: 'scalability', name: 'Scalability Test', category: 'Non-Functional', description: 'Capacity growth handling', icon: { pack: 'lucide', name: 'expand', src: 'local', url: '/icons/test-types/lucide/expand.svg', colorLight: '#a78bfa', colorDark: '#c4b5fd' }, status: 'ACTIVE' },
  { code: 'reliability', name: 'Reliability Test', category: 'Non-Functional', description: 'Stability over time', icon: { pack: 'lucide', name: 'repeat', src: 'local', url: '/icons/test-types/lucide/repeat.svg', colorLight: '#f59e0b', colorDark: '#fbbf24' }, status: 'ACTIVE' },
  { code: 'compatibility', name: 'Compatibility Test', category: 'Non-Functional', description: 'OS, browser, device', icon: { pack: 'lucide', name: 'monitor-smartphone', src: 'local', url: '/icons/test-types/lucide/monitor-smartphone.svg', colorLight: '#0ea5e9', colorDark: '#67e8f9' }, status: 'ACTIVE' },
  { code: 'l10n-i18n', name: 'Localization/Internationalization', category: 'Non-Functional', description: 'Language/region formatting', icon: { pack: 'lucide', name: 'languages', src: 'local', url: '/icons/test-types/lucide/languages.svg', colorLight: '#22d3ee', colorDark: '#67e8f9' }, status: 'ACTIVE' },
  { code: 'recovery', name: 'Recovery/Failover Test', category: 'Non-Functional', description: 'Disaster recovery validation', icon: { pack: 'lucide', name: 'life-buoy', src: 'local', url: '/icons/test-types/lucide/life-buoy.svg', colorLight: '#f97316', colorDark: '#fdba74' }, status: 'ACTIVE' },
  { code: 'install-uninstall', name: 'Install/Uninstall Test', category: 'Non-Functional', description: 'Deployment processes', icon: { pack: 'lucide', name: 'package', src: 'local', url: '/icons/test-types/lucide/package.svg', colorLight: '#60a5fa', colorDark: '#93c5fd' }, status: 'ACTIVE' },
  // Specialized / Domain
  { code: 'data-migration', name: 'Data Migration Test', category: 'Data', description: 'Legacy to new validation', icon: { pack: 'lucide', name: 'arrow-left-right', src: 'local', url: '/icons/test-types/lucide/arrow-left-right.svg', colorLight: '#8b5cf6', colorDark: '#a78bfa' }, status: 'ACTIVE' },
  { code: 'configuration', name: 'Configuration Test', category: 'System', description: 'Env and settings combos', icon: { pack: 'lucide', name: 'sliders', src: 'local', url: '/icons/test-types/lucide/sliders.svg', colorLight: '#22c55e', colorDark: '#86efac' }, status: 'ACTIVE' },
  { code: 'compliance', name: 'Compliance Test', category: 'Governance', description: 'Standards and compliance', icon: { pack: 'lucide', name: 'badge-check', src: 'local', url: '/icons/test-types/lucide/badge-check.svg', colorLight: '#22c55e', colorDark: '#86efac' }, status: 'ACTIVE' },
  { code: 'hardware-embedded', name: 'Hardware/Embedded Test', category: 'Platform', description: 'Devices, firmware, sensors', icon: { pack: 'lucide', name: 'cpu', src: 'local', url: '/icons/test-types/lucide/cpu.svg', colorLight: '#eab308', colorDark: '#fde047' }, status: 'ACTIVE' },
  // Automation / Pipeline
  { code: 'automated-functional', name: 'Automated Functional', category: 'Automation', description: 'Automated UI/API tests', icon: { pack: 'lucide', name: 'bot', src: 'local', url: '/icons/test-types/lucide/bot.svg', colorLight: '#38bdf8', colorDark: '#7dd3fc' }, status: 'ACTIVE' },
  { code: 'automated-regression', name: 'Automated Regression', category: 'Automation', description: 'Scheduled/triggered packs', icon: { pack: 'lucide', name: 'repeat-2', src: 'local', url: '/icons/test-types/lucide/repeat-2.svg', colorLight: '#14b8a6', colorDark: '#5eead4' }, status: 'ACTIVE' },
  { code: 'automated-api', name: 'Automated API', category: 'Automation', description: 'API contract suites', icon: { pack: 'lucide', name: 'code', src: 'local', url: '/icons/test-types/lucide/code.svg', colorLight: '#06b6d4', colorDark: '#22d3ee' }, status: 'ACTIVE' },
  { code: 'ci-cd', name: 'CI/CD Pipeline Tests', category: 'Automation', description: 'Build pipeline validation', icon: { pack: 'lucide', name: 'git-branch', src: 'local', url: '/icons/test-types/lucide/git-branch.svg', colorLight: '#f43f5e', colorDark: '#fb7185' }, status: 'ACTIVE' },
  // Maintenance & Exploratory
  { code: 'ad-hoc', name: 'Ad-hoc Test', category: 'Maintenance', description: 'Quick, undocumented checks', icon: { pack: 'lucide', name: 'wand-2', src: 'local', url: '/icons/test-types/lucide/wand-2.svg', colorLight: '#a3e635', colorDark: '#bef264' }, status: 'ACTIVE' },
  { code: 'retesting', name: 'Retesting/Confirmation', category: 'Maintenance', description: 'Verify defect fixes', icon: { pack: 'lucide', name: 'check-check', src: 'local', url: '/icons/test-types/lucide/check-check.svg', colorLight: '#22c55e', colorDark: '#86efac' }, status: 'ACTIVE' },
  { code: 'session-based', name: 'Session-Based Testing', category: 'Exploratory', description: 'Time-boxed charters', icon: { pack: 'lucide', name: 'timer', src: 'local', url: '/icons/test-types/lucide/timer.svg', colorLight: '#06b6d4', colorDark: '#22d3ee' }, status: 'ACTIVE' },
  { code: 'maintenance', name: 'Maintenance Testing', category: 'Maintenance', description: 'After env/config updates', icon: { pack: 'lucide', name: 'wrench', src: 'local', url: '/icons/test-types/lucide/wrench.svg', colorLight: '#f59e0b', colorDark: '#fbbf24' }, status: 'ACTIVE' },
  // User/Business-focused
  { code: 'beta', name: 'Beta Testing', category: 'Business', description: 'Pre-release user group', icon: { pack: 'lucide', name: 'beaker', src: 'local', url: '/icons/test-types/lucide/beaker.svg', colorLight: '#f472b6', colorDark: '#f9a8d4' }, status: 'ACTIVE' },
  { code: 'pilot', name: 'Pilot Testing', category: 'Business', description: 'Limited scope rollout', icon: { pack: 'lucide', name: 'rocket', src: 'local', url: '/icons/test-types/lucide/rocket.svg', colorLight: '#22c55e', colorDark: '#86efac' }, status: 'ACTIVE' },
  { code: 'ort', name: 'Operational Readiness Test', category: 'Business', description: 'Production readiness checks', icon: { pack: 'lucide', name: 'briefcase', src: 'local', url: '/icons/test-types/lucide/briefcase.svg', colorLight: '#60a5fa', colorDark: '#93c5fd' }, status: 'ACTIVE' },
  { code: 'bpt', name: 'Business Process Test', category: 'Business', description: 'End-to-end process alignment', icon: { pack: 'lucide', name: 'workflow', src: 'local', url: '/icons/test-types/lucide/workflow.svg', colorLight: '#10b981', colorDark: '#34d399' }, status: 'ACTIVE' },
];

export const testTypeService = {
  async listGlobalTestTypes({ status } = {}) {
    const col = collection(db, 'globalTestTypes');
    const snap = await getDocs(col);
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return status ? rows.filter((r) => r.status === status) : rows;
  },

  async createGlobalTestType(payload) {
    const fn = httpsCallable(functions, 'createGlobalTestType');
    const res = await fn(payload);
    return res?.data || { success: true };
  },

  async updateGlobalTestType(id, updates) {
    assert(id, 'id required');
    const fn = httpsCallable(functions, 'updateGlobalTestType');
    const res = await fn({ id, updates });
    return res?.data || { success: true };
  },

  async archiveGlobalTestType(id) {
    assert(id, 'id required');
    const fn = httpsCallable(functions, 'archiveGlobalTestType');
    const res = await fn({ id });
    return res?.data || { success: true };
  },

  async listOrgTestTypes(organizationId) {
    assert(organizationId, 'organizationId required');
    const col = collection(db, 'organizations', organizationId, 'testTypes');
    const snap = await getDocs(col);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async setOrgTestTypes({ organizationId, enabledIds = [], overrides = {} }) {
    assert(organizationId, 'organizationId required');
    const fn = httpsCallable(functions, 'setOrgTestTypes');
    const res = await fn({ orgId: organizationId, enabledIds, overrides });
    return res?.data || { success: true };
  },

  async getResolvedOrgTestTypes(organizationId) {
    assert(organizationId, 'organizationId required');
    const [globals, org] = await Promise.all([
      this.listGlobalTestTypes({ status: 'ACTIVE' }),
      this.listOrgTestTypes(organizationId),
    ]);
    const orgMap = new Map(org.map((o) => [o.id, o]));
    return globals.map((g) => {
      const sel = orgMap.get(g.id);
      const override = sel?.override || {};
      return {
        id: g.id,
        code: g.code,
        category: g.category || null,
        name: override.name || g.name,
        description: override.description || g.description,
        icon: override.icon || g.icon,
        enabled: Boolean(sel?.enabled),
        override: sel?.override || null,
      };
    });
  },

  async seedDefaultsIfEmpty() {
    const current = await this.listGlobalTestTypes();
    if (current.length > 0) return { skipped: true, count: current.length };
    try {
      const create = httpsCallable(functions, 'createGlobalTestType');
      for (const t of DEFAULT_GLOBAL_TEST_TYPES) {
        await create(t);
      }
      return { seeded: true, count: DEFAULT_GLOBAL_TEST_TYPES.length, via: 'callable' };
    } catch (_) {
      // Fallback: direct client writes (allowed if rules permit APP_ADMIN writes)
      let created = 0;
      for (const t of DEFAULT_GLOBAL_TEST_TYPES) {
        const ref = doc(db, 'globalTestTypes', String(t.code));
        await setDoc(ref, { ...t });
        created += 1;
      }
      return { seeded: true, count: created, via: 'client' };
    }
  },

  async seedMissingDefaults() {
    const current = await this.listGlobalTestTypes();
    const have = new Set((current || []).map((t) => t.code));
    try {
      const create = httpsCallable(functions, 'createGlobalTestType');
      let created = 0;
      for (const t of DEFAULT_GLOBAL_TEST_TYPES) {
        if (!have.has(t.code)) {
          await create(t);
          created += 1;
        }
      }
      return { created, via: 'callable' };
    } catch (_) {
      // Fallback to client-side writes
      let created = 0;
      for (const t of DEFAULT_GLOBAL_TEST_TYPES) {
        if (!have.has(t.code)) {
          const ref = doc(db, 'globalTestTypes', String(t.code));
          await setDoc(ref, { ...t });
          created += 1;
        }
      }
      return { created, via: 'client' };
    }
  },
};


