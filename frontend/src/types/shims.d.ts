declare module "simplex-noise" {
  export function createNoise2D(): (x: number, y: number) => number;
  export default any;
}

declare module "d3-contour" {
  export const contours: any;
  export default any;
}

declare module "d3" {
  const d3: any;
  export = d3;
}

// Allow importing images and other non-TS assets if needed
declare module "*.png";
declare module "*.svg";
