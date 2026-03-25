"use client"

import type { Parcela } from "@/lib/types"
import { buildSigpacUrl, parseMunicipio } from "@/lib/sigpac"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, MapPin, Wheat, ExternalLink, Map } from "lucide-react"

interface ParcelaCardProps {
  parcela: Parcela
  onEdit: () => void
  onDelete: () => void
}

export function ParcelaCard({ parcela, onEdit, onDelete }: ParcelaCardProps) {
  const displayName = parcela.nombre_parcela ||
    `Pol ${parcela.pol} - Par ${parcela.par}` ||
    "Parcela sin nombre"

  const { nombre: municipioNombre } = parseMunicipio(parcela.municipio)
  const sigpacUrl = buildSigpacUrl({
    municipio: parcela.municipio,
    pol: parcela.pol,
    par: parcela.par,
    rec: parcela.rec,
  })

  return (
    <Card className="border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-bold text-foreground truncate">
              {displayName}
            </CardTitle>
            {municipioNombre && (
              <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="text-base truncate">{municipioNombre}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={onEdit}
              className="h-12 w-12 border-2 hover:border-primary hover:text-primary transition-colors"
              aria-label="Editar parcela"
            >
              <Pencil className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onDelete}
              className="h-12 w-12 border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
              aria-label="Eliminar parcela"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Reference Numbers */}
        <div className="flex flex-wrap gap-2">
          {parcela.pol !== null && parcela.pol !== undefined && (
            <span className="px-3 py-1 bg-secondary rounded-lg text-base font-medium">
              Pol: {parcela.pol}
            </span>
          )}
          {parcela.par !== null && parcela.par !== undefined && (
            <span className="px-3 py-1 bg-secondary rounded-lg text-base font-medium">
              Par: {parcela.par}
            </span>
          )}
          {parcela.rec !== null && parcela.rec !== undefined && (
            <span className="px-3 py-1 bg-secondary rounded-lg text-base font-medium">
              Rec: {parcela.rec}
            </span>
          )}
        </div>

        {/* Surfaces */}
        {(parcela.sup_total || parcela.sup_srr) && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-base">
              {parcela.sup_total && (
                <div>
                  <span className="text-muted-foreground">Sup. Total:</span>{" "}
                  <span className="font-semibold">{parcela.sup_total} ha</span>
                </div>
              )}
              {parcela.sup_srr && (
                <div>
                  <span className="text-muted-foreground">Sup. SRR:</span>{" "}
                  <span className="font-semibold">{parcela.sup_srr} ha</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Crops */}
        {(parcela.cultivo_actual || parcela.cultivo_anterior) && (
          <div className="flex items-start gap-2">
            <Wheat className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="text-base">
              {parcela.cultivo_actual && (
                <p>
                  <span className="text-muted-foreground">Cultivo actual:</span>{" "}
                  <span className="font-semibold">{parcela.cultivo_actual}</span>
                  {parcela.variedad && (
                    <span className="text-muted-foreground"> ({parcela.variedad})</span>
                  )}
                </p>
              )}
              {parcela.cultivo_anterior && (
                <p className="text-muted-foreground">
                  Anterior: {parcela.cultivo_anterior}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {parcela.notas && (
          <p className="text-base text-muted-foreground italic border-l-4 border-border pl-3">
            {parcela.notas}
          </p>
        )}

        {/* SIGPAC Button */}
        {sigpacUrl ? (
          <a
            href={sigpacUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-12 px-4 rounded-xl text-base font-semibold bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30 text-primary hover:border-primary hover:from-primary/20 hover:to-primary/10 transition-all duration-300 hover:shadow-md hover:shadow-primary/10"
          >
            <Map className="w-5 h-5" />
            Ver en SIGPAC
            <ExternalLink className="w-4 h-4 opacity-60" />
          </a>
        ) : (
          <div className="flex items-center justify-center gap-2 w-full h-10 px-4 rounded-xl text-sm text-muted-foreground bg-muted/50 border border-dashed border-border">
            <Map className="w-4 h-4 opacity-40" />
            Añade municipio, polígono y parcela para ver en SIGPAC
          </div>
        )}
      </CardContent>
    </Card>
  )
}
