const MAX_SEARCH_LENGTH = 120;

function sanitizeSearch(raw) {
  if (typeof raw !== 'string') return '';
  let value = raw.slice(0, MAX_SEARCH_LENGTH);
  value = value.replace(/[<>"'`;\\%_]/g, ' ');
  value = value.replace(/\s+/g, ' ').trim();
  return value;
}

function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, (char) => `\\${char}`);
}

function slugify(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

module.exports = { sanitizeSearch, escapeLike, slugify };
