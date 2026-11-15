import { thumbImage } from "./handleImage";

/** 仅更新浏览器标签页图标；返回清理函数，恢复图标并忽略过期图片加载。 */
export const setChannelFavicon = (background: string) => {
  const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!icon || !background) return;

  const previousHref = icon.getAttribute("href");
  const previousType = icon.getAttribute("type");
  const previousSizes = icon.getAttribute("sizes");
  let active = true;
  const restore = () => {
    for (const [name, value] of [
      ["href", previousHref],
      ["type", previousType],
      ["sizes", previousSizes],
    ] as const) {
      if (value === null) icon.removeAttribute(name);
      else icon.setAttribute(name, value);
    }
  };

  const image = new Image();
  image.onload = () => {
    if (!active) return;
    try {
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      if (!side) return;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 64;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(
        image,
        (image.naturalWidth - side) / 2,
        (image.naturalHeight - side) / 2,
        side, side, 0, 0, 64, 64
      );
      const href = canvas.toDataURL("image/png");
      icon.setAttribute("type", "image/png");
      icon.setAttribute("sizes", "64x64");
      icon.setAttribute("href", href);
    } catch {
      // Canvas 不可用或图片来源不允许读取时，保持默认图标。
      restore();
    }
  };
  image.onerror = () => { if (active) restore(); };
  image.src = thumbImage(background);

  return () => {
    active = false;
    image.onload = image.onerror = null;
    restore();
  };
};
