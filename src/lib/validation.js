function isHttpUrl(value) {
  if (typeof value !== "string" || !/^https?:\/\/[^/\\\s]/i.test(value.trim())) return false;
  try {
    const { protocol } = new URL(value.trim());
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

module.exports = { isHttpUrl };
