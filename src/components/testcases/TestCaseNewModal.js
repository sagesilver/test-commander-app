import React from 'react';
import { motion } from 'framer-motion';
import { X, Info, ClipboardList, ListChecks, Plus } from 'lucide-react';

export default function TestCaseNewModal({
  open,
  form,
  onChange,
  onAddStep,
  onRemoveStep,
  onUpdateStep,
  onSubmit,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-subtle rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-foreground">Create New Test Case</h3>
          <button onClick={onClose} className="p-2 text-menu hover:text-white hover:bg-white/10 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="tc-testcase-form tc-testcase-new space-y-6">
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
              <input className="input-field" value={form.name} onChange={(e) => onChange({ name: e.target.value })} required />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
              <h4 className="text-lg font-medium text-foreground">Description/Objective</h4>
            </div>
            <label className="block text-sm font-medium text-foreground mb-2">Description/Objective <span className="text-red-500">*</span></label>
            <textarea rows={3} className="input-field" value={form.description} onChange={(e) => onChange({ description: e.target.value })} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Test Author <span className="text-red-500">*</span></label>
              <input className="input-field" value={form.author} onChange={(e) => onChange({ author: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Test Type</label>
              <select className="input-field" value={form.testType} onChange={(e) => onChange({ testType: e.target.value })}>
                <option value="">Select Test Type</option>
                <option value="Functional">Functional</option>
                <option value="Security">Security</option>
                <option value="Performance">Performance</option>
                <option value="Usability">Usability</option>
                <option value="Integration">Integration</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
              <select className="input-field" value={form.priority} onChange={(e) => onChange({ priority: e.target.value })}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <ListChecks className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
              <h4 className="text-lg font-medium text-foreground">Test Steps</h4>
            </div>
            <button type="button" className="btn-primary text-sm mb-3" onClick={onAddStep}>
              <Plus className="w-4 h-4 mr-1" /> Add Step
            </button>
            <div className="space-y-3">
              {form.testSteps.map((step, index) => (
                <div key={index} className="bg-surface-muted rounded-lg p-4 border border-subtle">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-medium text-foreground">Step {step.stepNumber}</h5>
                    <button type="button" className="text-red-500 hover:text-red-600 p-1" onClick={() => onRemoveStep(index)}>Remove</button>
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
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-grey-light">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
            <button type="submit" className="flex-1 btn-primary">Create Test Case</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}


