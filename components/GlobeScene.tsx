"use client";

import { useEffect, useRef } from "react";
import type { GlobeInstance } from "globe.gl";
import type { GlobeCountry, GlobeMovie } from "@/lib/globe-types";
import {
  buildAllMapNameMarkersFromGeoJson,
  createMapNameElement,
  type GeoJsonFeature,
  type MapNameMarker,
} from "@/lib/globe-labels";
import { createMoviePinElement } from "@/lib/globe-pins";

const ZOOM_THRESHOLD = 2.5;
const BORDERS_GEOJSON = "/globe/countries.geojson";

/** Flat illustrative map palette (not satellite). */
const OCEAN_COLOR = 0xadd8f0;
const LAND_COLOR = "#d8e8c8";
const BORDER_COLOR = "rgba(100, 116, 139, 0.55)";

interface CountryPoint extends GlobeCountry {
  kind: "pill";
}

interface MoviePoint extends GlobeMovie {
  kind: "movie";
}

type HtmlMarker = MapNameMarker | CountryPoint | MoviePoint;

function asCountryPoint(d: object): CountryPoint {
  return d as CountryPoint;
}

function isMapNameMarker(d: HtmlMarker): d is MapNameMarker {
  return d.kind === "country-name" || d.kind === "ocean-name";
}

function isMoviePoint(d: HtmlMarker): d is MoviePoint {
  return d.kind === "movie";
}

function countryPillHtml(count: number, recommendMode: boolean): string {
  if (recommendMode) {
    return `<div style="width:14px;height:14px;border-radius:50%;background:#e11d48;border:2px solid #fff;box-shadow:0 0 0 1px rgba(15,23,42,0.08),0 2px 8px rgba(225,29,72,0.35);"></div>`;
  }
  const filmIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></svg>`;
  return `<div style="display:inline-flex;align-items:center;gap:7px;padding:8px 14px;background:#fff;border-radius:999px;box-shadow:0 4px 20px rgba(15,23,42,0.1);font-family:system-ui,-apple-system,sans-serif;font-size:14px;font-weight:600;color:#334155;white-space:nowrap;"><span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#eff6ff">${filmIcon}</span><span>${count}</span></div>`;
}

function createCountryPillElement(
  country: CountryPoint,
  onClick: () => void,
  recommendMode: boolean,
): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.style.pointerEvents = "auto";
  wrap.style.cursor = "pointer";
  wrap.style.transform = "translate(-50%, -50%)";
  wrap.innerHTML = countryPillHtml(country.count, recommendMode);
  wrap.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });
  return wrap;
}

function applyFlatGlobeStyle(globe: GlobeInstance) {
  void import("three").then(({ AmbientLight, Color, DirectionalLight, MeshLambertMaterial }) => {
    globe.globeMaterial(
      new MeshLambertMaterial({
        color: new Color(OCEAN_COLOR),
      }),
    );

    const scene = globe.scene();
    scene.add(new AmbientLight(0xffffff, 1.85));
    const sun = new DirectionalLight(0xffffff, 0.25);
    sun.position.set(-1, 2, 3);
    scene.add(sun);
  });
}

/** Route pinch/scroll to the globe canvas instead of browser UI zoom/scroll. */
function bindGlobeGestureCapture(container: HTMLElement, globe: GlobeInstance) {
  const canvas = globe.renderer().domElement;

  const forwardWheel = (event: WheelEvent) => {
    // Canvas already handles its own wheel; only forward from HTML overlays (pins).
    if (event.target === canvas) return;

    event.preventDefault();
    canvas.dispatchEvent(
      new WheelEvent("wheel", {
        deltaX: event.deltaX,
        deltaY: event.deltaY,
        deltaMode: event.deltaMode,
        clientX: event.clientX,
        clientY: event.clientY,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        bubbles: false,
        cancelable: true,
      }),
    );
  };

  const blockPinchZoom = (event: TouchEvent) => {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  };

  const blockGesture = (event: Event) => {
    event.preventDefault();
  };

  container.addEventListener("wheel", forwardWheel, { passive: false });
  container.addEventListener("touchmove", blockPinchZoom, { passive: false });
  container.addEventListener("gesturestart", blockGesture);
  container.addEventListener("gesturechange", blockGesture);
  container.addEventListener("gestureend", blockGesture);

  return () => {
    container.removeEventListener("wheel", forwardWheel);
    container.removeEventListener("touchmove", blockPinchZoom);
    container.removeEventListener("gesturestart", blockGesture);
    container.removeEventListener("gesturechange", blockGesture);
    container.removeEventListener("gestureend", blockGesture);
  };
}

interface GlobeSceneProps {
  countries: GlobeCountry[];
  movies: GlobeMovie[];
  /** Recommend mode: always show country discover pins */
  recommendMode?: boolean;
  onCountryClick: (country: GlobeCountry) => void;
  onMovieClick: (movie: GlobeMovie) => void;
}

export function GlobeScene({
  countries,
  movies,
  recommendMode = false,
  onCountryClick,
  onMovieClick,
}: GlobeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const modeRef = useRef<"country" | "movie">("country");
  const callbacksRef = useRef({ onCountryClick, onMovieClick });
  callbacksRef.current = { onCountryClick, onMovieClick };

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;
    let controlsListener: (() => void) | null = null;
    let unbindGestures: (() => void) | null = null;

    void (async () => {
      const mod = await import("globe.gl");
      const Globe = mod.default as unknown as () => (el: HTMLElement) => GlobeInstance;
      if (disposed || !containerRef.current) return;

      const countryPoints: CountryPoint[] = countries.map((c) => ({
        ...c,
        kind: "pill" as const,
      }));
      const moviePoints: MoviePoint[] = movies.map((m) => ({
        ...m,
        kind: "movie" as const,
      }));

      let mapNameMarkers: MapNameMarker[] = [];

      const globe = Globe()(containerRef.current)
        .globeImageUrl("")
        .bumpImageUrl("")
        .backgroundImageUrl(null)
        .backgroundColor("rgba(0,0,0,0)")
        .showAtmosphere(true)
        .atmosphereColor("#ffffff")
        .atmosphereAltitude(0.2)
        .showGraticules(false)
        .labelsData([])
        .pointsData(countryPoints)
        .pointLat("lat")
        .pointLng("lng")
        .pointColor(() => "rgba(0,0,0,0)")
        .pointAltitude(0.008)
        .pointRadius(0.01)
        .pointLabel(() => "")
        .htmlElementsData([])
        .htmlLat("lat")
        .htmlLng("lng")
        .htmlAltitude(0.012)
        .htmlTransitionDuration(0)
        .onPointClick((point) => {
          const p = point as CountryPoint;
          if (p.kind !== "pill") return;
          callbacksRef.current.onCountryClick(p);
          globe.pointOfView({ lat: p.lat, lng: p.lng, altitude: 1.1 }, 900);
        });

      globe.controls().autoRotate = false;
      globe.controls().enableZoom = true;
      globe.controls().enablePan = true;
      globe.controls().zoomSpeed = 0.45;
      globe.pointOfView({ lat: 32, lng: -25, altitude: 2.3 });

      applyFlatGlobeStyle(globe);
      if (containerRef.current) {
        unbindGestures = bindGlobeGestureCapture(containerRef.current, globe);
      }

      const htmlForMarker = (d: HtmlMarker) => {
        if (isMapNameMarker(d)) {
          return createMapNameElement(d);
        }
        if (isMoviePoint(d)) {
          return createMoviePinElement(d, () => {
            callbacksRef.current.onMovieClick(d);
          });
        }
        const c = asCountryPoint(d);
        return createCountryPillElement(
          c,
          () => {
            callbacksRef.current.onCountryClick(c);
            globe.pointOfView({ lat: c.lat, lng: c.lng, altitude: 1.1 }, 900);
          },
          recommendMode,
        );
      };

      const applyHtmlLayers = (mode: "country" | "movie") => {
        // Country/ocean names stay visible in every source mode (viewed/liked/wishlist/recommend).
        if (mode === "country" || recommendMode) {
          globe
            .htmlElementsData([...mapNameMarkers, ...countryPoints])
            .htmlAltitude((d) => {
              const marker = d as HtmlMarker;
              if (isMapNameMarker(marker)) return 0.012;
              return 0.018;
            })
            .htmlElement((d) => htmlForMarker(d as HtmlMarker));
        } else {
          globe
            .htmlElementsData([...mapNameMarkers, ...moviePoints])
            .htmlAltitude((d) => {
              const marker = d as HtmlMarker;
              if (isMapNameMarker(marker)) return 0.012;
              return 0.016;
            })
            .htmlElement((d) => htmlForMarker(d as HtmlMarker));
        }
      };

      const applyMode = () => {
        if (recommendMode) {
          modeRef.current = "country";
          globe
            .pointsData(countryPoints)
            .pointColor(() => "rgba(0,0,0,0)")
            .pointLabel(() => "");
          applyHtmlLayers("country");
          return;
        }

        const altitude = globe.pointOfView().altitude ?? 2.3;
        const nextMode = altitude > ZOOM_THRESHOLD ? "country" : "movie";
        if (nextMode === modeRef.current) return;
        modeRef.current = nextMode;

        globe
          .pointsData(nextMode === "country" ? countryPoints : [])
          .pointColor(() => "rgba(0,0,0,0)")
          .pointLabel(() => "");

        applyHtmlLayers(nextMode);
      };

      try {
        const res = await fetch(BORDERS_GEOJSON);
        if (res.ok && !disposed) {
          const geojson = (await res.json()) as { features: GeoJsonFeature[] };
          mapNameMarkers = buildAllMapNameMarkersFromGeoJson(geojson.features);
          globe
            .polygonsData(geojson.features)
            .polygonCapColor(() => LAND_COLOR)
            .polygonSideColor(() => "rgba(0, 0, 0, 0)")
            .polygonStrokeColor(() => BORDER_COLOR)
            .polygonAltitude(0.008)
            .polygonsTransitionDuration(0)
            .polygonLabel(() => "");
          applyMode();
        }
      } catch {
        // optional
      }

      controlsListener = applyMode;
      globe.controls().addEventListener("change", applyMode);

      if (disposed) {
        globe._destructor();
        return;
      }

      globeRef.current = globe;
    })();

    return () => {
      disposed = true;
      unbindGestures?.();
      if (globeRef.current) {
        if (controlsListener) {
          globeRef.current.controls()?.removeEventListener("change", controlsListener);
        }
        globeRef.current._destructor();
      }
      globeRef.current = null;
    };
  }, [countries, movies, recommendMode]);

  return (
    <div className="globe-sky__stage">
      <div
        ref={containerRef}
        className="globe-scene absolute inset-0 z-[1] [&_canvas]:outline-none!"
        aria-label="Interactive movie globe"
      />
    </div>
  );
}
