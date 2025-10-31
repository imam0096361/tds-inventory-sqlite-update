import React, { useState, useEffect } from 'react';
import type { FinancialSummary, DepartmentCost, DepreciationData, MaintenanceCost, Budget, MonthlyTrend } from '../types';
import { API_BASE_URL, apiFetch } from '../utils/api';
import { generateUUID } from '../utils/uuid';

const CostManagement: React.FC = () => {
  // Only admins can access this page, so full edit access for everyone here
  const [activeTab, setActiveTab] = useState<'dashboard' | 'maintenance' | 'budgets' | 'depreciation'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dashboard State
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [deptCosts, setDeptCosts] = useState<DepartmentCost[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);

  // Maintenance Costs State
  const [maintenanceCosts, setMaintenanceCosts] = useState<MaintenanceCost[]>([]);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<MaintenanceCost | null>(null);

  // Budgets State
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Depreciation State
  const [depreciationData, setDepreciationData] = useState<DepreciationData[]>([]);

  // Fetch data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'maintenance') fetchMaintenanceCosts();
    if (activeTab === 'budgets') fetchBudgets();
    if (activeTab === 'depreciation') fetchDepreciation();
    if (activeTab === 'dashboard') fetchDashboardData();
  }, [activeTab, selectedYear]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, deptData, trendData] = await Promise.all([
        apiFetch('/api/financial/summary'),
        apiFetch('/api/financial/cost-by-department'),
        apiFetch('/api/financial/monthly-trend?months=6')
      ]);

      setSummary(summaryData);
      setDeptCosts(deptData);
      setMonthlyTrend(trendData);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaintenanceCosts = async () => {
    try {
      const data = await apiFetch('/api/maintenance-costs');
      setMaintenanceCosts(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchBudgets = async () => {
    try {
      const data = await apiFetch(`/api/budgets?year=${selectedYear}`);
      setBudgets(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchDepreciation = async () => {
    try {
      const data = await apiFetch('/api/financial/depreciation');
      setDepreciationData(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddMaintenance = async (formData: Partial<MaintenanceCost>) => {
    try {
      if (editingMaintenance) {
        // Update existing
        await apiFetch(`/api/maintenance-costs/${editingMaintenance.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        // Add new
        await apiFetch('/api/maintenance-costs', {
          method: 'POST',
          body: JSON.stringify({
            id: generateUUID(),
            ...formData
          })
        });
      }
      fetchMaintenanceCosts();
      setShowAddMaintenance(false);
      setEditingMaintenance(null);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleEditMaintenance = (cost: MaintenanceCost) => {
    setEditingMaintenance(cost);
    setShowAddMaintenance(true);
  };

  const handleDeleteMaintenance = async (id: string) => {
    if (!confirm('Delete this maintenance record?')) return;
    try {
      await apiFetch(`/api/maintenance-costs/${id}`, { method: 'DELETE' });
      fetchMaintenanceCosts();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading && activeTab === 'dashboard') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && activeTab === 'dashboard') {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-5xl">💰</span>
            Cost Management
          </h1>
          <p className="text-gray-600 mt-2">
            Financial tracking, budgets, and asset cost analysis
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === 'dashboard'
              ? 'border-b-4 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === 'maintenance'
              ? 'border-b-4 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🔧 Maintenance Costs
        </button>
        <button
          onClick={() => setActiveTab('budgets')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === 'budgets'
              ? 'border-b-4 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          💵 Budgets
        </button>
        <button
          onClick={() => setActiveTab('depreciation')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === 'depreciation'
              ? 'border-b-4 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📉 Depreciation
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && summary && (
        <div className="space-y-6">
          {/* Year Selector */}
          <div className="flex justify-end">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-lg font-semibold"
            >
              <option value={2023}>2023</option>
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
              <option value={2028}>2028</option>
            </select>
          </div>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Asset Value</p>
                  <p className="text-3xl font-bold mt-2">{formatCurrency(summary.totalAssetValue)}</p>
                </div>
                <div className="text-5xl opacity-50">🏢</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Annual Budget</p>
                  <p className="text-3xl font-bold mt-2">{formatCurrency(summary.annualBudget)}</p>
                  <p className="text-xs text-green-100 mt-1">
                    Spent: {formatCurrency(summary.annualSpent)}
                  </p>
                </div>
                <div className="text-5xl opacity-50">💰</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">This Month</p>
                  <p className="text-3xl font-bold mt-2">{formatCurrency(summary.thisMonthSpending)}</p>
                </div>
                <div className="text-5xl opacity-50">📅</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Maintenance (12mo)</p>
                  <p className="text-3xl font-bold mt-2">{formatCurrency(summary.totalMaintenanceCosts)}</p>
                </div>
                <div className="text-5xl opacity-50">🔧</div>
              </div>
            </div>
          </div>

          {/* Cost by Department */}
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📊</span> Cost by Department
            </h2>
            {deptCosts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No department cost data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left font-semibold">Department</th>
                      <th className="px-4 py-3 text-right font-semibold">Asset Count</th>
                      <th className="px-4 py-3 text-right font-semibold">Total Cost</th>
                      <th className="px-4 py-3 text-right font-semibold">Avg Cost/Asset</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptCosts.map((dept, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{dept.department}</td>
                        <td className="px-4 py-3 text-right">{dept.asset_count}</td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-600">
                          {formatCurrency(parseFloat(dept.total_cost.toString()))}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatCurrency(parseFloat(dept.total_cost.toString()) / dept.asset_count)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Monthly Trend */}
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📈</span> Monthly Spending Trend (Last 6 Months)
            </h2>
            {monthlyTrend.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No spending data available</p>
            ) : (
              <div className="space-y-3">
                {monthlyTrend.map((month, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-24 font-semibold text-gray-700">{month.month}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center justify-end pr-3"
                        style={{
                          width: `${Math.min(
                            (parseFloat(month.total_cost.toString()) /
                              Math.max(...monthlyTrend.map((m) => parseFloat(m.total_cost.toString())))) *
                              100,
                            100
                          )}%`,
                        }}
                      >
                        <span className="text-white font-bold text-sm">
                          {formatCurrency(parseFloat(month.total_cost.toString()))}
                        </span>
                      </div>
                    </div>
                    <div className="w-32 text-right text-sm text-gray-600">
                      {month.transaction_count} transactions
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Maintenance Costs Tab */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Maintenance Cost Records</h2>
            <button
              onClick={() => setShowAddMaintenance(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              + Add Maintenance Cost
            </button>
          </div>

          {showAddMaintenance && (
            <MaintenanceForm
              onSubmit={handleAddMaintenance}
              onCancel={() => {
                setShowAddMaintenance(false);
                setEditingMaintenance(null);
              }}
              initialData={editingMaintenance || undefined}
            />
          )}

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
            {maintenanceCosts.length === 0 ? (
              <p className="text-gray-500 text-center py-12">No maintenance records yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Date</th>
                      <th className="px-3 py-2 text-left font-semibold">Asset</th>
                      <th className="px-3 py-2 text-left font-semibold">Type</th>
                      <th className="px-3 py-2 text-left font-semibold">👤 Username</th>
                      <th className="px-3 py-2 text-left font-semibold">🎯 Priority</th>
                      <th className="px-3 py-2 text-left font-semibold">📊 Status</th>
                      <th className="px-3 py-2 text-left font-semibold">🛡️ Warranty</th>
                      <th className="px-3 py-2 text-left font-semibold">📄 Invoice</th>
                      <th className="px-3 py-2 text-left font-semibold">Description</th>
                      <th className="px-3 py-2 text-right font-semibold">Cost</th>
                      <th className="px-3 py-2 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceCosts.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                          No maintenance records yet. Click "+ Add Maintenance Cost" to create one.
                        </td>
                      </tr>
                    ) : (
                      maintenanceCosts.map((cost) => (
                        <tr key={cost.id} className="border-b hover:bg-gray-50">
                          <td className="px-3 py-2 text-xs">{new Date(cost.date).toLocaleDateString()}</td>
                          <td className="px-3 py-2">
                            <div className="font-medium">{cost.asset_name || cost.asset_id}</div>
                            <div className="text-xs text-gray-500">{cost.department || '-'}</div>
                          </td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                              {cost.asset_type}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className="text-blue-600 font-medium">{cost.username || '-'}</span>
                          </td>
                          <td className="px-3 py-2">
                            {cost.priority === 'Critical' && <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">🔴 Critical</span>}
                            {cost.priority === 'High' && <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">🟠 High</span>}
                            {cost.priority === 'Medium' && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">🟡 Medium</span>}
                            {cost.priority === 'Low' && <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">🟢 Low</span>}
                            {!cost.priority && <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-3 py-2">
                            {cost.status === 'Completed' && <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">✅ Done</span>}
                            {cost.status === 'Pending' && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">⏳ Pending</span>}
                            {cost.status === 'Cancelled' && <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">❌ Cancelled</span>}
                            {!cost.status && <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-3 py-2">
                            {cost.warranty_status === 'In Warranty' && <span className="text-green-600 text-xs">✅ Yes</span>}
                            {cost.warranty_status === 'Out of Warranty' && <span className="text-red-600 text-xs">❌ No</span>}
                            {!cost.warranty_status && <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-3 py-2 text-xs font-mono text-purple-600">{cost.invoice_number || '-'}</td>
                          <td className="px-3 py-2 text-xs text-gray-600 max-w-xs truncate" title={cost.description}>
                            {cost.description || '-'}</td>
                          <td className="px-3 py-2 text-right font-bold text-green-600">
                            {formatCurrency(cost.cost)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleEditMaintenance(cost)}
                                className="text-blue-600 hover:text-blue-800 font-semibold text-xs px-2 py-1 rounded hover:bg-blue-50"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleDeleteMaintenance(cost.id)}
                                className="text-red-600 hover:text-red-800 font-semibold text-xs px-2 py-1 rounded hover:bg-red-50"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Budgets Tab */}
      {activeTab === 'budgets' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">Budget Planning</h2>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-lg font-semibold"
              >
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value={2028}>2028</option>
              </select>
            </div>
            <button
              onClick={() => setShowAddBudget(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
            >
              + Add Budget
            </button>
          </div>

          {showAddBudget && (
            <BudgetForm
              onSubmit={async (formData) => {
                try {
                  await apiFetch('/api/budgets', {
                    method: 'POST',
                    body: JSON.stringify({
                      id: generateUUID(),
                      ...formData,
                      year: selectedYear
                    })
                  });
                  fetchBudgets();
                  setShowAddBudget(false);
                } catch (err: any) {
                  alert('Error: ' + err.message);
                }
              }}
              onCancel={() => setShowAddBudget(false)}
            />
          )}

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
            {budgets.length === 0 ? (
              <p className="text-gray-500 text-center py-12">No budgets defined yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Department</th>
                      <th className="px-4 py-3 text-left font-semibold">Category</th>
                      <th className="px-4 py-3 text-center font-semibold">Quarter</th>
                      <th className="px-4 py-3 text-right font-semibold">Allocated</th>
                      <th className="px-4 py-3 text-right font-semibold">Spent</th>
                      <th className="px-4 py-3 text-right font-semibold">Remaining</th>
                      <th className="px-4 py-3 text-center font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgets.map((budget) => {
                      const remaining = budget.allocated_amount - budget.spent_amount;
                      const percentage = (budget.spent_amount / budget.allocated_amount) * 100;
                      return (
                        <tr key={budget.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{budget.department}</td>
                          <td className="px-4 py-3">{budget.category}</td>
                          <td className="px-4 py-3 text-center">Q{budget.quarter || 'All'}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(budget.allocated_amount)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(budget.spent_amount)}</td>
                          <td className="px-4 py-3 text-right font-bold">
                            {formatCurrency(remaining)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                percentage < 70
                                  ? 'bg-green-100 text-green-800'
                                  : percentage < 90
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {percentage.toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Depreciation Tab */}
      {activeTab === 'depreciation' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Asset Depreciation Report</h2>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
            {depreciationData.length === 0 ? (
              <p className="text-gray-500 text-center py-12">
                No assets with cost data available. Add purchase costs to assets to see depreciation.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Asset</th>
                      <th className="px-4 py-3 text-left font-semibold">Type</th>
                      <th className="px-4 py-3 text-left font-semibold">Department</th>
                      <th className="px-4 py-3 text-right font-semibold">Purchase Cost</th>
                      <th className="px-4 py-3 text-right font-semibold">Annual Depreciation</th>
                      <th className="px-4 py-3 text-right font-semibold">Current Value</th>
                      <th className="px-4 py-3 text-center font-semibold">Age (Years)</th>
                      <th className="px-4 py-3 text-center font-semibold">Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {depreciationData.map((asset) => {
                      const valuePercentage = (asset.currentValue / asset.purchaseCost) * 100;
                      return (
                        <tr key={asset.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{asset.name}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                              {asset.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">{asset.department || '-'}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(asset.purchaseCost)}</td>
                          <td className="px-4 py-3 text-right text-red-600">
                            -{formatCurrency(asset.annualDepreciation)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-green-600">
                            {formatCurrency(asset.currentValue)}
                          </td>
                          <td className="px-4 py-3 text-center">{asset.ageInYears}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                valuePercentage > 50
                                  ? 'bg-green-100 text-green-800'
                                  : valuePercentage > 20
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {valuePercentage.toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right">TOTALS:</td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(depreciationData.reduce((sum, a) => sum + a.purchaseCost, 0))}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">
                        -{formatCurrency(depreciationData.reduce((sum, a) => sum + a.annualDepreciation, 0))}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600">
                        {formatCurrency(depreciationData.reduce((sum, a) => sum + a.currentValue, 0))}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Maintenance Form Component
const MaintenanceForm: React.FC<{
  onSubmit: (data: Partial<MaintenanceCost>) => void;
  onCancel: () => void;
  initialData?: MaintenanceCost;
}> = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    asset_type: initialData?.asset_type || 'PC',
    asset_id: initialData?.asset_id || '',
    asset_name: initialData?.asset_name || '',
    username: initialData?.username || '',
    cost: initialData?.cost?.toString() || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    description: initialData?.description || '',
    service_provider: initialData?.service_provider || '',
    category: initialData?.category || 'Repair',
    department: initialData?.department || '',
    status: initialData?.status || 'Pending',
    priority: initialData?.priority || 'Medium',
    invoice_number: initialData?.invoice_number || '',
    warranty_status: initialData?.warranty_status || 'Out of Warranty'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      cost: parseFloat(formData.cost)
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl border-2 border-blue-300 shadow-lg">
      <h3 className="text-xl font-bold mb-4">{initialData ? 'Edit Maintenance Cost' : 'Add Maintenance Cost'}</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
        {/* Row 1 */}
        <div>
          <label className="block text-sm font-semibold mb-1">Asset Type*</label>
          <select
            value={formData.asset_type}
            onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
          >
            <option value="PC">PC</option>
            <option value="Laptop">Laptop</option>
            <option value="Server">Server</option>
            <option value="Mouse">Mouse</option>
            <option value="Keyboard">Keyboard</option>
            <option value="SSD">SSD</option>
            <option value="Headphone">Headphone</option>
            <option value="Portable HDD">Portable HDD</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Asset ID*</label>
          <input
            type="text"
            value={formData.asset_id}
            onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            placeholder="e.g., PC-001"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Asset Name</label>
          <input
            type="text"
            value={formData.asset_name}
            onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            placeholder="e.g., Dell OptiPlex"
          />
        </div>

        {/* Row 2 - NEW: Username */}
        <div>
          <label className="block text-sm font-semibold mb-1">
            <span className="text-blue-600">👤 Username</span>
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            placeholder="User who uses this asset"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Cost (৳)*</label>
          <input
            type="number"
            step="0.01"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            placeholder="e.g., 5000.00"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Date*</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>

        {/* Row 3 */}
        <div>
          <label className="block text-sm font-semibold mb-1">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="Repair">Repair</option>
            <option value="Upgrade">Upgrade</option>
            <option value="Replacement">Replacement</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Cleaning">Cleaning</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">
            <span className="text-orange-600">🎯 Priority</span>
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="Low">🟢 Low</option>
            <option value="Medium">🟡 Medium</option>
            <option value="High">🟠 High</option>
            <option value="Critical">🔴 Critical</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">
            <span className="text-green-600">📊 Status</span>
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="Pending">⏳ Pending</option>
            <option value="Completed">✅ Completed</option>
            <option value="Cancelled">❌ Cancelled</option>
          </select>
        </div>

        {/* Row 4 */}
        <div>
          <label className="block text-sm font-semibold mb-1">Service Provider</label>
          <input
            type="text"
            value={formData.service_provider}
            onChange={(e) => setFormData({ ...formData, service_provider: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            placeholder="e.g., Tech Solutions Ltd"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">
            <span className="text-purple-600">📄 Invoice Number</span>
          </label>
          <input
            type="text"
            value={formData.invoice_number}
            onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            placeholder="e.g., INV-2025-001"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">
            <span className="text-indigo-600">🛡️ Warranty Status</span>
          </label>
          <select
            value={formData.warranty_status}
            onChange={(e) => setFormData({ ...formData, warranty_status: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="In Warranty">✅ In Warranty</option>
            <option value="Out of Warranty">❌ Out of Warranty</option>
          </select>
        </div>

        {/* Row 5 */}
        <div>
          <label className="block text-sm font-semibold mb-1">Department</label>
          <input
            type="text"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            placeholder="e.g., IT, HR, Finance"
          />
        </div>

        {/* Row 6 - Full width */}
        <div className="col-span-3">
          <label className="block text-sm font-semibold mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            rows={3}
            placeholder="Detailed description of maintenance work..."
          />
        </div>

        {/* Buttons */}
        <div className="col-span-3 flex gap-3 mt-2">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition"
          >
            {initialData ? '💾 Update Maintenance Cost' : '💰 Add Maintenance Cost'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-300 rounded-lg hover:bg-gray-400 font-semibold transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// Budget Form Component
const BudgetForm: React.FC<{
  onSubmit: (data: Partial<Budget>) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    department: '',
    quarter: '',
    category: 'Hardware',
    allocated_amount: '',
    spent_amount: '0',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      quarter: formData.quarter ? parseInt(formData.quarter) : undefined,
      allocated_amount: parseFloat(formData.allocated_amount),
      spent_amount: parseFloat(formData.spent_amount)
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl border-2 border-green-300 shadow-lg">
      <h3 className="text-xl font-bold mb-4">Add Budget</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Department*</label>
          <input
            type="text"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Quarter (optional)</label>
          <select
            value={formData.quarter}
            onChange={(e) => setFormData({ ...formData, quarter: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="">All Year</option>
            <option value="1">Q1</option>
            <option value="2">Q2</option>
            <option value="3">Q3</option>
            <option value="4">Q4</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Category*</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
          >
            <option value="Hardware">Hardware</option>
            <option value="Software">Software</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Licenses">Licenses</option>
            <option value="Cloud Services">Cloud Services</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Allocated Amount (৳)*</label>
          <input
            type="number"
            step="0.01"
            value={formData.allocated_amount}
            onChange={(e) => setFormData({ ...formData, allocated_amount: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-semibold mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            rows={2}
          />
        </div>
        <div className="col-span-2 flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
          >
            Add Budget
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-300 rounded-lg hover:bg-gray-400 font-semibold"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CostManagement;

