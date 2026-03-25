"use client"

import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { MapContainer, TileLayer, Marker, Popup, WMSTileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { Parcela } from "@/lib/types"
import { buildSigpacUrl, parseMunicipio } from "@/lib/sigpac"
import { Loader2, Map as MapIcon } from "lucide-react"

// Fix Leaflet default marker icons (broken by bundlers)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

// Custom green marker icon
const parcelaIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface GeocodedParcela {
  parcela: Parcela
  lat: number
  lng: number
  exact: boolean // true if from SIGPAC API, false if from Nominatim
}

interface ParcelasMapProps {
  parcelas: Parcela[]
}

// -- Geocoding helpers --

/** Compute centroid from a WKT POLYGON string */
function centroidFromWKT(wkt: string): { lat: number; lng: number } | null {
  const match = wkt.match(/POLYGON\(\((.+)\)\)/)
  if (!match) return null
  const coords = match[1].split(",").map((pair) => {
    const [lng, lat] = pair.trim().split(/\s+/).map(Number)
    return { lat, lng }
  })
  if (coords.length === 0) return null
  const sum = coords.reduce(
    (acc, c) => ({ lat: acc.lat + c.lat, lng: acc.lng + c.lng }),
    { lat: 0, lng: 0 }
  )
  return { lat: sum.lat / coords.length, lng: sum.lng / coords.length }
}

/**
 * Try to get exact coordinates from SIGPAC hubcloud API.
 * Returns centroid of the parcela's first recinto polygon.
 */
async function geocodeViaSigpac(
  provincia: number,
  municipio: number,
  pol: number,
  par: number,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://sigpac-hubcloud.es/servicioconsultassigpac/query/recinfoparc/${provincia}/${municipio}/0/0/${pol}/${par}.json`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null
    // Use first recinto's WKT geometry to compute centroid
    const wkt = data[0]?.wkt
    if (!wkt) return null
    return centroidFromWKT(wkt)
  } catch {
    return null
  }
}

/** Fallback: geocode by municipality name via Nominatim */
async function geocodeViaNominatim(
  municipioName: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      municipioName + ", España"
    )}&format=json&limit=1&countrycodes=es`
    const res = await fetch(url, { headers: { "Accept-Language": "es" } })
    const data = await res.json()
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
    return null
  } catch {
    return null
  }
}

/** Auto-fit map to bounds when bounds change */
function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
    }
  }, [map, bounds])
  return null
}

export function ParcelasMap({ parcelas }: ParcelasMapProps) {
  const [geocoded, setGeocoded] = useState<GeocodedParcela[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const sigpacCacheRef = useRef<Record<string, { lat: number; lng: number } | null>>({})
  const nominatimCacheRef = useRef<Record<string, { lat: number; lng: number } | null>>({})

  // Parcels that actually have enough data to geocode
  const geocodableParcelas = useMemo(
    () =>
      parcelas.filter(
        (p) => p.municipio && p.pol != null && p.par != null
      ),
    [parcelas]
  )

  const geocodeAll = useCallback(async () => {
    setLoading(true)
    const total = geocodableParcelas.length
    setProgress({ done: 0, total })

    const results: GeocodedParcela[] = []
    let doneCount = 0

    for (const p of geocodableParcelas) {
      const { provincia, codMunicipio, nombre } = parseMunicipio(p.municipio)

      let coords: { lat: number; lng: number } | null = null
      let exact = false

      // 1) Try SIGPAC hubcloud API (exact coordinates from parcel geometry)
      if (provincia != null && codMunicipio != null && p.pol != null && p.par != null) {
        const sigpacKey = `${provincia}/${codMunicipio}/${p.pol}/${p.par}`
        if (sigpacKey in sigpacCacheRef.current) {
          coords = sigpacCacheRef.current[sigpacKey]
        } else {
          coords = await geocodeViaSigpac(provincia, codMunicipio, p.pol, p.par)
          sigpacCacheRef.current[sigpacKey] = coords
        }
        if (coords) exact = true
      }

      // 2) Fallback: Nominatim geocode from municipality name
      if (!coords && nombre) {
        if (nombre in nominatimCacheRef.current) {
          coords = nominatimCacheRef.current[nombre]
        } else {
          coords = await geocodeViaNominatim(nombre)
          nominatimCacheRef.current[nombre] = coords
          // Nominatim rate limit: 1 req/sec
          await new Promise((r) => setTimeout(r, 1100))
        }
      }

      if (coords && !isNaN(coords.lat) && !isNaN(coords.lng)) {
        // For Nominatim (non-exact): add small offset so parcels from same municipio don't overlap
        let finalLat = coords.lat
        let finalLng = coords.lng
        if (!exact) {
          const sameCount = results.filter(
            (r) => !r.exact && parseMunicipio(r.parcela.municipio).nombre === nombre
          ).length
          finalLat += (sameCount % 5) * 0.002 - 0.004
          finalLng += Math.floor(sameCount / 5) * 0.002 - 0.002
        }

        if (!isNaN(finalLat) && !isNaN(finalLng)) {
          results.push({
            parcela: p,
            lat: finalLat,
            lng: finalLng,
            exact,
          })
        }
      }

      doneCount++
      setProgress({ done: doneCount, total })
    }

    setGeocoded(results)
    setLoading(false)
  }, [geocodableParcelas])

  useEffect(() => {
    geocodeAll()
  }, [geocodeAll])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-card rounded-xl border-2 border-border gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">
            Localizando parcelas...
          </p>
          {progress.total > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {progress.done} / {progress.total} parcelas procesadas
            </p>
          )}
        </div>
      </div>
    )
  }

  if (geocoded.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-card rounded-xl border-2 border-dashed border-border gap-4">
        <MapIcon className="w-16 h-16 text-muted-foreground opacity-50" />
        <p className="text-xl text-muted-foreground">
          No se pudieron localizar parcelas en el mapa
        </p>
        <p className="text-sm text-muted-foreground">
          Asegúrate de que las parcelas tienen municipio, polígono y parcela asignados
        </p>
      </div>
    )
  }

  const validGeocoded = geocoded.filter(
    (g) => typeof g.lat === "number" && typeof g.lng === "number" && !isNaN(g.lat) && !isNaN(g.lng)
  )
  const exactCount = validGeocoded.filter((g) => g.exact).length
  const approxCount = validGeocoded.length - exactCount
  const bounds = validGeocoded.length > 0
    ? L.latLngBounds(validGeocoded.map((g) => [g.lat, g.lng] as [number, number]))
    : null

  return (
    <div className="rounded-xl overflow-hidden border-2 border-border shadow-lg">
      <MapContainer
        center={[39.5, -3.0]}
        zoom={6}
        scrollWheelZoom={true}
        style={{ height: "600px", width: "100%" }}
        className="z-0"
      >
        <FitBounds bounds={bounds} />

        {/* Base layer: OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* SIGPAC WMS overlay: shows actual parcel boundaries */}
        <WMSTileLayer
          url="https://wms.mapama.gob.es/sigpac/wms"
          layers="recinto"
          format="image/png"
          transparent={true}
          opacity={0.5}
          attribution="SIGPAC © FEGA/MAPA"
        />

        {validGeocoded.map((g) => {
          const { nombre: municipioNombre } = parseMunicipio(g.parcela.municipio)
          const sigpacUrl = buildSigpacUrl({
            municipio: g.parcela.municipio,
            pol: g.parcela.pol,
            par: g.parcela.par,
            rec: g.parcela.rec,
          })
          const displayName =
            g.parcela.nombre_parcela ||
            `Pol ${g.parcela.pol} - Par ${g.parcela.par}` ||
            "Parcela sin nombre"

          return (
            <Marker
              key={g.parcela.id}
              position={[g.lat, g.lng]}
              icon={parcelaIcon}
            >
              <Popup minWidth={260} maxWidth={320}>
                <div style={{ fontFamily: "inherit" }}>
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      marginBottom: "4px",
                      color: "#1a1a1a",
                    }}
                  >
                    {displayName}
                  </h3>

                  {municipioNombre && (
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#666",
                        marginBottom: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      📍 {municipioNombre}
                    </p>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      flexWrap: "wrap",
                      marginBottom: "8px",
                    }}
                  >
                    {g.parcela.pol != null && (
                      <span
                        style={{
                          background: "#f0f0f0",
                          borderRadius: "6px",
                          padding: "2px 8px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        Pol: {g.parcela.pol}
                      </span>
                    )}
                    {g.parcela.par != null && (
                      <span
                        style={{
                          background: "#f0f0f0",
                          borderRadius: "6px",
                          padding: "2px 8px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        Par: {g.parcela.par}
                      </span>
                    )}
                    {g.parcela.rec != null && (
                      <span
                        style={{
                          background: "#f0f0f0",
                          borderRadius: "6px",
                          padding: "2px 8px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        Rec: {g.parcela.rec}
                      </span>
                    )}
                  </div>

                  {g.parcela.sup_total && (
                    <p style={{ fontSize: "13px", marginBottom: "4px" }}>
                      <strong>Superficie:</strong> {g.parcela.sup_total} ha
                    </p>
                  )}

                  {g.parcela.cultivo_actual && (
                    <p style={{ fontSize: "13px", marginBottom: "8px" }}>
                      🌾 <strong>Cultivo:</strong> {g.parcela.cultivo_actual}
                      {g.parcela.variedad && (
                        <span style={{ color: "#888" }}>
                          {" "}({g.parcela.variedad})
                        </span>
                      )}
                    </p>
                  )}

                  {!g.exact && (
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#999",
                        fontStyle: "italic",
                        marginBottom: "6px",
                      }}
                    >
                      📌 Posición aproximada por municipio
                    </p>
                  )}

                  {sigpacUrl && (
                    <a
                      href={sigpacUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#2d7a3a",
                        background: "rgba(45, 122, 58, 0.08)",
                        border: "1.5px solid rgba(45, 122, 58, 0.25)",
                        textDecoration: "none",
                        marginTop: "4px",
                      }}
                    >
                      🗺️ Ver en SIGPAC ↗
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Footer */}
      <div className="bg-card px-4 py-3 flex items-center justify-between text-sm text-muted-foreground border-t border-border flex-wrap gap-2">
        <span>
          📍 {validGeocoded.length} parcela{validGeocoded.length !== 1 ? "s" : ""} en el mapa
          {exactCount > 0 && (
            <span className="text-primary font-medium"> · {exactCount} con ubicación exacta</span>
          )}
          {approxCount > 0 && (
            <span> · {approxCount} aproximada{approxCount !== 1 ? "s" : ""}</span>
          )}
        </span>
        <span className="text-xs opacity-60">
          Capa SIGPAC © FEGA/MAPA · © OpenStreetMap
        </span>
      </div>
    </div>
  )
}
