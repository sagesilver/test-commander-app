import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Info, ClipboardList, ListChecks, Plus, ListOrdered } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { testTypeService } from '../../services/testTypeService';
import TestTypeSelect from './TestTypeSelect';
import TagMultiSelect from '../TagMultiSelect';
import RichTextEditor from '../common/RichTextEditor';

export default function TestCaseEditModal({
  open,
  form,
  onChange,
  onAddStep,
  onRemoveStep,
  onUpdateStep,
  onSubmit,
  onClose,
  projectMembers = [],
  onAddGlobalTag,
  availableTags: availableTagsProp = [],
  onDeleteGlobalTag,
}) {
  const { currentUserData, currentOrganization } = useAuth();
  const [orgTypes, setOrgTypes] = useState([]);
  const [availableTags, setAvailableTags] = useState(availableTagsProp);

  // Keep local tags in sync with organization tags
  useEffect(() => {
    if (Array.isArray(availableTagsProp)) {
      setAvailableTags(availableTagsProp);
    }
  }, [availableTagsProp]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const orgId = currentOrganization?.id || currentUserData?.organisationId || null;
      if (!orgId) return;
      const rows = await testTypeService.getResolvedOrgTestTypes(orgId);
      if (alive) setOrgTypes(rows.filter((r) => r.enabled));
    })();
    return () => { alive = false; };
  }, [currentUserData, currentOrganization]);

  const addOrUpdateTag = (tag) => {
    setAvailableTags(prev => {
      const existing = prev.find(t => t.id === tag.id);
      if (existing) {
        return prev.map(t => t.id === tag.id ? tag : t);
      }
      return [...prev, tag];
    });
    // Persist to organization-level list (color/name)
    onAddGlobalTag?.(tag);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-subtle rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-foreground">Edit Test Case</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-menu" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit?.(form); }} className="tc-testcase-form tc-testcase-edit space-y-6">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
            <h4 className="text-lg font-medium text-foreground">Basic Information</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Test Case ID (TCID) <span className="text-red-500">*</span></label>
              <input className="input-field" value={form.tcid} onChange={(e) => onChange({ tcid: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Test Case Name <span className="text-red-500">*</span></label>
              <textarea
                rows={1}
                className="input-field resize-none overflow-hidden"
                value={form.name}
                onChange={(e) => onChange({ name: e.target.value })}
                onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
              <h4 className="text-lg font-medium text-foreground">Description/Objective</h4>
            </div>
            <label className="block text-sm font-medium text-foreground mb-2">Description/Objective <span className="text-red-500">*</span></label>
            <RichTextEditor value={form.description || ''} onChange={(html) => onChange({ description: html })} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Test Author <span className="text-red-500">*</span></label>
              <select
                className="input-field"
                value={form.author || ''}
                onChange={(e) => onChange({ author: e.target.value })}
                required
              >
                <option value="">Select author…</option>
                {projectMembers.map((m, idx) => {
                  const name = m?.name || m?.displayName || '';
                  const key = m?.id || m?.userId || String(idx);
                  return name ? <option key={key} value={name}>{name}</option> : null;
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Test Type</label>
              <TestTypeSelect
                options={orgTypes}
                valueCode={form.testTypeCode || ''}
                valueLabel={form.testType || ''}
                onChange={({ code, name }) => onChange({ testTypeCode: code, testType: name })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
              <select className="input-field" value={form.priority || 'Medium'} onChange={(e) => onChange({ priority: e.target.value })}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
              <h4 className="text-lg font-medium text-foreground">Tags</h4>
            </div>
            <TagMultiSelect
              availableTags={(() => {
                // Ensure selected tags render even if not present in available list
                const map = new Map((availableTags || []).map(t => [t.id, t]));
                (form.tags || []).forEach(id => {
                  if (!map.has(id)) map.set(id, { id, name: id, color: '#64748b' });
                });
                return Array.from(map.values());
              })()}
              value={form.tags || []}
              onChange={(ids) => onChange({ tags: ids })}
              onAddTag={addOrUpdateTag}
              onDeleteTag={onDeleteGlobalTag}
              label="Tags"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <ListChecks className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
              <h4 className="text-lg font-medium text-foreground">Pre-Requisites</h4>
            </div>
            <textarea rows={2} className="input-field" placeholder="Any pre-requisites for this test case..." value={form.prerequisites} onChange={(e) => onChange({ prerequisites: e.target.value })} />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <ListOrdered className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
              <h4 className="text-lg font-medium text-foreground">Test Steps</h4>
            </div>
            <div className="space-y-4">
              {form.testSteps.map((step, index) => (
                <div key={index} className="bg-surface-muted rounded-lg p-4 border border-subtle">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-medium text-foreground">Step {step.stepNumber}</h5>
                    <button type="button" onClick={() => onRemoveStep(index)} className="text-red-500 hover:text-red-600 p-1">
                      Remove
                    </button>
                  </div>
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
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-menu mb-1">
                      Notes/Comments
                    </label>
                    <textarea
                      placeholder="Additional notes..."
                      rows="1"
                      className="input-field text-sm"
                      value={step.notes}
                      onChange={(e) => onUpdateStep(index, 'notes', e.target.value)}
                    />
                  </div>
                </div>
              ))}
              <button type="button" onClick={onAddStep} className="btn-secondary w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Test Step
              </button>
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-subtle">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
            <button type="submit" className="flex-1 btn-primary">Update Test Case</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}


