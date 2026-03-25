"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import type { Parcela } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ParcelaCard } from "@/components/parcela-card"
import { ParcelaForm } from "@/components/parcela-form"
import { ImportExportPanel } from "@/components/import-export-panel"
import { MetricsPanel } from "@/components/metrics-panel"
import {
  Plus,
  LogOut,
  FileSpreadsheet,
  X,
  Search,
  LayoutGrid,
  BarChart3,
} from "lucide-react"

interface DashboardContentProps {
  user: User
  initialParcelas: Parcela[]
}

export function DashboardContent({ user, initialParcelas }: DashboardContentProps) {
  const [parcelas, setParcelas] = useState<Parcela[]>(initialParcelas)
  const [showForm, setShowForm] = useState(false)
  const [editingParcela, setEditingParcela] = useState<Parcela | null>(null)
  const [showImportExport, setShowImportExport] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const refreshParcelas = async () => {
    const { data } = await supabase
      .from("parcelas")
      .select("*")
      .order("created_at", { ascending: false })
    if (data) {
      setParcelas(data)
    }
  }

  const handleEdit = (parcela: Parcela) => {
    setEditingParcela(parcela)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("¿Está seguro de que quiere eliminar esta parcela?")
    if (!confirmed) return

    await supabase.from("parcelas").delete().eq("id", id)
    refreshParcelas()
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingParcela(null)
  }

  const handleFormSuccess = () => {
    handleFormClose()
    refreshParcelas()
  }

  // --- Search filtering ---
  const filteredParcelas = useMemo(() => {
    if (!searchQuery.trim()) return parcelas
    const q = searchQuery.toLowerCase().trim()
    return parcelas.filter((p) => {
      const fields = [
        p.nombre_parcela,
        p.municipio,
        p.cultivo_actual,
        p.cultivo_anterior,
        p.variedad,
        p.laboreo_actual,
        p.notas,
        p.pol?.toString(),
        p.par?.toString(),
      ]
      return fields.some((f) => f?.toLowerCase().includes(q))
    })
  }, [parcelas, searchQuery])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-lg border-b-2 border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg shadow-primary/20 ring-2 ring-primary/20">
                <img
                  src="/hija.jpeg"
                  alt="Foto familiar"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Gestor PAC</h1>
                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {user.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="h-12 px-4 text-lg font-semibold border-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all duration-200"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Button
            onClick={() => setShowForm(true)}
            className="h-16 px-6 text-xl font-bold flex-1 min-w-[200px] shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
          >
            <Plus className="w-6 h-6 mr-2" />
            Nueva Parcela
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowImportExport(!showImportExport)}
            className="h-16 px-6 text-xl font-bold flex-1 min-w-[200px] border-2 border-border hover:border-primary/30 transition-all duration-300"
          >
            <FileSpreadsheet className="w-6 h-6 mr-2" />
            {showImportExport ? "Ocultar" : "Importar / Exportar"}
          </Button>
        </div>

        {/* Import/Export Panel */}
        {showImportExport && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <ImportExportPanel
              parcelas={parcelas}
              userId={user.id}
              onImportSuccess={refreshParcelas}
            />
          </div>
        )}

        {/* Parcela Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4">
            <Card className="w-full max-w-2xl my-8 border-2 border-border shadow-2xl animate-in zoom-in-95 duration-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-bold">
                  {editingParcela ? "Editar Parcela" : "Nueva Parcela"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFormClose}
                  className="h-12 w-12 hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <X className="w-6 h-6" />
                </Button>
              </CardHeader>
              <CardContent>
                <ParcelaForm
                  userId={user.id}
                  parcela={editingParcela}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormClose}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs: Parcelas / Métricas */}
        <Tabs defaultValue="parcelas" className="space-y-6">
          <TabsList className="h-14 p-1 bg-muted/80 rounded-xl w-full sm:w-auto">
            <TabsTrigger
              value="parcelas"
              className="h-12 px-6 text-base font-semibold gap-2 rounded-lg data-[state=active]:shadow-md transition-all"
            >
              <LayoutGrid className="w-5 h-5" />
              Parcelas
            </TabsTrigger>
            <TabsTrigger
              value="metricas"
              className="h-12 px-6 text-base font-semibold gap-2 rounded-lg data-[state=active]:shadow-md transition-all"
            >
              <BarChart3 className="w-5 h-5" />
              Métricas
            </TabsTrigger>
          </TabsList>

          {/* Parcelas Tab */}
          <TabsContent value="parcelas" className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nombre, municipio, cultivo, polígono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pl-12 pr-4 text-lg border-2 rounded-xl bg-card focus:border-primary transition-colors"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                {searchQuery
                  ? `${filteredParcelas.length} de ${parcelas.length} parcelas`
                  : `Mis Parcelas (${parcelas.length})`}
              </h2>
            </div>

            {/* Parcelas Grid */}
            {filteredParcelas.length === 0 ? (
              <Card className="border-2 border-dashed border-border">
                <CardContent className="py-12 text-center">
                  <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-xl text-muted-foreground mb-4">
                    {searchQuery
                      ? "No se encontraron parcelas con esa búsqueda"
                      : "No tiene parcelas registradas"}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => setShowForm(true)}
                      className="h-14 px-6 text-lg font-bold shadow-lg shadow-primary/20"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Añadir Primera Parcela
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredParcelas.map((parcela) => (
                  <ParcelaCard
                    key={parcela.id}
                    parcela={parcela}
                    onEdit={() => handleEdit(parcela)}
                    onDelete={() => handleDelete(parcela.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Métricas Tab */}
          <TabsContent value="metricas">
            <MetricsPanel parcelas={parcelas} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
