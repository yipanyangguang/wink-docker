export const buildWinkShareUrl = (shareId: string) =>
  `${window.location.origin}${import.meta.env.BASE_URL}#/wink?shareId=${encodeURIComponent(shareId)}`;

export const copyText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 继续使用兼容旧版 iOS 浏览器的降级方案。
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
};
