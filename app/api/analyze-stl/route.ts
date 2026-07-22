import { NextResponse } from "next/server"
import * as THREE from 'three'

// STLLoader manuell implementieren für Server-Side
class STLLoader {
  parse(data: Uint8Array): THREE.BufferGeometry {
    const isBinary = data.byteLength >= 84 && new DataView(data.buffer).getUint32(80, true) === (data.byteLength - 84)
    
    if (isBinary) {
      return this.parseBinary(data)
    } else {
      return this.parseASCII(new TextDecoder().decode(data))
    }
  }

  private parseBinary(data: Uint8Array): THREE.BufferGeometry {
    const reader = new DataView(data.buffer)
    const faceCount = reader.getUint32(80, true)
    const positions = new Float32Array(faceCount * 9)
    
    let offset = 84
    for (let i = 0; i < faceCount; i++) {
      for (let j = 0; j < 3; j++) {
        const normal = reader.getFloat32(offset, true)
        offset += 4
      }
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          positions[i * 9 + j * 3 + k] = reader.getFloat32(offset, true)
          offset += 4
        }
      }
      offset += 2 // attribute byte count
    }
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.computeVertexNormals()
    return geometry
  }

  private parseASCII(text: string): THREE.BufferGeometry {
    const positions: number[] = []
    const lines = text.split('\n')
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/)
      if (parts[0] === 'vertex' && parts.length >= 4) {
        positions.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]))
      }
    }
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
    geometry.computeVertexNormals()
    return geometry
  }
}

interface STLAnalysis {
  volume: string
  surfaceArea: string
  boundingBox: {
    width: string
    height: string
    depth: string
  }
  faceCount: number
  vertexCount: number
  isManifold: boolean
  dimensions: {
    x: string
    y: string
    z: string
  }
  printTime: {
    hours: string
    minutes: string
    layers: number
  }
  supportAnalysis: {
    needsSupport: boolean
    overhangArea: string
    supportVolume: string
    criticalOverhangs: number
  }
}

function calculateVolume(geometry: THREE.BufferGeometry): number {
  const positions = geometry.attributes.position.array as Float32Array
  const triangles = positions.length / 3
  let volume = 0

  for (let i = 0; i < triangles; i += 3) {
    const ax = positions[i * 3]
    const ay = positions[i * 3 + 1]
    const az = positions[i * 3 + 2]
    const bx = positions[(i + 1) * 3]
    const by = positions[(i + 1) * 3 + 1]
    const bz = positions[(i + 1) * 3 + 2]
    const cx = positions[(i + 2) * 3]
    const cy = positions[(i + 2) * 3 + 1]
    const cz = positions[(i + 2) * 3 + 2]

    volume += (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by)) / 6
  }

  return Math.abs(volume)
}

function calculateSurfaceArea(geometry: THREE.BufferGeometry): number {
  const positions = geometry.attributes.position.array as Float32Array
  const triangles = positions.length / 3
  let area = 0

  for (let i = 0; i < triangles; i += 3) {
    const ax = positions[i * 3]
    const ay = positions[i * 3 + 1]
    const az = positions[i * 3 + 2]
    const bx = positions[(i + 1) * 3]
    const by = positions[(i + 1) * 3 + 1]
    const bz = positions[(i + 1) * 3 + 2]
    const cx = positions[(i + 2) * 3]
    const cy = positions[(i + 2) * 3 + 1]
    const cz = positions[(i + 2) * 3 + 2]

    const abx = bx - ax
    const aby = by - ay
    const abz = bz - az
    const acx = cx - ax
    const acy = cy - ay
    const acz = cz - az

    const crossX = aby * acz - abz * acy
    const crossY = abz * acx - abx * acz
    const crossZ = abx * acy - aby * acx

    area += Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ) / 2
  }

  return area
}

function checkManifold(geometry: THREE.BufferGeometry): boolean {
  const positions = geometry.attributes.position.array as Float32Array
  const triangles = positions.length / 3
  
  // Basic manifold check: each edge should be shared by exactly 2 triangles
  const edgeCount = new Map<string, number>()
  
  for (let i = 0; i < triangles; i += 3) {
    const indices = [i, i + 1, i + 2]
    for (let j = 0; j < 3; j++) {
      const v1 = indices[j]
      const v2 = indices[(j + 1) % 3]
      const edgeKey = `${Math.min(v1, v2)}-${Math.max(v1, v2)}`
      edgeCount.set(edgeKey, (edgeCount.get(edgeKey) || 0) + 1)
    }
  }
  
  // Check if all edges are shared by exactly 2 triangles
  for (const count of edgeCount.values()) {
    if (count !== 2) return false
  }
  
  return true
}

function calculatePrintTime(geometry: THREE.BufferGeometry, volume: number): { hours: number; minutes: number; layers: number } {
  const positions = geometry.attributes.position.array as Float32Array
  geometry.computeBoundingBox()
  const boundingBox = geometry.boundingBox!
  const height = boundingBox.max.z - boundingBox.min.z
  
  // Layer height typisch 0.2mm
  const layerHeight = 0.2
  const layers = Math.ceil(height / layerHeight)
  
  // Volumen in cm³
  const volumeCm3 = volume / 1000
  
  // Basierend auf Volumen und Komplexität (Face count)
  const faceCount = geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3
  const complexityFactor = Math.min(faceCount / 10000, 2) // Max 2x Komplexität
  
  // Druckzeit basierend auf FDM-Druckgeschwindigkeit
  // Typisch: 50-80 mm/s, aber abhängig von Komplexität
  const basePrintSpeed = 60 // mm/s
  const effectiveSpeed = basePrintSpeed / (1 + complexityFactor * 0.5)
  
  // Geschätzte Druckzeit in Stunden
  // Volumen (mm³) / (Geschwindigkeit * Layer-Höhe * Extrusionsbreite)
  // Vereinfachte Formel basierend auf Erfahrungswerten
  const printHours = (volumeCm3 / 15) * (1 + complexityFactor * 0.3)
  
  const hours = Math.floor(printHours)
  const minutes = Math.round((printHours - hours) * 60)
  
  return { hours, minutes, layers }
}

function analyzeSupport(geometry: THREE.BufferGeometry): {
  needsSupport: boolean
  overhangArea: number
  supportVolume: number
  criticalOverhangs: number
} {
  const positions = geometry.attributes.position.array as Float32Array
  const normals = geometry.attributes.normal?.array as Float32Array
  
  if (!normals) {
    geometry.computeVertexNormals()
  }
  
  const triangles = positions.length / 3
  let overhangArea = 0
  let criticalOverhangs = 0
  let supportVolume = 0
  
  // Z-Achse ist Aufwärtsrichtung (bei STL typisch)
  // Overhang-Winkel: > 45 Grad von der Vertikalen
  const overhangAngleThreshold = Math.cos(45 * Math.PI / 180) // ~0.707
  
  for (let i = 0; i < triangles; i += 3) {
    const ax = positions[i * 3]
    const ay = positions[i * 3 + 1]
    const az = positions[i * 3 + 2]
    const bx = positions[(i + 1) * 3]
    const by = positions[(i + 1) * 3 + 1]
    const bz = positions[(i + 1) * 3 + 2]
    const cx = positions[(i + 2) * 3]
    const cy = positions[(i + 2) * 3 + 1]
    const cz = positions[(i + 2) * 3 + 2]
    
    // Berechne Normalenvektor des Dreiecks
    const abx = bx - ax
    const aby = by - ay
    const abz = bz - az
    const acx = cx - ax
    const acy = cy - ay
    const acz = cz - az
    
    const nx = aby * acz - abz * acy
    const ny = abz * acx - abx * acz
    const nz = abx * acy - aby * acx
    
    const normalLength = Math.sqrt(nx * nx + ny * ny + nz * nz)
    if (normalLength === 0) continue
    
    const normalizedNz = Math.abs(nz) / normalLength
    
    // Prüfe auf Overhang (Normalenvektor zeigt nach unten)
    if (nz < 0 && normalizedNz < overhangAngleThreshold) {
      // Berechne Dreiecksfläche
      const crossX = aby * acz - abz * acy
      const crossY = abz * acx - abx * acz
      const crossZ = abx * acy - aby * acx
      const area = Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ) / 2
      
      overhangArea += area
      
      // Kritische Overhangs (> 60 Grad)
      if (normalizedNz < Math.cos(60 * Math.PI / 180)) {
        criticalOverhangs++
      }
      
      // Geschätztes Support-Volumen basierend auf Overhang-Höhe
      const maxHeight = Math.max(az, bz, cz)
      const minHeight = Math.min(az, bz, cz)
      const overhangHeight = maxHeight - minHeight
      supportVolume += area * overhangHeight * 0.3 // 30% Füllung für Support
    }
  }
  
  const needsSupport = overhangArea > 100 || criticalOverhangs > 5
  
  return {
    needsSupport,
    overhangArea: overhangArea / 100, // mm² zu cm²
    supportVolume: supportVolume / 1000, // mm³ zu cm³
    criticalOverhangs,
  }
}

export async function POST(req: Request) {
  try {
    const { fileUrl } = await req.json()

    if (!fileUrl) {
      return NextResponse.json({ error: "fileUrl erforderlich" }, { status: 400 })
    }

    // Download the STL file
    const response = await fetch(fileUrl)
    if (!response.ok) {
      return NextResponse.json({ error: "Fehler beim Herunterladen der Datei" }, { status: 400 })
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Parse STL using Three.js STLLoader
    const loader = new STLLoader()
    const geometry = loader.parse(buffer)

    // Calculate real metrics
    const volume = calculateVolume(geometry) // in cubic units (mm³ for STL)
    const surfaceArea = calculateSurfaceArea(geometry) // in square units (mm²)
    const isManifold = checkManifold(geometry)
    
    // Get bounding box
    geometry.computeBoundingBox()
    const boundingBox = geometry.boundingBox!
    const dimensions = {
      x: (boundingBox.max.x - boundingBox.min.x).toFixed(2),
      y: (boundingBox.max.y - boundingBox.min.y).toFixed(2),
      z: (boundingBox.max.z - boundingBox.min.z).toFixed(2),
    }

    const faceCount = geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3
    const vertexCount = geometry.attributes.position.count

    // Calculate print time
    const printTime = calculatePrintTime(geometry, volume)
    
    // Analyze support requirements
    const supportAnalysis = analyzeSupport(geometry)

    const analysis: STLAnalysis = {
      volume: volume.toFixed(2),
      surfaceArea: surfaceArea.toFixed(2),
      boundingBox: {
        width: dimensions.x,
        height: dimensions.y,
        depth: dimensions.z,
      },
      faceCount,
      vertexCount,
      isManifold,
      dimensions,
      printTime: {
        hours: printTime.hours.toString(),
        minutes: printTime.minutes.toString(),
        layers: printTime.layers,
      },
      supportAnalysis: {
        needsSupport: supportAnalysis.needsSupport,
        overhangArea: supportAnalysis.overhangArea.toFixed(2),
        supportVolume: supportAnalysis.supportVolume.toFixed(2),
        criticalOverhangs: supportAnalysis.criticalOverhangs,
      },
    }

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error("STL analysis error:", error)
    return NextResponse.json({ error: "Fehler bei der STL-Analyse" }, { status: 500 })
  }
}
