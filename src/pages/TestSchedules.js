import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  FileText,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';

const TestSchedules = () => {
  const [selectedSchedule, setSelectedSchedule] = useState('sprint-3');

  // Mock schedule data
  const schedules = [
    {
      id: 'sprint-3',
      name: 'Sprint 3 Test Schedule',
      project: 'E-Commerce Platform',
      startDate: '2024-01-15',
      endDate: '2024-01-29',
      status: 'In Progress',
      phases: [
        {
          id: 'phase-1',
          name: 'System Testing',
          startDate: '2024-01-15',
          endDate: '2024-01-19',
          status: 'Completed',
          cycles: [
            {
              id: 'cycle-1',
              name: 'Cycle 1',
              testCases: 45,
              completed: 45,
              passed: 42,
              failed: 3
            }
          ]
        },
        {
          id: 'phase-2',
          name: 'Integration Testing',
          startDate: '2024-01-20',
          endDate: '2024-01-24',
          status: 'In Progress',
          cycles: [
            {
              id: 'cycle-2',
              name: 'Cycle 1',
              testCases: 32,
              completed: 18,
              passed: 15,
              failed: 3
            },
            {
              id: 'cycle-3',
              name: 'Cycle 2',
              testCases: 28,
              completed: 0,
              passed: 0,
              failed: 0
            }
          ]
        },
        {
          id: 'phase-3',
          name: 'UAT Testing',
          startDate: '2024-01-25',
          endDate: '2024-01-29',
          status: 'Not Started',
          cycles: [
            {
              id: 'cycle-4',
              name: 'Cycle 1',
              testCases: 25,
              completed: 0,
              passed: 0,
              failed: 0
            }
          ]
        }
      ]
    },
    {
      id: 'sprint-2',
      name: 'Sprint 2 Test Schedule',
      project: 'E-Commerce Platform',
      startDate: '2024-01-01',
      endDate: '2024-01-14',
      status: 'Completed',
      phases: [
        {
          id: 'phase-4',
          name: 'System Testing',
          startDate: '2024-01-01',
          endDate: '2024-01-05',
          status: 'Completed',
          cycles: [
            {
              id: 'cycle-5',
              name: 'Cycle 1',
              testCases: 38,
              completed: 38,
              passed: 35,
              failed: 3
            }
          ]
        }
      ]
    }
  ];

  const statusColors = {
    'Not Started': 'text-slate bg-slate-light',
    'In Progress': 'text-amber-500 bg-amber-50',
    'Completed': 'text-green-500 bg-green-50',
    'On Hold': 'text-purple-500 bg-purple-50'
  };

  const currentSchedule = schedules.find(s => s.id === selectedSchedule);

  const getProgressPercentage = (cycle) => {
    return cycle.testCases > 0 ? Math.round((cycle.completed / cycle.testCases) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal">Test Schedules</h1>
          <p className="text-slate mt-1">Plan and track test execution across different phases and cycles.</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Schedule
        </button>
      </div>

      {/* Schedule Selector */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-charcoal mb-2">Select Schedule</label>
            <select
              value={selectedSchedule}
              onChange={(e) => setSelectedSchedule(e.target.value)}
              className="input-field"
            >
              {schedules.map(schedule => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.name} - {schedule.project}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end space-x-3">
            <div className="text-center">
              <p className="text-sm text-slate">Start Date</p>
              <p className="font-medium text-charcoal">{currentSchedule?.startDate}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate">End Date</p>
              <p className="font-medium text-charcoal">{currentSchedule?.endDate}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate">Status</p>
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[currentSchedule?.status]}`}>
                {currentSchedule?.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Overview */}
      {currentSchedule && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Schedule Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-charcoal mb-4">Schedule Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate">Total Phases:</span>
                <span className="font-medium text-charcoal">{currentSchedule.phases.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate">Total Test Cases:</span>
                <span className="font-medium text-charcoal">
                  {currentSchedule.phases.reduce((total, phase) => 
                    total + phase.cycles.reduce((sum, cycle) => sum + cycle.testCases, 0), 0
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate">Completed:</span>
                <span className="font-medium text-green-500">
                  {currentSchedule.phases.reduce((total, phase) => 
                    total + phase.cycles.reduce((sum, cycle) => sum + cycle.completed, 0), 0
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate">Success Rate:</span>
                <span className="font-medium text-charcoal">
                  {(() => {
                    const totalCompleted = currentSchedule.phases.reduce((total, phase) => 
                      total + phase.cycles.reduce((sum, cycle) => sum + cycle.completed, 0), 0
                    );
                    const totalPassed = currentSchedule.phases.reduce((total, phase) => 
                      total + phase.cycles.reduce((sum, cycle) => sum + cycle.passed, 0), 0
                    );
                    return totalCompleted > 0 ? Math.round((totalPassed / totalCompleted) * 100) : 0;
                  })()}%
                </span>
              </div>
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-charcoal mb-4">Timeline</h3>
            <div className="space-y-3">
              {currentSchedule.phases.map((phase, index) => (
                <div key={phase.id} className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-charcoal">{phase.name}</p>
                    <p className="text-sm text-slate">{phase.startDate} - {phase.endDate}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[phase.status]}`}>
                    {phase.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-charcoal mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full btn-primary">
                <Play className="w-4 h-4 mr-2" />
                Start Next Phase
              </button>
              <button className="w-full btn-secondary">
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </button>
              <button className="w-full btn-secondary">
                <Edit className="w-4 h-4 mr-2" />
                Edit Schedule
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Phases and Cycles */}
      {currentSchedule && (
        <div className="space-y-6">
          {currentSchedule.phases.map((phase, phaseIndex) => (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: phaseIndex * 0.1 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-charcoal">{phase.name}</h3>
                  <p className="text-sm text-slate">{phase.startDate} - {phase.endDate}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[phase.status]}`}>
                    {phase.status}
                  </span>
                  <button className="p-2 text-slate hover:text-primary hover:bg-primary-light rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate hover:text-primary hover:bg-primary-light rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {phase.cycles.map((cycle, cycleIndex) => (
                  <div key={cycle.id} className="bg-slate-light rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-charcoal">{cycle.name}</h4>
                      <div className="flex items-center space-x-2">
                        {cycle.completed > 0 && cycle.completed < cycle.testCases && (
                          <button className="p-1 text-amber-500 hover:bg-amber-50 rounded transition-colors">
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        {cycle.completed === 0 && (
                          <button className="p-1 text-green-500 hover:bg-green-50 rounded transition-colors">
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate">Progress</span>
                        <span className="font-medium text-charcoal">{getProgressPercentage(cycle)}%</span>
                      </div>
                      <div className="w-full bg-white rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage(cycle)}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <p className="text-slate">Total</p>
                          <p className="font-medium text-charcoal">{cycle.testCases}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-slate">Passed</p>
                          <p className="font-medium text-green-500">{cycle.passed}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-slate">Failed</p>
                          <p className="font-medium text-red-500">{cycle.failed}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestSchedules; 