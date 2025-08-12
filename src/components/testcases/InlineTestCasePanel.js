import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { testCaseService } from '../../services/testCaseService';
import TestCaseForm from './TestCaseForm';

export default function InlineTestCasePanel({ testCase, mode = 'view', onModeChange, onSave, projectMembers = [], availableTags = [] }) {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{local?.tcid}: {local?.name}</h3>
        <div className="flex items-center gap-2">
          <div className="bg-surface-muted border border-subtle rounded-lg p-1">
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
        availableTags={availableTags}
      />
    </div>
  );
}


