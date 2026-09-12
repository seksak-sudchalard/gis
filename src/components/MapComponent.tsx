import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { ExpenseItem, CATEGORIES, ExpenseCategory } from '../types';
import { formatCurrency } from '../data/sampleData';
import { MapPin, Navigation, Layers, ZoomIn, ZoomOut, Compass } from 'lucide-react';

interface MapComponentProps {
  items: ExpenseItem[];
  selectedItem: ExpenseItem | null;
  onSelectItem: (item: ExpenseItem) => void;
  onEditItem: (item: ExpenseItem) => void;
  onDeleteItem: (item: ExpenseItem) => void;
  onMapClickCoordinates: (coords: { lat: number; lng: number }) => void;
  isPickingLocation: boolean;
  uploadedGeoJson: any | null;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  items,
  selectedItem,
  onSelectItem,
  onEditItem,
  onDeleteItem,
  onMapClickCoordinates,
  isPickingLocation,
  uploadedGeoJson,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapType, setMapType] = React.useState<'streets' | 'satellite' | 'terrain'>('streets');
  const [userLocation, setUserLocation] = React.useState<[number, number] | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Bangkok center fallback
    const map = L.map(mapContainerRef.current, {
      center: [15.87, 100.9925], // Thailand center
      zoom: 6,
      zoomControl: false,
    });

    const streetTile = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
      }
    ).addTo(map);

    tileLayerRef.current = streetTile;

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = markersGroup;

    mapInstanceRef.current = map;

    // Map click event
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClickCoordinates({ lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.lng.toFixed(6)) });
    });

    // Cleanup
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update base tile layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    let url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    let attr = '&copy; OpenStreetMap &copy; CARTO';

    if (mapType === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attr = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP';
    } else if (mapType === 'terrain') {
      url = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      attr = 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap';
    }

    tileLayerRef.current = L.tileLayer(url, { attribution: attr, maxZoom: 19 }).addTo(mapInstanceRef.current);
  }, [mapType]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerGroupRef.current) return;

    markersLayerGroupRef.current.clearLayers();

    const bounds: L.LatLngBounds = L.latLngBounds([]);

    items.forEach((item) => {
      if (typeof item.lat !== 'number' || typeof item.lng !== 'number' || isNaN(item.lat) || isNaN(item.lng)) {
        return;
      }

      bounds.extend([item.lat, item.lng]);

      const catMeta = CATEGORIES[item.category] || CATEGORIES.other;
      const isIncome = item.type === 'income';
      const markerColor = isIncome ? '#16a34a' : catMeta.color;

      // Custom GIS marker SVG icon
      const iconHtml = `
        <div class="group relative flex items-center justify-center">
          <div style="background-color: ${markerColor};" 
               class="w-8 h-8 rounded-full shadow-lg border-2 border-white flex items-center justify-center text-white transform transition-transform hover:scale-125 cursor-pointer">
            <span style="font-size: 13px; font-weight: bold;">${isIncome ? '+' : '฿'}</span>
          </div>
          <div class="absolute -bottom-1 w-2 h-2 rotate-45 border-r border-b border-white" style="background-color: ${markerColor};"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: iconHtml,
        iconSize: [32, 36],
        iconAnchor: [16, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([item.lat, item.lng], { icon: customIcon });

      // Build rich popup table
      const popupDiv = document.createElement('div');
      popupDiv.className = 'gis-popup-content p-1 text-slate-800 font-sans min-w-[240px] max-w-[280px]';
      popupDiv.innerHTML = `
        <div class="border-b border-slate-200 pb-2 mb-2">
          <div class="flex items-center justify-between gap-1">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium" 
                  style="background-color: ${catMeta.bgColor}; color: ${catMeta.color}; border: 1px solid ${catMeta.borderColor};">
              ${catMeta.label}
            </span>
            <span class="text-xs font-mono font-bold ${isIncome ? 'text-emerald-600' : 'text-slate-900'}">
              ${isIncome ? '+' : '-'}${formatCurrency(item.amount)}
            </span>
          </div>
          <h4 class="font-semibold text-sm text-slate-900 mt-1 leading-snug">${item.title}</h4>
          ${item.locationName ? `<p class="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5"><span class="shrink-0">📍</span>${item.locationName}</p>` : ''}
        </div>
        
        <table class="w-full text-[11px] text-slate-600 border-collapse mb-2.5">
          <tbody>
            <tr class="border-b border-slate-100">
              <td class="py-0.5 text-slate-400 font-medium">วันที่-เวลา</td>
              <td class="py-0.5 text-right font-mono">${item.date} ${item.time}</td>
            </tr>
            <tr class="border-b border-slate-100">
              <td class="py-0.5 text-slate-400 font-medium">การชำระ</td>
              <td class="py-0.5 text-right font-medium">${item.paymentMethod.toUpperCase()}</td>
            </tr>
            <tr class="border-b border-slate-100">
              <td class="py-0.5 text-slate-400 font-medium">พิกัด GIS</td>
              <td class="py-0.5 text-right font-mono text-[10px] text-slate-500">${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}</td>
            </tr>
            ${item.note ? `
            <tr>
              <td class="py-1 text-slate-400 font-medium align-top">หมายเหตุ</td>
              <td class="py-1 text-right text-slate-700 italic">${item.note}</td>
            </tr>` : ''}
          </tbody>
        </table>

        <div class="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
          <a href="https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}" target="_blank" rel="noopener noreferrer" 
             class="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium py-1 px-1.5 rounded hover:bg-blue-50 transition-colors">
            🧭 นำทาง
          </a>
          <div class="flex items-center gap-1">
            <button id="popup-edit-${item.id}" class="text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded transition-colors">
              แก้ไข
            </button>
            <button id="popup-delete-${item.id}" class="text-[11px] px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium rounded transition-colors">
              ลบ
            </button>
          </div>
        </div>
      `;

      // Event listeners on popup buttons
      marker.bindPopup(popupDiv, { maxWidth: 300 });

      marker.on('popupopen', () => {
        onSelectItem(item);
        const editBtn = document.getElementById(`popup-edit-${item.id}`);
        const delBtn = document.getElementById(`popup-delete-${item.id}`);

        if (editBtn) {
          editBtn.onclick = (e) => {
            e.stopPropagation();
            onEditItem(item);
            marker.closePopup();
          };
        }
        if (delBtn) {
          delBtn.onclick = (e) => {
            e.stopPropagation();
            onDeleteItem(item);
            marker.closePopup();
          };
        }
      });

      markersLayerGroupRef.current?.addLayer(marker);
    });

    // If there are items and not currently selecting single item, fit bounds
    if (items.length > 0 && !selectedItem && bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [items]);

  // Focus selected item
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedItem) return;
    mapInstanceRef.current.setView([selectedItem.lat, selectedItem.lng], 14, {
      animate: true,
    });
  }, [selectedItem]);

  // Handle uploaded GeoJSON layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (geoJsonLayerRef.current) {
      mapInstanceRef.current.removeLayer(geoJsonLayerRef.current);
      geoJsonLayerRef.current = null;
    }

    if (uploadedGeoJson) {
      try {
        const layer = L.geoJSON(uploadedGeoJson, {
          style: {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.8,
            fillColor: '#60a5fa',
            fillOpacity: 0.25,
          },
          pointToLayer: (feature, latlng) => {
            return L.circleMarker(latlng, {
              radius: 6,
              fillColor: '#8b5cf6',
              color: '#ffffff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.85,
            });
          },
          onEachFeature: (feature, fLayer) => {
            if (feature.properties) {
              const propsTable = Object.entries(feature.properties)
                .slice(0, 6)
                .map(([k, v]) => `<tr><td class="font-medium pr-2 text-slate-400">${k}:</td><td class="font-mono text-slate-800">${v}</td></tr>`)
                .join('');
              fLayer.bindPopup(`
                <div class="text-xs p-1">
                  <strong class="text-blue-600 block mb-1">GeoJSON Feature</strong>
                  <table class="w-full text-[10px]">${propsTable}</table>
                </div>
              `);
            }
          },
        }).addTo(mapInstanceRef.current);

        geoJsonLayerRef.current = layer;

        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30] });
        }
      } catch (err) {
        console.error('Failed to parse uploaded GeoJSON layer:', err);
      }
    }
  }, [uploadedGeoJson]);

  // User location GPS tracker
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ไม่รองรับ Geolocation');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation([lat, lng]);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 15, { animate: true });

          // Add temporary pulsing blue circle for user location
          const userCircle = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: '#2563eb',
            color: '#ffffff',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.9,
          }).addTo(mapInstanceRef.current);

          userCircle.bindPopup('<b>ตำแหน่งของคุณในขณะนี้</b>').openPopup();
        }

        onMapClickCoordinates({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('ไม่สามารถดึงตำแหน่ง GPS ได้ กรุณาเปิดสิทธิ์ระบุตำแหน่ง');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current || items.length === 0) return;
    const bounds = L.latLngBounds(items.map((i) => [i.lat, i.lng]));
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  };

  return (
    <div id="map-wrapper" className="relative w-full h-full min-h-[360px] bg-slate-100 overflow-hidden">
      {/* Map DOM Container */}
      <div ref={mapContainerRef} id="leaflet-map-canvas" className="w-full h-full z-0" />

      {/* Mode notification when picking location on map */}
      {isPickingLocation && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-amber-500 text-white px-4 py-1.5 rounded-full shadow-lg text-xs font-semibold flex items-center gap-1.5 animate-pulse">
          <MapPin className="w-4 h-4" />
          <span>คลิกที่ใดก็ได้บนแผนที่ เพื่อระบุพิกัดบันทึกรายการ</span>
        </div>
      )}

      {/* GIS Map Floating Controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
        {/* Base Layer Switcher */}
        <div className="bg-white/95 backdrop-blur-xs rounded-xl shadow-md border border-slate-200/80 p-1 flex flex-col gap-1">
          <button
            onClick={() => setMapType('streets')}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              mapType === 'streets' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="แผนที่ถนน (Street Map)"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline pr-1">Street</span>
          </button>
          <button
            onClick={() => setMapType('satellite')}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              mapType === 'satellite' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="ภาพถ่ายดาวเทียม (Satellite)"
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline pr-1">ดาวเทียม</span>
          </button>
        </div>

        {/* GPS Geolocation */}
        <button
          id="btn-get-current-gps"
          onClick={handleGetLocation}
          className="p-2.5 bg-white/95 backdrop-blur-xs hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl shadow-md border border-slate-200/80 transition-all flex items-center justify-center"
          title="ระบุตำแหน่ง GPS ปัจจุบัน"
        >
          <Navigation className="w-4 h-4 text-blue-600" />
        </button>

        {/* Fit Bounds */}
        <button
          id="btn-fit-map-bounds"
          onClick={handleFitAll}
          className="p-2.5 bg-white/95 backdrop-blur-xs hover:bg-slate-100 text-slate-700 rounded-xl shadow-md border border-slate-200/80 transition-all flex items-center justify-center text-xs font-semibold"
          title="แสดงหมุดทั้งหมดบนแผนที่"
        >
          <MapPin className="w-4 h-4 text-slate-600" />
        </button>

        {/* Zoom Controls */}
        <div className="bg-white/95 backdrop-blur-xs rounded-xl shadow-md border border-slate-200/80 p-0.5 flex flex-col">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="ซูมเข้า"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-200 mx-1"></div>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="ซูมออก"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
