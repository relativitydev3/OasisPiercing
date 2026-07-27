function stripHtml(value) {
  if (value == null) return value;
  return String(value).replace(/<[^>]*>/g, '').trim();
}

module.exports = { stripHtml };
