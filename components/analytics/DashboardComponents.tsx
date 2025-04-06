import React from 'react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, 
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { formatEther, formatUnits } from 'ethers/lib/utils';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

/**
 * Transaction Volume Chart
 * Shows the number of transactions over time
 */
export function TransactionVolumeChart({ data }: { data: any[] }) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-medium mb-4">Transaction Volume</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => [`${value} txns`, 'Volume']}
          />
          <Area 
            type="monotone" 
            dataKey="count" 
            stroke="#8884d8" 
            fill="#8884d8" 
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Gas Usage Chart
 * Shows gas usage over time
 */
export function GasUsageChart({ data }: { data: any[] }) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-medium mb-4">Gas Usage</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip 
            formatter={(value: string) => [`${parseFloat(value).toFixed(2)} Gwei`, 'Gas Price']}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="baseFee" 
            stroke="#8884d8" 
            name="Base Fee" 
          />
          <Line 
            type="monotone" 
            dataKey="priorityFee" 
            stroke="#82ca9d" 
            name="Priority Fee" 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Token Distribution Chart
 * Shows the distribution of tokens by type
 */
export function TokenDistributionChart({ data }: { data: any[] }) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-medium mb-4">Token Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value}`, 'Amount']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Contract Activity Chart
 * Shows activity for specific contracts
 */
export function ContractActivityChart({ data }: { data: any[] }) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-medium mb-4">Contract Activity</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="calls" name="Function Calls" fill="#8884d8" />
          <Bar dataKey="uniqueUsers" name="Unique Users" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * User Activity Heatmap
 * Shows user activity by hour and day
 */
export function UserActivityHeatmap({ data }: { data: any[] }) {
  // Process data for heatmap format
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-medium mb-4">User Activity Heatmap</h3>
      <div className="grid grid-cols-25 gap-1">
        {/* Header row with hours */}
        <div className="col-span-1"></div>
        {hours.map(hour => (
          <div key={hour} className="text-xs text-center">
            {hour}
          </div>
        ))}
        
        {/* Data rows */}
        {days.map((day, dayIndex) => (
          <React.Fragment key={day}>
            <div className="text-xs">{day}</div>
            {hours.map(hour => {
              const value = data.find(d => d.day === dayIndex && d.hour === hour)?.count || 0;
              const opacity = Math.min(0.1 + (value / 100) * 0.9, 1);
              return (
                <div 
                  key={`${day}-${hour}`}
                  className="h-4 w-4 rounded-sm"
                  style={{ backgroundColor: `rgba(136, 132, 216, ${opacity})` }}
                  title={`${day} ${hour}:00 - ${value} transactions`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/**
 * Network Stats Card
 * Shows key network statistics
 */
export function NetworkStatsCard({ stats }: { stats: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h3 className="text-sm font-medium text-gray-500">Gas Price</h3>
        <p className="text-2xl font-semibold">{stats.gasPrice} Gwei</p>
      </div>
      
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h3 className="text-sm font-medium text-gray-500">Block Height</h3>
        <p className="text-2xl font-semibold">{stats.blockHeight.toLocaleString()}</p>
      </div>
      
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h3 className="text-sm font-medium text-gray-500">Transactions Today</h3>
        <p className="text-2xl font-semibold">{stats.dailyTxns.toLocaleString()}</p>
      </div>
      
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
        <p className="text-2xl font-semibold">{stats.activeUsers.toLocaleString()}</p>
      </div>
    </div>
  );
}

/**
 * Blockchain Dashboard
 * Main dashboard component combining all charts
 */
export function BlockchainDashboard() {
  // Example data - in a real app, this would come from API calls
  const txVolumeData = Array.from({ length: 30 }, (_, i) => ({
    date: `2023-${(i + 1).toString().padStart(2, '0')}-01`,
    count: Math.floor(Math.random() * 1000) + 500
  }));
  
  const gasData = Array.from({ length: 30 }, (_, i) => ({
    date: `2023-${(i + 1).toString().padStart(2, '0')}-01`,
    baseFee: (Math.random() * 30 + 10).toFixed(2),
    priorityFee: (Math.random() * 5 + 1).toFixed(2)
  }));
  
  const tokenDistData = [
    { name: 'ERC-20', value: 65 },
    { name: 'ERC-721', value: 25 },
    { name: 'ERC-1155', value: 10 }
  ];
  
  const contractActivityData = [
    { name: 'Swap', calls: 1200, uniqueUsers: 450 },
    { name: 'Bridge', calls: 800, uniqueUsers: 320 },
    { name: 'Stake', calls: 950, uniqueUsers: 280 },
    { name: 'Mint', calls: 1500, uniqueUsers: 650 }
  ];
  
  const userActivityData = Array.from({ length: 7 * 24 }, (_, i) => ({
    day: Math.floor(i / 24),
    hour: i % 24,
    count: Math.floor(Math.random() * 100)
  }));
  
  const networkStats = {
    gasPrice: '25.4',
    blockHeight: 18235492,
    dailyTxns: 125438,
    activeUsers: 28459
  };
  
  return (
    <div className="space-y-6">
      <NetworkStatsCard stats={networkStats} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TransactionVolumeChart data={txVolumeData} />
        <GasUsageChart data={gasData} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TokenDistributionChart data={tokenDistData} />
        <ContractActivityChart data={contractActivityData} />
      </div>
      
      <UserActivityHeatmap data={userActivityData} />
    </div>
  );
} 