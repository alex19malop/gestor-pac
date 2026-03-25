/**
 * Parse the municipio field format "42033 ALMAZUL" to extract SIGPAC codes.
 * Format: first 2 digits = provincia, next 3 digits = cod_municipio
 */
export function parseMunicipio(municipio: string | null): {
  provincia: number | null
  codMunicipio: number | null
  nombre: string | null
} {
  if (!municipio) return { provincia: null, codMunicipio: null, nombre: null }

  const match = municipio.trim().match(/^(\d{2})(\d{3})\s+(.+)$/)
  if (!match) {
    // Try simpler: just a name without code
    return { provincia: null, codMunicipio: null, nombre: municipio.trim() }
  }

  return {
    provincia: parseInt(match[1], 10),
    codMunicipio: parseInt(match[2], 10),
    nombre: match[3].trim(),
  }
}

/**
 * Build the SIGPAC viewer URL for a given parcela.
 * Returns null if required fields are missing.
 */
export function buildSigpacUrl(params: {
  municipio: string | null
  pol: number | null
  par: number | null
  rec?: number | null
}): string | null {
  const { provincia, codMunicipio } = parseMunicipio(params.municipio)
  if (provincia === null || codMunicipio === null || !params.pol || !params.par) {
    return null
  }

  const base = "https://sigpac.mapa.gob.es/fega/visor/"
  const searchParams = new URLSearchParams({
    provincia: provincia.toString(),
    municipio: codMunicipio.toString(),
    poligono: params.pol.toString(),
    parcela: params.par.toString(),
  })

  if (params.rec) {
    searchParams.set("recinto", params.rec.toString())
  }

  return `${base}?${searchParams.toString()}`
}
