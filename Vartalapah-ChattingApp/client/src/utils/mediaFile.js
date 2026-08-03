// ==========================================================
// MEDIA DOWNLOAD / SHARE
//
// Cloudinary ka URL dusre origin par hai. Seedha <a download> lagane se
// browser use IGNORE kar deta hai (cross-origin download attribute par
// bharosa nahi karta) aur image bas ek naye tab me khul jati hai.
//
// Isliye pehle file ko fetch karke blob banate hain - blob apne hi
// origin ka hota hai, isliye download attribute wahan pakka chalta hai
// ==========================================================

// URL ke aakhir se file ka naam nikaal lete hain
// ".../v1712/vartalapah/abc123.jpg" -> "abc123.jpg"
const nameFromUrl = (url, fallbackExt) => {
  try {
    const path = new URL(url).pathname
    const last = path.split('/').pop() || ''

    // Naam me extension already hai to wahi rakh lo
    if (last.includes('.')) return decodeURIComponent(last)

    return `${last || 'vartalapah'}.${fallbackExt}`
  } catch {
    return `vartalapah-media.${fallbackExt}`
  }
}

// Message se ek achha sa file naam - "vartalapah-photo-2026-08-03.jpg"
export const fileNameFor = (message) => {
  const isVideo = message?.messageType === 'video'
  const ext = isVideo ? 'mp4' : 'jpg'
  const raw = nameFromUrl(message?.mediaUrl || '', ext)

  // Cloudinary ke random naam ki jagah kuch padhne layak
  const date = new Date(message?.createdAt || Date.now()).toISOString().slice(0, 10)
  const suffix = raw.split('.').pop()

  return `vartalapah-${isVideo ? 'video' : 'photo'}-${date}.${suffix}`
}

// Blob ko file ki tarah save karne wala chhota helper
const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.rel = 'noopener'

  // Firefox me link DOM me hona zaroori hai, warna click kaam nahi karta
  document.body.appendChild(link)
  link.click()
  link.remove()

  // Turant revoke karne par kabhi kabhi download shuru hone se pehle hi
  // URL mar jata hai - isliye ek pal ka intezaar
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

// ==========================================================
// DOWNLOAD
// Original quality - koi resize/compress nahi. Cloudinary ka wahi URL
// jo message me save hai, wahi asli file hai
// ==========================================================
export const downloadMedia = async (message) => {
  const url = message?.mediaUrl
  if (!url) throw new Error('Nothing to download')

  const filename = fileNameFor(message)

  try {
    const res = await fetch(url, { mode: 'cors', credentials: 'omit' })
    if (!res.ok) throw new Error('Download failed')

    saveBlob(await res.blob(), filename)
  } catch {
    // CORS band ho ya net gir jaye to kam se kam nayi tab me khol dete
    // hain - wahan se user khud "Save image" kar sakta hai
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

// Ye device sach me share kar sakta hai ya nahi
export const canShare = () => typeof navigator !== 'undefined' && !!navigator.share

// ==========================================================
// SHARE
// Mobile ka native share sheet (WhatsApp, Gmail, Save to Files...)
//
// Do darje: pehle poori FILE share karne ki koshish, wo na ho to
// sirf LINK. File share sabhi browser me nahi hai (navigator.canShare
// ke bina bhej doge to exception aata hai)
// ==========================================================
export const shareMedia = async (message) => {
  const url = message?.mediaUrl
  if (!url) throw new Error('Nothing to share')
  if (!navigator.share) throw new Error('Sharing is not supported on this device')

  const filename = fileNameFor(message)

  try {
    const res = await fetch(url, { mode: 'cors', credentials: 'omit' })
    const blob = await res.blob()
    const file = new File([blob], filename, { type: blob.type })

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Vārtālāpaḥ' })
      return
    }
  } catch (err) {
    // User ne share sheet band kar diya - ye error nahi hai
    if (err?.name === 'AbortError') return
  }

  try {
    await navigator.share({ url, title: 'Vārtālāpaḥ' })
  } catch (err) {
    if (err?.name !== 'AbortError') throw err
  }
}
