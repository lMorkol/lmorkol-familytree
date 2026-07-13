"use client";

import { useEffect, useRef } from "react";
import type { HumanAddress } from "@/types";

interface Props {
  addresses: HumanAddress[];
  height?: number;
}

const TYPE_COLORS: Record<string, string> = {
  "Постоянное место жительства": "#e74c3c",
  "Дача": "#27ae60",
  "Временное пребывание": "#f39c12",
  "Место работы": "#3498db",
  "Другое": "#95a5a6",
};

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function loadCss(href: string): void {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

export default function AddressMap({ addresses, height = 250 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  const coords = addresses.filter(a => a.lat != null && a.lng != null);

  useEffect(() => {
    if (coords.length === 0 || !containerRef.current) return;

    let map: any = null;

    const init = async () => {
      loadCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
      await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");

      const L = (window as any).L;
      if (!L || !containerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      const group = L.featureGroup();

      addresses
        .filter(a => a.lat != null && a.lng != null)
        .forEach(a => {
          const color = TYPE_COLORS[a.addressType || ""] || "#95a5a6";
          const label = [a.street, a.house, a.city, a.country].filter(Boolean).join(", ");
          const typeLabel = a.addressType || "";
          const period = [a.periodStart, a.periodEnd].filter(Boolean).join(" — ");
          const popup = [typeLabel, label, period].filter(Boolean).join("<br>");

          const icon = L.divIcon({
            className: "",
            html: `<div style="width:14px;height:14px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });

          L.marker([a.lat, a.lng], { icon }).addTo(map).bindPopup(popup);
          group.addLayer(L.marker([a.lat, a.lng]));
        });

      map.fitBounds(group.getBounds().pad(0.2));
      mapRef.current = map;
    };

    init();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [addresses]);

  if (coords.length === 0) return null;

  return (
    <div
      ref={containerRef}
      style={{ height, borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb" }}
    />
  );
}
