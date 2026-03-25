"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Parcela } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Upload, FileText, Check, AlertCircle } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

interface ImportExportPanelProps {
  parcelas: Parcela[]
  userId: string
  onImportSuccess: () => void
}

export function ImportExportPanel({
  parcelas,
  userId,
  onImportSuccess,
}: ImportExportPanelProps) {
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const exportToCSV = () => {
    if (parcelas.length === 0) {
      alert("No hay parcelas para exportar")
      return
    }

    const headers = [
      "nombre_parcela",
      "municipio",
      "pol",
      "par",
      "rec",
      "sup_total",
      "sup_srr",
      "sr",
      "lab_anterior",
      "cultivo_anterior",
      "cultivo_actual",
      "variedad",
      "laboreo_actual",
      "notas",
    ]

    const csvContent = [
      headers.join(";"),
      ...parcelas.map((p) =>
        headers
          .map((h) => {
            const value = p[h as keyof Parcela]
            if (value === null || value === undefined) return ""
            // Escape semicolons and quotes in values
            const strValue = String(value)
            if (strValue.includes(";") || strValue.includes('"')) {
              return `"${strValue.replace(/"/g, '""')}"`
            }
            return strValue
          })
          .join(";")
      ),
    ].join("\n")

    // Add BOM for Excel to recognize UTF-8
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `parcelas_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const importFromCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter((line) => line.trim())

      if (lines.length < 2) {
        throw new Error("El archivo está vacío o no tiene datos")
      }

      // Parse header to determine separator
      const firstLine = lines[0]
      const separator = firstLine.includes(";") ? ";" : ","
      const headers = parseCSVLine(firstLine, separator)

      const parcelasToImport: Partial<Parcela>[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i], separator)
        if (values.length === 0 || values.every((v) => !v)) continue

        const parcela: Record<string, string | number | null> = {
          user_id: userId,
        }

        headers.forEach((header, index) => {
          const value = values[index]?.trim() || null
          const normalizedHeader = header.trim().toLowerCase()

          // Map common header variations
          const headerMap: Record<string, string> = {
            nombre_parcela: "nombre_parcela",
            nombre: "nombre_parcela",
            municipio: "municipio",
            pol: "pol",
            poligono: "pol",
            par: "par",
            parcela: "par",
            rec: "rec",
            recinto: "rec",
            sup_total: "sup_total",
            superficie_total: "sup_total",
            sup_srr: "sup_srr",
            superficie_srr: "sup_srr",
            sr: "sr",
            lab_anterior: "lab_anterior",
            laboreo_anterior: "lab_anterior",
            cultivo_anterior: "cultivo_anterior",
            cultivo_actual: "cultivo_actual",
            variedad: "variedad",
            laboreo_actual: "laboreo_actual",
            notas: "notas",
            observaciones: "notas",
          }

          const mappedHeader = headerMap[normalizedHeader]
          if (mappedHeader && value) {
            if (["pol", "par", "rec"].includes(mappedHeader)) {
              parcela[mappedHeader] = parseInt(value) || null
            } else if (["sup_total", "sup_srr"].includes(mappedHeader)) {
              // Handle both comma and dot as decimal separator
              parcela[mappedHeader] =
                parseFloat(value.replace(",", ".")) || null
            } else {
              parcela[mappedHeader] = value
            }
          }
        })

        parcelasToImport.push(parcela as Partial<Parcela>)
      }

      if (parcelasToImport.length === 0) {
        throw new Error("No se encontraron parcelas válidas en el archivo")
      }

      const { error } = await supabase.from("parcelas").insert(parcelasToImport)

      if (error) throw error

      setImportResult({
        success: true,
        message: `Se importaron ${parcelasToImport.length} parcelas correctamente`,
      })
      onImportSuccess()
    } catch (err) {
      setImportResult({
        success: false,
        message:
          err instanceof Error ? err.message : "Error al importar el archivo",
      })
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Helper to parse CSV line handling quoted values
  const parseCSVLine = (line: string, separator: string): string[] => {
    const values: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === separator && !inQuotes) {
        values.push(current)
        current = ""
      } else {
        current += char
      }
    }
    values.push(current)
    return values
  }

  return (
    <Card className="mb-6 border-2 border-border">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          Importar / Exportar Parcelas
        </CardTitle>
        <CardDescription className="text-lg">
          Exporte sus datos a CSV o importe desde un archivo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Export */}
          <div className="p-4 bg-secondary rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Download className="w-8 h-8 text-primary" />
              <div>
                <h3 className="text-lg font-bold">Exportar a CSV</h3>
                <p className="text-base text-muted-foreground">
                  Descargue todas sus parcelas
                </p>
              </div>
            </div>
            <Button
              onClick={exportToCSV}
              variant="outline"
              className="w-full h-14 text-lg font-bold border-2"
              disabled={parcelas.length === 0}
            >
              <FileText className="w-5 h-5 mr-2" />
              Descargar CSV ({parcelas.length} parcelas)
            </Button>
          </div>

          {/* Import */}
          <div className="p-4 bg-secondary rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Upload className="w-8 h-8 text-primary" />
              <div>
                <h3 className="text-lg font-bold">Importar desde CSV</h3>
                <p className="text-base text-muted-foreground">
                  Añada parcelas desde un archivo
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={importFromCSV}
              className="hidden"
            />
            <Button
              onClick={handleFileSelect}
              variant="outline"
              className="w-full h-14 text-lg font-bold border-2"
              disabled={importing}
            >
              {importing ? (
                <>
                  <Spinner className="mr-2" />
                  Importando...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 mr-2" />
                  Seleccionar Archivo
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Import Result */}
        {importResult && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 ${
              importResult.success
                ? "bg-primary/10 border-2 border-primary"
                : "bg-destructive/10 border-2 border-destructive"
            }`}
          >
            {importResult.success ? (
              <Check className="w-6 h-6 text-primary shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-destructive shrink-0" />
            )}
            <p
              className={`text-lg font-medium ${
                importResult.success ? "text-primary" : "text-destructive"
              }`}
            >
              {importResult.message}
            </p>
          </div>
        )}

        {/* Help Text */}
        <div className="p-4 bg-muted rounded-xl">
          <p className="text-base text-muted-foreground">
            <strong>Formato CSV:</strong> El archivo debe tener cabeceras en la
            primera fila. Se aceptan separadores punto y coma (;) o coma (,).
            Columnas soportadas: nombre_parcela, municipio, pol, par, rec,
            sup_total, sup_srr, sr, lab_anterior, cultivo_anterior,
            cultivo_actual, variedad, laboreo_actual, notas.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
