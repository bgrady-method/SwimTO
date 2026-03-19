export interface MapViewport {
  center: [number, number];
  zoom: number;
}

export const TORONTO_CENTER: [number, number] = [43.6532, -79.3832];
export const TORONTO_BOUNDS: [[number, number], [number, number]] = [
  [43.58, -79.65],
  [43.86, -79.12],
];
export const DEFAULT_ZOOM = 12;
