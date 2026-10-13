/** Add only official map assets you are permitted to distribute. Never infer coordinates. */
export const bundledMaps: {
  name: string;
  url: string;
  mime: "application/pdf" | "image/png" | "image/jpeg" | "image/webp";
  source: string;
}[] = [];
