export const validImageUrl = url => /^https?:\/\/\S+$/i.test(url) || /^\/api\/media\/[a-f0-9-]+\.(png|jpg|webp)$/.test(url)
