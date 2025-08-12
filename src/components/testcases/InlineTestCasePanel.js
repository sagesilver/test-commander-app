import React, { useEffect, useState } from 'react';
import ColoredIcon from './ColoredIcon';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { testCaseService } from '../../services/testCaseService';
import TestCaseForm from './TestCaseForm';

export default function InlineTestCasePanel({ testCase, mode = 'view', onModeChange, onSave, projectMembers = [] }) {
  const [local, setLocal] = useState(null);
  const { currentUserData, currentOrganization } = useAuth();

  useEffect(() => {
    setLocal(testCase ? { ...testCase } : null);
  }, [testCase]);

  if (!testCase || !local) {
    return <div className="text-menu">Select a test case to view details.</div>;
  }

  const isView = mode !== 'edit';
  const canDelete = Array.isArray(currentUserData?.roles) && (
    currentUserData.roles.includes('APP_ADMIN') || currentUserData.roles.includes('ORG_ADMIN')
  );

  // Larger run-history preview (same logic as list view, scaled) using simple seed
  const mockRunHistory = (seed) => {
    const seedStr = String(seed || 'tc');
    let h = 1779033703 ^ seedStr.length;
    for (let i = 0; i < seedStr.length; i += 1) {
      // eslint-disable-next-line no-bitwise
      h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
      // eslint-disable-next-line no-bitwise
      h = (h << 13) | (h >>> 19);
    }
    // eslint-disable-next-line no-bitwise
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    // eslint-disable-next-line no-bitwise
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    // eslint-disable-next-line no-bitwise
    h ^= h >>> 16;
    let t = h >>> 0;
    const rand = () => {
      // eslint-disable-next-line no-bitwise
      t += 0x6D2B79F5;
      let r = t;
      // eslint-disable-next-line no-bitwise
      r = Math.imul(r ^ (r >>> 15), r | 1);
      // eslint-disable-next-line no-bitwise
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
      // eslint-disable-next-line no-bitwise
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
    const out = [];
    for (let i = 0; i < 20; i += 1) {
      const r = rand();
      if (r < 0.62) out.push('pass');
      else if (r < 0.82) out.push('none');
      else out.push('fail');
    }
    return out;
  };

  const RunHistoryLarge = ({ history = [] }) => {
    const items = history.slice(-20);
    const barH = 18;
    const topGreen = `calc(50% - ${barH * 0.75}px)`;
    const topRed = `calc(50% - ${barH * 0.25}px)`;
    return (
      <div className="relative h-8 flex items-center gap-1 select-none" aria-label="Run history (latest at right)">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-white/40" />
        {items.map((s, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={i} className="relative w-1.5 h-8">
            {s === 'pass' && (
              <span className="absolute left-1/2 -translate-x-1/2 w-1.5 rounded bg-emerald-500" style={{ top: topGreen, height: `${barH}px` }} />
            )}
            {s === 'fail' && (
              <span className="absolute left-1/2 -translate-x-1/2 w-1.5 rounded bg-red-500" style={{ top: topRed, height: `${barH}px` }} />
            )}
            {s === 'none' && (
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/60" />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pr-10">
        <h3 className="text-lg font-semibold text-foreground">{local?.tcid}: {local?.name}</h3>
        <div className="flex items-center gap-3">
          <RunHistoryLarge history={mockRunHistory(local?.id || local?.tcid)} />
          <div className="bg-surface-muted border border-subtle rounded-lg p-1 mr-8">
            <button className={`px-3 py-1 rounded-md text-sm ${isView ? 'bg-white/10 text-white' : 'text-menu hover:text-white'}`} onClick={() => onModeChange?.('view')}>View</button>
            <button className={`px-3 py-1 rounded-md text-sm ${!isView ? 'bg-white/10 text-white' : 'text-menu hover:text-white'}`} onClick={() => onModeChange?.('edit')}>Edit</button>
          </div>
          {canDelete && (
            <button
              className="p-2 rounded-md text-red-400 hover:text-red-300 hover:bg-white/10"
              title="Delete Test Case"
              onClick={async () => {
                if (!window.confirm('Delete this test case?')) return;
                if (!testCase?.projectId) return;
                await testCaseService.deleteTestCase(currentOrganization.id, testCase.projectId, testCase.id);
                onModeChange?.('view');
              }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {!isView && (
            <button className="btn-primary text-sm" onClick={() => onSave?.(local)}>Save</button>
          )}
        </div>
      </div>

      <TestCaseForm
        organizationId={currentOrganization?.id}
        mode={isView ? 'view' : 'edit'}
        form={local}
        onChange={(updates) => setLocal({ ...local, ...updates })}
        onAddStep={() => setLocal({ ...local, testSteps: [...(local.testSteps || []), { stepNumber: (local.testSteps?.length || 0) + 1, description: '', testData: '', expectedResult: '', stepStatus: 'Not Run', notes: '' }] })}
        onRemoveStep={(index) => setLocal({ ...local, testSteps: (local.testSteps || []).filter((_, i) => i !== index).map((s, i2) => ({ ...s, stepNumber: i2 + 1 })) })}
        onUpdateStep={(index, field, value) => {
          const arr = [...(local.testSteps || [])];
          arr[index] = { ...arr[index], [field]: value };
          setLocal({ ...local, testSteps: arr });
        }}
        onSubmit={(e) => { e.preventDefault(); onSave?.(local); }}
        onCancel={null}
        submitLabel={isView ? '' : 'Save Changes'}
        showActions={!isView}
        projectMembers={projectMembers}
      />
    </div>
  );
}


