"use client"

import type { Parcela } from "@/lib/types"
import { parseMunicipio } from "@/lib/sigpac"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Wheat, Ruler, BarChart3, TrendingUp, Sprout } from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface MetricsPanelProps {
  parcelas: Parcela[]
}

const CHART_COLORS = [
  "oklch(0.55 0.15 145)",  // green
  "oklch(0.55 0.12 75)",   // amber
  "oklch(0.50 0.10 200)",  // blue
  "oklch(0.60 0.15 50)",   // orange
  "oklch(0.55 0.22 25)",   // red
  "oklch(0.60 0.12 300)",  // purple
  "oklch(0.65 0.10 170)",  // teal
  "oklch(0.50 0.15 330)",  // pink
]

export function MetricsPanel({ parcelas }: MetricsPanelProps) {
  if (parcelas.length === 0) {
    return (
      <Card className="border-2 border-dashed border-border">
        <CardContent className="py-16 text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-xl text-muted-foreground">
            Añada parcelas para ver las estadísticas
          </p>
        </CardContent>
      </Card>
    )
  }

  // --- Compute metrics ---
  const totalParcelas = parcelas.length
  const supTotalSum = parcelas.reduce((sum, p) => sum + (p.sup_total || 0), 0)
  const supSrrSum = parcelas.reduce((sum, p) => sum + (p.sup_srr || 0), 0)
  const avgSup = totalParcelas > 0 ? supTotalSum / totalParcelas : 0

  // Unique municipios
  const municipios = new Set(
    parcelas.map((p) => parseMunicipio(p.municipio).nombre).filter(Boolean)
  )

  // Cultivo distribution
  const cultivoCount: Record<string, number> = {}
  parcelas.forEach((p) => {
    const cultivo = p.cultivo_actual || "Sin cultivo"
    cultivoCount[cultivo] = (cultivoCount[cultivo] || 0) + 1
  })
  const cultivoData = Object.entries(cultivoCount)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }))

  // Superficie by municipio
  const supByMunicipio: Record<string, number> = {}
  parcelas.forEach((p) => {
    const nombre = parseMunicipio(p.municipio).nombre || "Sin municipio"
    supByMunicipio[nombre] = (supByMunicipio[nombre] || 0) + (p.sup_total || 0)
  })
  const supMunicipioData = Object.entries(supByMunicipio)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))

  // Laboreo distribution
  const laboreoCount: Record<string, number> = {}
  parcelas.forEach((p) => {
    const lab = p.laboreo_actual || "Sin especificar"
    laboreoCount[lab] = (laboreoCount[lab] || 0) + 1
  })
  const laboreoData = Object.entries(laboreoCount)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<Sprout className="w-6 h-6" />}
          label="Total Parcelas"
          value={totalParcelas.toString()}
          color="text-primary"
        />
        <SummaryCard
          icon={<Ruler className="w-6 h-6" />}
          label="Superficie Total"
          value={`${supTotalSum.toFixed(2)} ha`}
          color="text-chart-2"
        />
        <SummaryCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Sup. Media"
          value={`${avgSup.toFixed(2)} ha`}
          color="text-chart-3"
        />
        <SummaryCard
          icon={<MapPin className="w-6 h-6" />}
          label="Municipios"
          value={municipios.size.toString()}
          color="text-chart-4"
        />
      </div>

      {/* Extra summary row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          icon={<Wheat className="w-6 h-6" />}
          label="Cultivos Distintos"
          value={Object.keys(cultivoCount).filter(k => k !== "Sin cultivo").length.toString()}
          color="text-primary"
        />
        <SummaryCard
          icon={<Ruler className="w-6 h-6" />}
          label="Superficie SRR Total"
          value={`${supSrrSum.toFixed(2)} ha`}
          color="text-chart-2"
        />
        <SummaryCard
          icon={<BarChart3 className="w-6 h-6" />}
          label="Tipos de Laboreo"
          value={Object.keys(laboreoCount).filter(k => k !== "Sin especificar").length.toString()}
          color="text-chart-3"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cultivo Pie Chart */}
        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Wheat className="w-5 h-5 text-primary" />
              Distribución de Cultivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cultivoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  labelLine={true}
                >
                  {cultivoData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} parcelas`, "Cantidad"]}
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "2px solid var(--border)",
                    background: "var(--card)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Superficie by Municipio Bar Chart */}
        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Superficie por Municipio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={supMunicipioData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" unit=" ha" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value} ha`, "Superficie"]}
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "2px solid var(--border)",
                    background: "var(--card)",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="oklch(0.45 0.15 145)"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Laboreo Distribution */}
      <Card className="border-2 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Tipos de Laboreo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={laboreoData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [`${value} parcelas`, "Cantidad"]}
                contentStyle={{
                  borderRadius: "0.75rem",
                  border: "2px solid var(--border)",
                  background: "var(--card)",
                }}
              />
              <Legend />
              <Bar
                dataKey="value"
                name="Parcelas"
                fill="oklch(0.55 0.12 75)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <Card className="border-2 border-border hover:border-primary/30 transition-all duration-300 hover:shadow-md">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className={`${color} opacity-80`}>{icon}</div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground truncate">{label}</p>
            <p className="text-2xl font-bold text-foreground truncate">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
