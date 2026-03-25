"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import type { Parcela } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ParcelaCard } from "@/components/parcela-card"
import { ParcelaForm } from "@/components/parcela-form"
import { ImportExportPanel } from "@/components/import-export-panel"
import { Sprout, Plus, LogOut, FileSpreadsheet, X } from "lucide-react"

interface DashboardContentProps {
  user: User
  initialParcelas: Parcela[]
}

export function DashboardContent({ user, initialParcelas }: DashboardContentProps) {
  const [parcelas, setParcelas] = useState<Parcela[]>(initialParcelas)
  const [showForm, setShowForm] = useState(false)
  const [editingParcela, setEditingParcela] = useState<Parcela | null>(null)
  const [showImportExport, setShowImportExport] = useState(false)
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b-2 border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <Sprout className="w-6 h-6 text-primary-foreground" />
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
              className="h-12 px-4 text-lg font-semibold border-2"
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
            className="h-16 px-6 text-xl font-bold flex-1 min-w-[200px]"
          >
            <Plus className="w-6 h-6 mr-2" />
            Nueva Parcela
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowImportExport(!showImportExport)}
            className="h-16 px-6 text-xl font-bold flex-1 min-w-[200px] border-2 border-border"
          >
            <FileSpreadsheet className="w-6 h-6 mr-2" />
            {showImportExport ? "Ocultar" : "Importar / Exportar"}
          </Button>
        </div>

        {/* Import/Export Panel */}
        {showImportExport && (
          <ImportExportPanel
            parcelas={parcelas}
            userId={user.id}
            onImportSuccess={refreshParcelas}
          />
        )}

        {/* Parcela Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4">
            <Card className="w-full max-w-2xl my-8 border-2 border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-bold">
                  {editingParcela ? "Editar Parcela" : "Nueva Parcela"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFormClose}
                  className="h-12 w-12"
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

        {/* Parcelas List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">
            Mis Parcelas ({parcelas.length})
          </h2>

          {parcelas.length === 0 ? (
            <Card className="border-2 border-dashed border-border">
              <CardContent className="py-12 text-center">
                <Sprout className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-xl text-muted-foreground mb-4">
                  No tiene parcelas registradas
                </p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="h-14 px-6 text-lg font-bold"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Añadir Primera Parcela
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {parcelas.map((parcela) => (
                <ParcelaCard
                  key={parcela.id}
                  parcela={parcela}
                  onEdit={() => handleEdit(parcela)}
                  onDelete={() => handleDelete(parcela.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
