// Status code ke saath error banata hai — controller me bas `throw httpError(404, '...')` likho
export const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode })

// Request body se sirf allowed fields uthata hai, taaki koi extra field (jaise role) na bhej sake
export const pick = (obj = {}, keys) =>
  Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]))

// Search box ka text regex me safe banane ke liye
export const escapeRegex = (text = '') => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const slugify = (text = '') =>
  text
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
