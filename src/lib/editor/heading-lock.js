export function isSelectionInFirstHeading(root) {
  if (!root) return false;

  const selection = window.getSelection();
  if (!selection?.rangeCount) return false;

  const first = root.firstElementChild;
  if (!first || first.tagName !== 'H1') return false;

  let node = selection.anchorNode;
  while (node && node !== root) {
    if (node === first) return true;
    node = node.parentNode;
  }

  return false;
}

export function enforceFirstHeadingHtml(root, fallbackTitle = '未命名') {
  if (!root) return;

  const first = root.firstElementChild;
  if (!first || first.tagName !== 'H1') {
    const h1 = document.createElement('h1');
    const text = first?.textContent?.trim() || fallbackTitle;
    h1.textContent = text;
    if (first) {
      root.replaceChild(h1, first);
    } else {
      root.prepend(h1);
    }
  } else if (!first.textContent?.trim()) {
    first.textContent = fallbackTitle;
  }
}

export function shouldBlockHeadingLevelChange(event, root) {
  if (!isSelectionInFirstHeading(root)) return false;

  const key = event.key.toLowerCase();
  const shift = event.shiftKey;

  if (shift) return false;
  if (key === '0') return true;
  if (/^[2-6]$/.test(key)) return true;

  return false;
}

export function shouldBlockFirstHeadingRemoval(event, root) {
  if (!isSelectionInFirstHeading(root)) return false;
  if (event.key !== 'Backspace' && event.key !== 'Delete') return false;

  const first = root.firstElementChild;
  if (!first || first.tagName !== 'H1') return false;

  const text = first.textContent || '';
  if (text.length > 0) return false;

  return true;
}
