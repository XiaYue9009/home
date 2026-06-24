/** 浏览器可用的简易 frontmatter 解析（替代 gray-matter） */
export function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { data: {}, content: raw.trim() };
  }

  return {
    data: parseSimpleYaml(match[1]),
    content: match[2].trim(),
  };
}

function parseSimpleYaml(yaml) {
  const data = {};

  for (const line of yaml.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    let value = trimmed.slice(colonIdx + 1).trim();

    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
      continue;
    }

    if (value === 'true') {
      data[key] = true;
      continue;
    }

    if (value === 'false') {
      data[key] = false;
      continue;
    }

    data[key] = value.replace(/^['"]|['"]$/g, '');
  }

  return data;
}
