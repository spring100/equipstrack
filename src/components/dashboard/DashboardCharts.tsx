import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  AreaChart, Area, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(142, 76%, 36%)",
  "hsl(262, 52%, 47%)",
  "hsl(0, 72%, 51%)",
  "hsl(190, 80%, 42%)",
  "hsl(var(--muted-foreground))",
];

interface ChartData {
  name: string;
  value: number;
}

interface MaintenanceChartData {
  month: string;
  planifiées: number;
  terminées: number;
}

interface DashboardChartsProps {
  categoryData: ChartData[];
  siteData: ChartData[];
  maintenanceData: MaintenanceChartData[];
}

const DashboardCharts = ({ categoryData, siteData, maintenanceData }: DashboardChartsProps) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
    {/* Pie: categories */}
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">Répartition par catégorie</h3>
      {categoryData.length > 0 ? (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={categoryData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={95}
              innerRadius={50}
              paddingAngle={2}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {categoryData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-muted-foreground py-12 text-center">Aucun équipement</p>
      )}
    </div>

    {/* Bar: sites */}
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">Équipements par site</h3>
      {siteData.length > 0 ? (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={siteData}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-muted-foreground py-12 text-center">Aucun site</p>
      )}
    </div>

    {/* Area: maintenance over 6 months */}
    <div className="bg-card border border-border rounded-lg p-4 lg:col-span-2">
      <h3 className="text-sm font-semibold text-foreground mb-4">Maintenances sur 6 mois</h3>
      {maintenanceData.length > 0 ? (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={maintenanceData}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="planifiées"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary) / 0.15)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="terminées"
              stroke="hsl(var(--accent))"
              fill="hsl(var(--accent) / 0.15)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-muted-foreground py-12 text-center">Aucune donnée de maintenance</p>
      )}
    </div>
  </div>
);

export default DashboardCharts;
