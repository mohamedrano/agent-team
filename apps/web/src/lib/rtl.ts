export const isRTL = (lang: string): boolean => {
  return lang?.startsWith("ar") ?? false;
};

export const getDirection = (lang: string): "ltr" | "rtl" => {
  return isRTL(lang) ? "rtl" : "ltr";
};

export const applyDirection = (lang: string) => {
  if (typeof document === "undefined") return;
  const dir = getDirection(lang);
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
};

