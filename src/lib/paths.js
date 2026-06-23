/** 拼接 GitHub Pages base 路径，如 /home/lol */
export function withBase(path = '') {
  const base = import.meta.env.BASE_URL;
  if (!path || path === '/') return base;
  return `${base}${String(path).replace(/^\/+/, '')}`;
}

/** 当前路径是否匹配某站内链接（用于导航高亮） */
export function isActivePath(pathname, href) {
  const normalize = (value) => value.replace(/\/+$/, '') || '/';
  const current = normalize(pathname);
  const target = normalize(href);
  const home = normalize(import.meta.env.BASE_URL);

  if (target === home || target === '/') {
    return current === home || current === '/';
  }

  return current === target || current.startsWith(`${target}/`);
}
