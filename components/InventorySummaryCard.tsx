import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChartData } from '../types';

interface InventorySummaryCardProps {
  title: string;
  data: PieChartData[];
  icon: React.ReactNode;
}

const COLORS = ['#0ea5e9', '#f97316']; // sky-500, orange-500 for Used, In Stock

export const InventorySummaryCard: React.FC<InventorySummaryCardProps> = ({ title, data, icon }) => {
  const used = data.find(d => d.name === 'Used')?.value ?? 0;
  const inStock = data.find(d => d.name === 'In Stock')?.value ?? 0;
  const total = used + inStock;

  const chartData = total > 0 ? data : [{ name: 'No Data', value: 1 }];
  const chartColors = total > 0 ? COLORS : ['#e5e7eb']; // gray-200 for no data

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col h-full">
      <div className="flex items-center mb-4">
        <div className="bg-gray-100 text-gray-600 p-2 rounded-lg mr-3">{icon}</div>
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-2 text-sm">
          <p className="text-gray-500">Total Items:</p>
          <p className="font-bold text-2xl text-gray-800">{total}</p>
          <div className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-sky-500 mr-2"></span>
            <span className="text-gray-600">Used: {used}</span>
          </div>
          <div className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-orange-500 mr-2"></span>
            <span className="text-gray-600">In Stock: {inStock}</span>
          </div>
        </div>
        <div className="w-24 h-24">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={40}
                fill="#8884d8"
                paddingAngle={total > 0 ? 5 : 0}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              {total > 0 && <Tooltip
                formatter={(value: number, name: string) => [`${value} items`, name]}
                contentStyle={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    fontSize: '12px',
                    padding: '4px 8px'
                }}
              />}
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};