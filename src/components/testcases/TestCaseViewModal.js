import React from 'react';
import { motion } from 'framer-motion';
import { X, Info, BarChart3, ClipboardList, ListOrdered, ListChecks } from 'lucide-react';

const statusColors = {
  Passed: 'text-green-400 bg-green-900/20',
  Failed: 'text-red-400 bg-red-900/20',
  'In Progress': 'text-amber-300 bg-amber-900/20',
  'Not Run': 'text-menu bg-white/5',
};

const getPriorityFromTestType = (testType) => {
  switch (testType) {
    case 'Security':
    case 'Performance':
      return 'High';
    case 'Usability':
      return 'Low';
    case 'Functional':
    case 'Integration':
    default:
      return 'Medium';
  }
};

const priorityPill = (p) => {
  const map = {
    High: 'bg-red-900/20 text-red-400',
    Medium: 'bg-orange-900/20 text-orange-300',
    Low: 'bg-green-900/20 text-green-400',
  };
  return map[p] || map.Medium;
};

export default function TestCaseViewModal({ open, testCase, onClose, resolveTags }) {
  if (!open || !testCase) return null;
  const priority = testCase.priority || getPriorityFromTestType(testCase.testType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="tc-testcase-form tc-testcase-view bg-card border border-subtle rounded-2xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-foreground">Test Case Details</h3>
          <button onClick={onClose} className="p-2 text-menu hover:text-white hover:bg-white/10 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 text-foreground">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                <h4 className="text-lg font-medium text-foreground">Basic Information</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Test Case ID (TCID)</label>
                  <input disabled className="input-field" value={testCase.tcid || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Test Case Name</label>
                  <input disabled className="input-field" value={testCase.name || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Author</label>
                  <input disabled className="input-field" value={testCase.author || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Test Type</label>
                  <input disabled className="input-field" value={testCase.testType || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
                  <div className="relative w-full">
                    <div className="input-field pr-24"></div>
                    <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-full ${priorityPill(priority)}`}>
                      {priority}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                <h4 className="text-lg font-medium text-foreground">Status & Results</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-menu">Overall Result:</span>
                  <span className={`ml-2 text-xs px-2 py-1 rounded-full ${statusColors[testCase.overallResult] || 'bg-white/5 text-menu'}`}>
                    {testCase.overallResult || 'Not Run'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-menu">Total Steps:</span>
                  <p className="text-foreground">{Array.isArray(testCase.testSteps) ? testCase.testSteps.length : 0}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-menu">Passed Steps:</span>
                  <p className="text-foreground">{(testCase.testSteps || []).filter(s => s.stepStatus === 'Passed').length}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-menu">Failed Steps:</span>
                  <p className="text-foreground">{(testCase.testSteps || []).filter(s => s.stepStatus === 'Failed').length}</p>
                </div>
              </div>
            </div>
          </div>

          {Array.isArray(testCase.tags) && testCase.tags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                <h4 className="text-lg font-medium text-foreground">Tags</h4>
              </div>
              <div className="mt-1">
                <div className="flex flex-wrap gap-1">
                  {(resolveTags ? resolveTags(testCase.tags) : []).map(tag => (
                    <span key={tag.id} className="rounded-full text-white text-xs px-2 py-0.5" style={{ backgroundColor: tag.color || '#64748b' }} title={tag.name}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
              <h4 className="text-lg font-medium text-foreground">Description/Objective</h4>
            </div>
            <textarea disabled className="input-field" rows="3" value={testCase.description || ''} />
          </div>

          {testCase.prerequisites && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ListChecks className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                <h4 className="text-lg font-medium text-foreground">Pre-Requisites</h4>
              </div>
              <textarea disabled className="input-field" rows="2" value={testCase.prerequisites || ''} />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-4">
              <ListOrdered className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
              <h4 className="text-lg font-medium text-foreground">Test Steps</h4>
            </div>
            <div className="space-y-4">
              {(testCase.testSteps || []).map((step, index) => (
                <div key={index} className="step-card border border-subtle p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-foreground">Step {step.stepNumber}</h5>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[step.stepStatus] || 'bg-white/5 text-menu'}`}>
                      {step.stepStatus || 'Not Run'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                      <textarea disabled className="input-field" rows="2" value={step.description || ''} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Test Data</label>
                      <textarea disabled className="input-field" rows="2" value={step.testData || ''} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Expected Result</label>
                      <textarea disabled className="input-field" rows="2" value={step.expectedResult || ''} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Actual Result</label>
                      <textarea disabled className="input-field" rows="2" value={step.actualResult || 'Not recorded'} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


