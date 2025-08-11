import React, { useEffect, useState } from 'react';
import { Info, ClipboardList, ListChecks, Plus, ListOrdered } from 'lucide-react';
import { testTypeService } from '../../services/testTypeService';
import TestTypeSelect from './TestTypeSelect';
import TagMultiSelect from '../TagMultiSelect';
import TagPills from '../TagPills';
import RichTextEditor from '../common/RichTextEditor';
import RichTextViewer from '../common/RichTextViewer';

export default function TestCaseForm({
  organizationId,
  mode = 'create', // 'create' | 'edit' | 'view'
  form,
  onChange,
  onAddStep,
  onRemoveStep,
  onUpdateStep,
  onSubmit,
  onCancel,
  submitLabel = 'Create Test Case',
  showActions = true,
  projectMembers = [],
}) {
  const isReadOnly = mode === 'view';
  const [orgTypes, setOrgTypes] = useState([]);
  const [availableTags, setAvailableTags] = useState([
    { id: 'ui', name: 'UI', color: '#0ea5e9' },
    { id: 'api', name: 'API', color: '#10b981' },
    { id: 'regression', name: 'Regression', color: '#f59e0b' },
    { id: 'security', color: '#ef4444' },
  ]);

  // Debug logging
  console.log('TestCaseForm render:', { mode, form: form?.tcid, author: form?.author, projectMembers: projectMembers?.length });

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!organizationId) return;
      const types = await testTypeService.getResolvedOrgTestTypes(organizationId);
      if (alive) {
        setOrgTypes(types.filter((r) => r.enabled));
      }
    })();
    return () => { alive = false; };
  }, [organizationId]);

  const addOrUpdateTag = (tag) => {
    setAvailableTags(prev => {
      const existing = prev.find(t => t.id === tag.id);
      if (existing) {
        return prev.map(t => t.id === tag.id ? tag : t);
      }
      return [...prev, tag];
    });
  };

  return (
    <form onSubmit={onSubmit} className={`tc-testcase-form ${mode === 'create' ? 'tc-testcase-new' : 'tc-testcase-edit'} space-y-6`}>
      <div className="flex items-center gap-2">
        <Info className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
        <h4 className="text-lg font-medium text-foreground">Basic Information</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Test Case ID (TCID)</label>
          {isReadOnly ? (
            <div className="input-field bg-white/5 cursor-default select-text">{form.tcid}</div>
          ) : (
            <input className="input-field" value={form.tcid} onChange={(e) => onChange({ tcid: e.target.value })} placeholder="Leave blank to auto-generate" />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Test Case Name <span className="text-red-500">*</span></label>
          {isReadOnly ? (
            <div className="input-field bg-white/5 cursor-default select-text whitespace-pre-wrap">{form.name}</div>
          ) : (
            <textarea
              rows={1}
              className="input-field resize-none overflow-hidden"
              value={form.name}
              onChange={(e) => onChange({ name: e.target.value })}
              onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }}
              required
            />
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <ClipboardList className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
          <h4 className="text-lg font-medium text-foreground">Description/Objective</h4>
        </div>
        <label className="block text-sm font-medium text-foreground mb-2">Description/Objective <span className="text-red-500">*</span></label>
        {isReadOnly ? (
          <RichTextViewer html={form.description || ''} />
        ) : (
          <RichTextEditor value={form.description || ''} onChange={(html) => onChange({ description: html })} />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Test Author <span className="text-red-500">*</span></label>
          {isReadOnly ? (
            <div className="input-field bg-white/5 cursor-default select-text">{form.author}</div>
          ) : (
            <select 
              className="input-field" 
              value={form.author} 
              onChange={(e) => onChange({ author: e.target.value })} 
              required
            >
              <option value="">Select author...</option>
              {form.author && !projectMembers.some(member => (member.name || member.displayName || '') === form.author) && (
                <option value={form.author} disabled>{form.author} (current)</option>
              )}
              {projectMembers.map((member, idx) => {
                const name = member?.name || member?.displayName || '';
                const key = member?.id || member?.userId || String(idx);
                return name ? (
                  <option key={key} value={name}>{name}</option>
                ) : null;
              })}
              {/* Debug info */}
              {projectMembers.length === 0 && (
                <option disabled>No project members found</option>
              )}
            </select>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Test Type</label>
          {isReadOnly ? (
            (() => {
              const code = form.testTypeCode || '';
              const found = orgTypes.find((t) => t.id === code);
              const name = found?.name || form.testType || code || '';
              const icon = found?.icon || null;
              const iconColor = icon?.colorDark || '#60a5fa';
              return (
                <div className="input-field bg-white/5 cursor-default select-text">
                  <span className="inline-flex items-center h-7 px-1 rounded text-sm font-medium text-foreground">
                    {icon?.url && (
                      <span
                        className="mr-2 inline-block"
                        style={{
                          WebkitMaskImage: `url(${icon.url})`,
                          maskImage: `url(${icon.url})`,
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          WebkitMaskSize: 'contain',
                          maskSize: 'contain',
                          backgroundColor: iconColor,
                          width: '16px',
                          height: '16px',
                        }}
                        aria-hidden="true"
                      />
                    )}
                    {name}
                  </span>
                </div>
              );
            })()
          ) : (
            <TestTypeSelect
              options={orgTypes}
              valueCode={form.testTypeCode || ''}
              valueLabel={form.testType || ''}
              onChange={({ code, name }) => onChange({ testTypeCode: code, testType: name })}
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
          {isReadOnly ? (
            <div className="input-field bg-white/5 cursor-default select-text">{form.priority || 'Medium'}</div>
          ) : (
            <select className="input-field" value={form.priority || 'Medium'} onChange={(e) => onChange({ priority: e.target.value })}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <ClipboardList className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
          <h4 className="text-lg font-medium text-foreground">Tags</h4>
        </div>
        {isReadOnly ? (
          <div className="input-field bg-white/5 cursor-default select-text">
            <TagPills tags={availableTags.filter(t => (form.tags || []).includes(t.id))} size="sm" />
          </div>
        ) : (
          <TagMultiSelect
            availableTags={availableTags}
            value={form.tags || []}
            onChange={(ids) => onChange({ tags: ids })}
            onAddTag={addOrUpdateTag}
            label="Tags"
          />
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <ListChecks className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
          <h4 className="text-lg font-medium text-foreground">Pre-Requisites</h4>
        </div>
        {isReadOnly ? (
          <div className="input-field bg-white/5 cursor-default select-text whitespace-pre-wrap">{form.prerequisites || ''}</div>
        ) : (
          <textarea rows={2} className="input-field" placeholder="Any pre-requisites for this test case..." value={form.prerequisites || ''} onChange={(e) => onChange({ prerequisites: e.target.value })} />
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <ListOrdered className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
          <h4 className="text-lg font-medium text-foreground">Test Steps</h4>
        </div>
        <div className="space-y-4">
          {Array.isArray(form.testSteps) && form.testSteps.map((step, index) => (
            <div key={index} className="bg-surface-muted rounded-lg p-4 border border-subtle">
              <div className="flex justify-between items-center mb-3">
                <h5 className="font-medium text-foreground">Step {step.stepNumber}</h5>
                {!isReadOnly && (
                  <button type="button" onClick={() => onRemoveStep(index)} className="text-red-500 hover:text-red-600 p-1">
                    Remove
                  </button>
                )}
              </div>
              {isReadOnly ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-menu mb-1">Description</label>
                    <div className="input-field bg-white/5 cursor-default select-text whitespace-pre-wrap">{step.description}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-menu mb-1">Test Data</label>
                      <div className="input-field bg-white/5 cursor-default select-text">{step.testData}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-menu mb-1">Expected Result</label>
                      <div className="input-field bg-white/5 cursor-default select-text whitespace-pre-wrap">{step.expectedResult}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-menu mb-1">Status</label>
                      <div className="input-field bg-white/5 cursor-default select-text">{step.stepStatus}</div>
                    </div>
                  </div>
                  {step.notes !== undefined && step.notes !== '' && (
                    <div>
                      <label className="block text-xs font-medium text-menu mb-1">Notes</label>
                      <div className="input-field bg-white/5 cursor-default select-text whitespace-pre-wrap">{step.notes}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <textarea rows={2} className="input-field text-sm" placeholder="Description *" value={step.description} onChange={(e) => onUpdateStep(index, 'description', e.target.value)} required />
                  <input className="input-field text-sm" placeholder="Test Data" value={step.testData} onChange={(e) => onUpdateStep(index, 'testData', e.target.value)} />
                  <textarea rows={2} className="input-field text-sm" placeholder="Expected Result *" value={step.expectedResult} onChange={(e) => onUpdateStep(index, 'expectedResult', e.target.value)} required />
                  <select className="input-field text-sm" value={step.stepStatus} onChange={(e) => onUpdateStep(index, 'stepStatus', e.target.value)}>
                    <option value="Not Run">Not Run</option>
                    <option value="Passed">Passed</option>
                    <option value="Failed">Failed</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                  <textarea rows={1} className="input-field text-sm md:col-span-2" placeholder="Notes" value={step.notes || ''} onChange={(e) => onUpdateStep(index, 'notes', e.target.value)} />
                </div>
              )}
            </div>
          ))}

          {!isReadOnly && (
            <button type="button" onClick={onAddStep} className="btn-secondary w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Test Step
            </button>
          )}
        </div>
      </div>

      {showActions && (
        <div className="flex space-x-3 pt-4 border-t border-subtle">
          {onCancel && <button type="button" onClick={onCancel} className="flex-1 btn-secondary">Cancel</button>}
          {mode !== 'view' && <button type="submit" className="flex-1 btn-primary">{submitLabel}</button>}
        </div>
      )}
    </form>
  );
}


