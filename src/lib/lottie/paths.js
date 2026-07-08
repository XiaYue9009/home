/** 拼接 GitHub Pages base 路径，如 /home/lottie/xxx.json */
export function withBase(path) {
  const base = import.meta.env.BASE_URL || '/';
  const normalized = path.replace(/^\//, '');
  return `${base}${normalized}`;
}
