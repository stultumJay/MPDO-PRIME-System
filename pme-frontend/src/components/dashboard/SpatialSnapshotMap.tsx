import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const ALUBIJID_CENTER: [number, number] = [8.5730, 124.4730] // Poblacion center
const ALUBIJID_ZOOM = 12

const ALUBIJID_BOUNDS = L.latLngBounds(
  [8.45, 124.35], // southwest
  [8.68, 124.58]  // northeast
)
    
// Match your sector colors from the Map page
const SECTOR_COLORS: Record<string, string> = {
  INFRASTRUCTURE: '#06b6d4',  // teal
  SOCIAL:         '#f97316',  // orange
  ECONOMIC:       '#ef4444',  // red
  ENVIRONMENT:    '#22c55e',  // green
  INSTITUTIONAL:  '#6366f1',  // indigo
  OTHERS:         '#a855f7',  // purple
}

interface Project {
  id: string
  latitude: number
  longitude: number
  sector: string
  name: string
  status: string
}

interface SpatialSnapshotMapProps {
  projects: Project[]
}

export default function SpatialSnapshotMap({ projects }: SpatialSnapshotMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Initialize map with ALL interactions disabled
    const map = L.map(mapRef.current, {
      zoomControl:        false,
      scrollWheelZoom:    false,
      doubleClickZoom:    false,
      dragging:           false,
      touchZoom:          false,
      boxZoom:            false,
      keyboard:           false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
    map.setMaxBounds(ALUBIJID_BOUNDS)

    // Filter out projects with no coordinates
    const validProjects = projects.filter(p => p.latitude && p.longitude)

    // Always focus on Alubijid (:contentReference[oaicite:0]{index=0})
    map.setView(ALUBIJID_CENTER, ALUBIJID_ZOOM)

    // Add markers IF there are valid projects
    if (validProjects.length > 0) {
    validProjects.forEach(project => {
        const color = SECTOR_COLORS[project.sector?.toUpperCase()] ?? '#94a3b8'

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width: 10px;
            height: 10px;
            background: ${color};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 1px 3px rgba(0,0,0,0.4);
          "></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        })

        L.marker([project.latitude, project.longitude], {
          icon,
          title: `Project location: ${project.name}`,
          alt: `Project location: ${project.name}`,
        })
          .bindTooltip(project.name, { direction: 'top', offset: [0, -8] })
          .addTo(map)
      })

    }

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Re-add markers if projects data changes
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Remove old markers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) map.removeLayer(layer)
    })

    const validProjects = projects.filter(p => p.latitude && p.longitude)

    validProjects.forEach(project => {
      const color = SECTOR_COLORS[project.sector?.toUpperCase()] ?? '#94a3b8'
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width: 10px; height: 10px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      })

      L.marker([project.latitude, project.longitude], {
        icon,
        title: `Project location: ${project.name}`,
        alt: `Project location: ${project.name}`,
      })
        .bindTooltip(project.name, { direction: 'top', offset: [0, -8] })
        .addTo(map)
    })

    map.setView(ALUBIJID_CENTER, ALUBIJID_ZOOM)
  }, [projects])

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '100%', borderRadius: '8px' }}
    />
  )
}
