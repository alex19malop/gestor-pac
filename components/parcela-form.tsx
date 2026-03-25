"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Parcela } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

interface ParcelaFormProps {
  userId: string
  parcela?: Parcela | null
  onSuccess: () => void
  onCancel: () => void
}

export function ParcelaForm({ userId, parcela, onSuccess, onCancel }: ParcelaFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    nombre_parcela: parcela?.nombre_parcela || "",
    municipio: parcela?.municipio || "",
    pol: parcela?.pol?.toString() || "",
    par: parcela?.par?.toString() || "",
    rec: parcela?.rec?.toString() || "",
    sup_total: parcela?.sup_total?.toString() || "",
    sup_srr: parcela?.sup_srr?.toString() || "",
    sr: parcela?.sr || "",
    lab_anterior: parcela?.lab_anterior || "",
    cultivo_anterior: parcela?.cultivo_anterior || "",
    cultivo_actual: parcela?.cultivo_actual || "",
    variedad: parcela?.variedad || "",
    laboreo_actual: parcela?.laboreo_actual || "",
    notas: parcela?.notas || "",
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const dataToSave = {
      user_id: userId,
      nombre_parcela: formData.nombre_parcela || null,
      municipio: formData.municipio || null,
      pol: formData.pol ? parseInt(formData.pol) : null,
      par: formData.par ? parseInt(formData.par) : null,
      rec: formData.rec ? parseInt(formData.rec) : null,
      sup_total: formData.sup_total ? parseFloat(formData.sup_total) : null,
      sup_srr: formData.sup_srr ? parseFloat(formData.sup_srr) : null,
      sr: formData.sr || null,
      lab_anterior: formData.lab_anterior || null,
      cultivo_anterior: formData.cultivo_anterior || null,
      cultivo_actual: formData.cultivo_actual || null,
      variedad: formData.variedad || null,
      laboreo_actual: formData.laboreo_actual || null,
      notas: formData.notas || null,
      updated_at: new Date().toISOString(),
    }

    try {
      if (parcela) {
        const { error } = await supabase
          .from("parcelas")
          .update(dataToSave)
          .eq("id", parcela.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("parcelas").insert(dataToSave)
        if (error) throw error
      }
      onSuccess()
    } catch (err) {
      setError("Error al guardar la parcela. Inténtelo de nuevo.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FieldGroup>
        {/* Basic Info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel className="text-lg font-semibold">
              Nombre de Parcela
            </FieldLabel>
            <Input
              name="nombre_parcela"
              value={formData.nombre_parcela}
              onChange={handleChange}
              placeholder="Ej: Finca Norte"
              className="h-14 text-lg px-4 border-2"
            />
          </Field>
          <Field>
            <FieldLabel className="text-lg font-semibold">Municipio</FieldLabel>
            <Input
              name="municipio"
              value={formData.municipio}
              onChange={handleChange}
              placeholder="Ej: Villamayor"
              className="h-14 text-lg px-4 border-2"
            />
          </Field>
        </div>

        {/* Reference Numbers */}
        <div className="grid gap-4 grid-cols-3">
          <Field>
            <FieldLabel className="text-lg font-semibold">Polígono</FieldLabel>
            <Input
              name="pol"
              type="number"
              value={formData.pol}
              onChange={handleChange}
              placeholder="Pol"
              className="h-14 text-lg px-4 border-2"
            />
          </Field>
          <Field>
            <FieldLabel className="text-lg font-semibold">Parcela</FieldLabel>
            <Input
              name="par"
              type="number"
              value={formData.par}
              onChange={handleChange}
              placeholder="Par"
              className="h-14 text-lg px-4 border-2"
            />
          </Field>
          <Field>
            <FieldLabel className="text-lg font-semibold">Recinto</FieldLabel>
            <Input
              name="rec"
              type="number"
              value={formData.rec}
              onChange={handleChange}
              placeholder="Rec"
              className="h-14 text-lg px-4 border-2"
            />
          </Field>
        </div>

        {/* Surfaces */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel className="text-lg font-semibold">
              Superficie Total (ha)
            </FieldLabel>
            <Input
              name="sup_total"
              type="number"
              step="0.01"
              value={formData.sup_total}
              onChange={handleChange}
              placeholder="Ej: 5.25"
              className="h-14 text-lg px-4 border-2"
            />
          </Field>
          <Field>
            <FieldLabel className="text-lg font-semibold">
              Superficie SRR (ha)
            </FieldLabel>
            <Input
              name="sup_srr"
              type="number"
              step="0.01"
              value={formData.sup_srr}
              onChange={handleChange}
              placeholder="Ej: 4.80"
              className="h-14 text-lg px-4 border-2"
            />
          </Field>
        </div>

        {/* SR */}
        <Field>
          <FieldLabel className="text-lg font-semibold">
            Sistema de Referencia (SR)
          </FieldLabel>
          <Input
            name="sr"
            value={formData.sr}
            onChange={handleChange}
            placeholder="Ej: SIGPAC"
            className="h-14 text-lg px-4 border-2"
          />
        </Field>

        {/* Crops */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel className="text-lg font-semibold">
              Cultivo Anterior
            </FieldLabel>
            <Input
              name="cultivo_anterior"
              value={formData.cultivo_anterior}
              onChange={handleChange}
              placeholder="Ej: Trigo"
              className="h-14 text-lg px-4 border-2"
            />
          </Field>
          <Field>
            <FieldLabel className="text-lg font-semibold">
              Laboreo Anterior
            </FieldLabel>
            <Input
              name="lab_anterior"
              value={formData.lab_anterior}
              onChange={handleChange}
              placeholder="Ej: Siembra directa"
              className="h-14 text-lg px-4 border-2"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel className="text-lg font-semibold">
              Cultivo Actual
            </FieldLabel>
            <Input
              name="cultivo_actual"
              value={formData.cultivo_actual}
              onChange={handleChange}
              placeholder="Ej: Cebada"
              className="h-14 text-lg px-4 border-2"
            />
          </Field>
          <Field>
            <FieldLabel className="text-lg font-semibold">Variedad</FieldLabel>
            <Input
              name="variedad"
              value={formData.variedad}
              onChange={handleChange}
              placeholder="Ej: Hispánica"
              className="h-14 text-lg px-4 border-2"
            />
          </Field>
        </div>

        <Field>
          <FieldLabel className="text-lg font-semibold">
            Laboreo Actual
          </FieldLabel>
          <Input
            name="laboreo_actual"
            value={formData.laboreo_actual}
            onChange={handleChange}
            placeholder="Ej: Laboreo tradicional"
            className="h-14 text-lg px-4 border-2"
          />
        </Field>

        {/* Notes */}
        <Field>
          <FieldLabel className="text-lg font-semibold">Notas</FieldLabel>
          <Textarea
            name="notas"
            value={formData.notas}
            onChange={handleChange}
            placeholder="Observaciones adicionales..."
            rows={3}
            className="text-lg px-4 py-3 border-2"
          />
        </Field>
      </FieldGroup>

      {error && (
        <div className="p-4 bg-destructive/10 border-2 border-destructive rounded-lg">
          <p className="text-lg text-destructive font-medium">{error}</p>
        </div>
      )}

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-14 text-lg font-bold border-2"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1 h-14 text-lg font-bold"
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner className="mr-2" />
              Guardando...
            </>
          ) : parcela ? (
            "Guardar Cambios"
          ) : (
            "Crear Parcela"
          )}
        </Button>
      </div>
    </form>
  )
}
