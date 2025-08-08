import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Filter, 
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('last-30-days');

  // Mock data for charts
  const testExecutionData = [
    { month: 'Jan', passed: 85, failed: 15, notRun: 20 },
    { month: 'Feb', passed: 92, failed: 8, notRun: 15 },
    { month: 'Mar', passed: 78, failed: 22, notRun: 25 },
    { month: 'Apr', passed: 88, failed: 12, notRun: 18 },
    { month: 'May', passed: 95, failed: 5, notRun: 10 },
    { month: 'Jun', passed: 82, failed: 18, notRun: 22 },
  ];

  const defectTrendData = [
    { month: 'Jan', open: 25, resolved: 20, closed: 15 },
    { month: 'Feb', open: 30, resolved: 25, closed: 18 },
    { month: 'Mar', open: 35, resolved: 30, closed: 22 },
    { month: 'Apr', open: 28, resolved: 35, closed: 25 },
    { month: 'May', open: 22, resolved: 28, closed: 30 },
    { month: 'Jun', open: 18, resolved: 25, closed: 28 },
  ];

  const defectByModuleData = [
    { name: 'User Management', value: 15, color: '#ef4444' },
    { name: 'Payment System', value: 12, color: '#f59e0b' },
    { name: 'Product Catalog', value: 8, color: '#10b981' },
    { name: 'Order Management', value: 6, color: '#3b82f6' },
    { name: 'Inventory', value: 4, color: '#8b5cf6' },
  ];

  const testCoverageData = [
    { module: 'User Management', coverage: 85, tests: 45 },
    { module: 'Payment System', coverage: 92, tests: 38 },
    { module: 'Product Catalog', coverage: 78, tests: 52 },
    { module: 'Order Management', coverage: 88, tests: 41 },
    { module: 'Inventory', coverage: 75, tests: 28 },
  ];

  const reports = [
    { id: 'overview', name: 'Overview Dashboard', icon: BarChart3 },
    { id: 'test-execution', name: 'Test Execution Report', icon: CheckCircle },
    { id: 'defect-analysis', name: 'Defect Analysis', icon: AlertTriangle },
    { id: 'coverage', name: 'Test Coverage Report', icon: FileText },
    { id: 'trends', name: 'Trends & Metrics', icon: TrendingUp },
  ];

  const renderOverviewReport = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Test Cases', value: '1,247', change: '+12%', trend: 'up', icon: FileText },
          { title: 'Test Execution Rate', value: '89%', change: '+5%', trend: 'up', icon: CheckCircle },
          { title: 'Defect Resolution Rate', value: '92%', change: '+8%', trend: 'up', icon: AlertTriangle },
          { title: 'Average Test Duration', value: '2.3h', change: '-15%', trend: 'down', icon: Clock },
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate text-sm">{metric.title}</p>
                  <p className="text-2xl font-semibold text-charcoal mt-1">{metric.value}</p>
                  <div className="flex items-center mt-2">
                    {metric.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${metric.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                      {metric.change}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-primary-light text-primary">
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-charcoal mb-4">Test Execution Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={testExecutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e3e7ed" />
              <XAxis dataKey="month" stroke="#606a78" />
              <YAxis stroke="#606a78" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e3e7ed',
                  borderRadius: '12px'
                }}
              />
              <Area type="monotone" dataKey="passed" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="failed" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
              <Area type="monotone" dataKey="notRun" stackId="1" stroke="#6b7280" fill="#6b7280" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-charcoal mb-4">Defects by Module</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={defectByModuleData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {defectByModuleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e3e7ed',
                  borderRadius: '12px'
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {defectByModuleData.map((item) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-slate">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );

  const renderTestExecutionReport = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-charcoal mb-4">Test Execution Overview</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={testExecutionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e3e7ed" />
            <XAxis dataKey="month" stroke="#606a78" />
            <YAxis stroke="#606a78" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                border: '1px solid #e3e7ed',
                borderRadius: '12px'
              }}
            />
            <Bar dataKey="passed" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="notRun" fill="#6b7280" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );

  const renderDefectAnalysisReport = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-charcoal mb-4">Defect Trends</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={defectTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e3e7ed" />
            <XAxis dataKey="month" stroke="#606a78" />
            <YAxis stroke="#606a78" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                border: '1px solid #e3e7ed',
                borderRadius: '12px'
              }}
            />
            <Line type="monotone" dataKey="open" stroke="#ef4444" strokeWidth={2} />
            <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} />
            <Line type="monotone" dataKey="closed" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );

  const renderCoverageReport = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-charcoal mb-4">Test Coverage by Module</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={testCoverageData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#e3e7ed" />
            <XAxis type="number" domain={[0, 100]} stroke="#606a78" />
            <YAxis dataKey="module" type="category" stroke="#606a78" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                border: '1px solid #e3e7ed',
                borderRadius: '12px'
              }}
            />
            <Bar dataKey="coverage" fill="#3762c4" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );

  const renderTrendsReport = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-charcoal mb-4">Performance Trends</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={testExecutionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e3e7ed" />
            <XAxis dataKey="month" stroke="#606a78" />
            <YAxis stroke="#606a78" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                border: '1px solid #e3e7ed',
                borderRadius: '12px'
              }}
            />
            <Line type="monotone" dataKey="passed" stroke="#10b981" strokeWidth={3} />
            <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'overview':
        return renderOverviewReport();
      case 'test-execution':
        return renderTestExecutionReport();
      case 'defect-analysis':
        return renderDefectAnalysisReport();
      case 'coverage':
        return renderCoverageReport();
      case 'trends':
        return renderTrendsReport();
      default:
        return renderOverviewReport();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal">Reports & Analytics</h1>
          <p className="text-slate mt-1">Comprehensive insights into your testing activities and quality metrics.</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-field"
          >
            <option value="last-7-days">Last 7 Days</option>
            <option value="last-30-days">Last 30 Days</option>
            <option value="last-90-days">Last 90 Days</option>
            <option value="last-6-months">Last 6 Months</option>
          </select>
          <button className="btn-primary">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Report Navigation */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
                  selectedReport === report.id
                    ? 'bg-primary text-white'
                    : 'bg-slate-light text-slate hover:bg-primary-light hover:text-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{report.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Report Content */}
      {renderReportContent()}
    </div>
  );
};

export default Reports; 