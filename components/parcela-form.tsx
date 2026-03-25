"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Parcela } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import {
  MapPin,
  Wheat,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react"

interface ParcelaFormProps {
  userId: string
  parcela?: Parcela | null
  onSuccess: () => void
  onCancel: () => void
}

const STEPS = [
  { id: 0, label: "Ubicación", icon: MapPin },
  { id: 1, label: "Cultivos", icon: Wheat },
  { id: 2, label: "Confirmar", icon: Check },
] as const

export function ParcelaForm({ userId, parcela, onSuccess, onCancel }: ParcelaFormProps) {
  const [step, setStep] = useState(0)
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

  const handleSubmit = async () => {
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

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const prev = () => setStep((s) => Math.max(s - 1, 0))

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const isActive = step === i
          const isDone = step > i
          return (
            <div key={s.id} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => setStep(i)}
                className={`
                  flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                  ${isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : isDone
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mx-1" />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[280px]">
        {/* Step 1: Ubicación + Referencia + Superficies */}
        {step === 0 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel className="text-base font-semibold">
                    Nombre de Parcela
                  </FieldLabel>
                  <Input
                    name="nombre_parcela"
                    value={formData.nombre_parcela}
                    onChange={handleChange}
                    placeholder="Ej: Finca Norte"
                    className="h-12 text-base px-4 border-2"
                    autoFocus
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-base font-semibold">Municipio</FieldLabel>
                  <Input
                    name="municipio"
                    value={formData.municipio}
                    onChange={handleChange}
                    placeholder="Ej: 42033 ALMAZUL"
                    className="h-12 text-base px-4 border-2"
                  />
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Código + nombre (ej: 42033 ALMAZUL)
                  </p>
                </Field>
              </div>

              <div className="grid gap-4 grid-cols-3">
                <Field>
                  <FieldLabel className="text-base font-semibold">Polígono</FieldLabel>
                  <Input
                    name="pol"
                    type="number"
                    value={formData.pol}
                    onChange={handleChange}
                    placeholder="Pol"
                    className="h-12 text-base px-4 border-2"
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-base font-semibold">Parcela</FieldLabel>
                  <Input
                    name="par"
                    type="number"
                    value={formData.par}
                    onChange={handleChange}
                    placeholder="Par"
                    className="h-12 text-base px-4 border-2"
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-base font-semibold">Recinto</FieldLabel>
                  <Input
                    name="rec"
                    type="number"
                    value={formData.rec}
                    onChange={handleChange}
                    placeholder="Rec"
                    className="h-12 text-base px-4 border-2"
                  />
                </Field>
              </div>

              <div className="grid gap-4 grid-cols-3">
                <Field>
                  <FieldLabel className="text-base font-semibold">Sup. Total (ha)</FieldLabel>
                  <Input
                    name="sup_total"
                    type="number"
                    step="0.01"
                    value={formData.sup_total}
                    onChange={handleChange}
                    placeholder="5.25"
                    className="h-12 text-base px-4 border-2"
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-base font-semibold">Sup. SRR (ha)</FieldLabel>
                  <Input
                    name="sup_srr"
                    type="number"
                    step="0.01"
                    value={formData.sup_srr}
                    onChange={handleChange}
                    placeholder="4.80"
                    className="h-12 text-base px-4 border-2"
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-base font-semibold">SR</FieldLabel>
                  <Input
                    name="sr"
                    value={formData.sr}
                    onChange={handleChange}
                    placeholder="SIGPAC"
                    className="h-12 text-base px-4 border-2"
                  />
                </Field>
              </div>
            </FieldGroup>
          </div>
        )}

        {/* Step 2: Cultivos + Laboreo + Notas */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            <FieldGroup>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Campaña Anterior</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel className="text-base font-semibold">Cultivo Anterior</FieldLabel>
                  <Input
                    name="cultivo_anterior"
                    value={formData.cultivo_anterior}
                    onChange={handleChange}
                    placeholder="Ej: Trigo"
                    className="h-12 text-base px-4 border-2"
                    autoFocus
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-base font-semibold">Laboreo Anterior</FieldLabel>
                  <Input
                    name="lab_anterior"
                    value={formData.lab_anterior}
                    onChange={handleChange}
                    placeholder="Ej: Siembra directa"
                    className="h-12 text-base px-4 border-2"
                  />
                </Field>
              </div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-2">Campaña Actual</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel className="text-base font-semibold">Cultivo Actual</FieldLabel>
                  <Input
                    name="cultivo_actual"
                    value={formData.cultivo_actual}
                    onChange={handleChange}
                    placeholder="Ej: Cebada"
                    className="h-12 text-base px-4 border-2"
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-base font-semibold">Variedad</FieldLabel>
                  <Input
                    name="variedad"
                    value={formData.variedad}
                    onChange={handleChange}
                    placeholder="Ej: Hispánica"
                    className="h-12 text-base px-4 border-2"
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-base font-semibold">Laboreo Actual</FieldLabel>
                  <Input
                    name="laboreo_actual"
                    value={formData.laboreo_actual}
                    onChange={handleChange}
                    placeholder="Ej: Tradicional"
                    className="h-12 text-base px-4 border-2"
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel className="text-base font-semibold">Notas</FieldLabel>
                <Textarea
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  placeholder="Observaciones adicionales..."
                  rows={2}
                  className="text-base px-4 py-3 border-2"
                />
              </Field>
            </FieldGroup>
          </div>
        )}

        {/* Step 3: Resumen */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
            <p className="text-sm text-muted-foreground mb-3">Revisa los datos antes de guardar:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <SummaryItem label="Nombre" value={formData.nombre_parcela} />
              <SummaryItem label="Municipio" value={formData.municipio} />
              <SummaryItem label="Polígono" value={formData.pol} />
              <SummaryItem label="Parcela" value={formData.par} />
              <SummaryItem label="Recinto" value={formData.rec} />
              <SummaryItem label="Sup. Total" value={formData.sup_total ? `${formData.sup_total} ha` : ""} />
              <SummaryItem label="Sup. SRR" value={formData.sup_srr ? `${formData.sup_srr} ha` : ""} />
              <SummaryItem label="SR" value={formData.sr} />
              <SummaryItem label="Cultivo Anterior" value={formData.cultivo_anterior} />
              <SummaryItem label="Lab. Anterior" value={formData.lab_anterior} />
              <SummaryItem label="Cultivo Actual" value={formData.cultivo_actual} />
              <SummaryItem label="Variedad" value={formData.variedad} />
              <SummaryItem label="Laboreo Actual" value={formData.laboreo_actual} />
            </div>
            {formData.notas && (
              <div className="p-3 bg-muted rounded-xl text-sm">
                <span className="text-muted-foreground font-medium">Notas: </span>
                <span className="italic">{formData.notas}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-destructive/10 border-2 border-destructive rounded-lg">
          <p className="text-base text-destructive font-medium">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-2 border-t border-border">
        {step === 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-13 text-base font-bold border-2"
          >
            Cancelar
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={prev}
            className="flex-1 h-13 text-base font-bold border-2"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Atrás
          </Button>
        )}

        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            onClick={next}
            className="flex-1 h-13 text-base font-bold shadow-lg shadow-primary/20"
          >
            Siguiente
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            className="flex-1 h-13 text-base font-bold shadow-lg shadow-primary/20"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner className="mr-2" />
                Guardando...
              </>
            ) : parcela ? (
              <>
                <Check className="w-5 h-5 mr-1" />
                Guardar Cambios
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-1" />
                Crear Parcela
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 px-3 py-2 bg-muted/60 rounded-lg text-sm">
      <span className="text-muted-foreground font-medium shrink-0">{label}:</span>
      <span className="font-semibold truncate">{value || "—"}</span>
    </div>
  )
}
