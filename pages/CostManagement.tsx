import React, { useState, useEffect } from 'react';
import type { FinancialSummary, DepartmentCost, DepreciationData, MaintenanceCost, Budget, MonthlyTrend } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Detect if we're on Vercel production or localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : '');

const CostManagement: React.FC = () => {
  const { user } = useAuth();
  
  // Check if user can edit (admin, finance, finance_manager can edit)
  const canEdit = user?.role === 'admin' || user?.role === 'finance' || user?.role === 'finance_manager';
  // finance_viewer can only view
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

  // Budgets State
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showAddBudget, setShowAddBudget] = useState(false);

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
  }, [activeTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [summaryRes, deptRes, trendRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/financial/summary`, { headers }),
        fetch(`${API_BASE_URL}/api/financial/cost-by-department`, { headers }),
        fetch(`${API_BASE_URL}/api/financial/monthly-trend?months=6`, { headers })
      ]);

      if (!summaryRes.ok || !deptRes.ok || !trendRes.ok) {
        throw new Error('Failed to fetch financial data');
      }

      const summaryData = await summaryRes.json();
      const deptData = await deptRes.json();
      const trendData = await trendRes.json();

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
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/maintenance-costs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch maintenance costs');
      const data = await res.json();
      setMaintenanceCosts(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchBudgets = async () => {
    try {
      const token = localStorage.getItem('token');
      const currentYear = new Date().getFullYear();
      const res = await fetch(`${API_BASE_URL}/api/budgets?year=${currentYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch budgets');
      const data = await res.json();
      setBudgets(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchDepreciation = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/financial/depreciation`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch depreciation data');
      const data = await res.json();
      setDepreciationData(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddMaintenance = async (formData: Partial<MaintenanceCost>) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/maintenance-costs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: Date.now().toString(),
          ...formData
        })
      });
      if (!res.ok) throw new Error('Failed to add maintenance cost');
      fetchMaintenanceCosts();
      setShowAddMaintenance(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteMaintenance = async (id: string) => {
    if (!confirm('Delete this maintenance record?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/maintenance-costs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
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
            {!canEdit && (
              <span className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-semibold">
                👁️ View Only
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-2">
            Financial tracking, budgets, and asset cost analysis
            {!canEdit && <span className="text-yellow-600 font-semibold"> (Read-Only Access)</span>}
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
            {canEdit && (
              <button
                onClick={() => setShowAddMaintenance(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
              >
                + Add Maintenance Cost
              </button>
            )}
          </div>

          {showAddMaintenance && (
            <MaintenanceForm
              onSubmit={handleAddMaintenance}
              onCancel={() => setShowAddMaintenance(false)}
            />
          )}

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
            {maintenanceCosts.length === 0 ? (
              <p className="text-gray-500 text-center py-12">No maintenance records yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3 text-left font-semibold">Asset</th>
                      <th className="px-4 py-3 text-left font-semibold">Type</th>
                      <th className="px-4 py-3 text-left font-semibold">Description</th>
                      <th className="px-4 py-3 text-left font-semibold">Provider</th>
                      <th className="px-4 py-3 text-right font-semibold">Cost</th>
                      <th className="px-4 py-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceCosts.map((cost) => (
                      <tr key={cost.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{new Date(cost.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-medium">{cost.asset_name || cost.asset_id}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                            {cost.asset_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{cost.description || '-'}</td>
                        <td className="px-4 py-3 text-sm">{cost.service_provider || '-'}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">
                          {formatCurrency(cost.cost)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {canEdit ? (
                            <button
                              onClick={() => handleDeleteMaintenance(cost.id)}
                              className="text-red-600 hover:text-red-800 font-semibold"
                            >
                              🗑️ Delete
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
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
            <h2 className="text-2xl font-bold">Budget Planning ({new Date().getFullYear()})</h2>
            {canEdit && (
              <button
                onClick={() => setShowAddBudget(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
              >
                + Add Budget
              </button>
            )}
          </div>

          {showAddBudget && (
            <BudgetForm
              onSubmit={async (formData) => {
                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch(`${API_BASE_URL}/api/budgets`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      id: Date.now().toString(),
                      ...formData,
                      year: new Date().getFullYear()
                    })
                  });
                  if (!res.ok) throw new Error('Failed to add budget');
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
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    asset_type: 'PC',
    asset_id: '',
    asset_name: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    service_provider: '',
    category: 'Repair',
    department: ''
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
      <h3 className="text-xl font-bold mb-4">Add Maintenance Cost</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
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
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Asset ID*</label>
          <input
            type="text"
            value={formData.asset_id}
            onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
            className="w-full px-3 py-2 border rounded"
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
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Service Provider</label>
          <input
            type="text"
            value={formData.service_provider}
            onChange={(e) => setFormData({ ...formData, service_provider: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Department</label>
          <input
            type="text"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-semibold mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            rows={3}
          />
        </div>
        <div className="col-span-2 flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Add Maintenance Cost
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

