'use client';

import { useEffect, useRef } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

interface CampMapProps {
  lat: number;
  lng: number;
  name: string;
}

export default function CampMap({ lat, lng, name }: CampMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // 动态加载 Leaflet
    const loadLeaflet = async () => {
      try {
        // 加载 Leaflet CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          link.crossOrigin = '';
          document.head.appendChild(link);
        }

        // 加载 Leaflet JS
        if (!(window as any).L) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
            script.crossOrigin = '';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        const L = (window as any).L;
        if (!L || !mapRef.current) return;

        // 创建地图
        const map = L.map(mapRef.current).setView([lat, lng], 13);

        // 添加 OpenStreetMap 图层
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        // 添加标记
        L.marker([lat, lng])
          .addTo(map)
          .bindPopup(`<b>${name}</b><br>${lat.toFixed(6)}, ${lng.toFixed(6)}`)
          .openPopup();

        mapInstanceRef.current = map;
      } catch (error) {
        console.error('加载地图失败:', error);
      }
    };

    loadLeaflet();

    // 清理函数
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, name]);

  // 生成外部地图链接
  const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=13`;
  const googleMapUrl = `https://www.google.com/maps?q=${lat},${lng}&hl=zh-CN`;

  return (
    <div className="w-full">
      <div ref={mapRef} className="w-full h-64 rounded-xl overflow-hidden border border-gray-200" />
      <div className="mt-3 flex items-center gap-4 flex-wrap">
        <a
          href={openStreetMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
        >
          <ExternalLink className="w-4 h-4" />
          在 OpenStreetMap 中打开
        </a>
        <a
          href={googleMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center gap-1"
        >
          <ExternalLink className="w-4 h-4" />
          在 Google Maps 中打开
        </a>
      </div>
    </div>
  );
}


