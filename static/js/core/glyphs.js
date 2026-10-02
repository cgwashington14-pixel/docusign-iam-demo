// Outline glyphs for script-rendered content (markup is injected by base.html as DS_GLYPHS).

const DS_EMOJI_GLYPH = {
  '📋': 'clipboard', '👤': 'user', '👥': 'users', '🏛': 'building', '🏢': 'building', '📎': 'paperclip',
  '✍': 'signature', '🏁': 'flag', '💰': 'coins', '💵': 'coins', '📝': 'pencil', '✎': 'pencil',
  '⭐': 'sparkles', '★': 'sparkles', '✦': 'sparkles', '⚖': 'scale', '📥': 'inbox', '💻': 'monitor',
  '🌐': 'globe', '⚡': 'bolt', '✉': 'mail', '🎯': 'target', '📘': 'document', '📄': 'document',
  '🔗': 'link', '📊': 'chart', '⚙': 'gear', '🛠': 'gear', '💬': 'chat', '🗂': 'folder',
  '🔔': 'bell', '📢': 'bell', '🏆': 'flag', '⚠': 'alert',
};

function dsGlyph(name, size) {
  const svg = (window.DS_GLYPHS || {})[name] || '';
  return size ? svg.replace(/width="[^"]*" height="[^"]*"/, `width="${size}" height="${size}"`) : svg;
}

/** Swap a pictographic character for its outline glyph; other text passes through. */
function dsIcon(ch, size) {
  const name = DS_EMOJI_GLYPH[ch];
  return name ? dsGlyph(name, size) : (ch || '');
}
