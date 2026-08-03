import { useCallback, useState } from 'react'

// ==========================================================
// useSelection - "kai me se kuch chuno" wali list
//
// Ye bilkul wahi teen line ka logic hai jo TEEN jagah copy hua tha:
// naya group banate waqt members chunna, group me members add karna,
// aur message forward karte waqt chats chunna. Teeno jagah likha tha:
//
//   const [selected, setSelected] = useState([])
//   const toggle = (id) => setSelected(prev =>
//     prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
//
// Ab ek hi jagah hai. Aage koi "Select all" jaisa button chahiye ho
// to teeno jagah apne aap mil jayega
// ==========================================================
export const useSelection = () => {
  const [selected, setSelected] = useState([])

  // Pehle se chuna hua hai to hata do, warna jod do
  const toggle = useCallback((id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const clear = useCallback(() => setSelected([]), [])

  const isSelected = useCallback((id) => selected.includes(id), [selected])

  return { selected, toggle, clear, isSelected, count: selected.length }
}
