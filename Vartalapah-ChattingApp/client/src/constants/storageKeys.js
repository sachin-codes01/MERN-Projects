// ==========================================================
// LOCAL STORAGE KEYS
//
// Ye string pehle seedhe code me likhi hui thi ('instachats_theme'
// waghera). Do dikkatein thin:
//   - typo pakda hi nahi jata: 'instachats_them' likhne par koi error
//     nahi aata, bas setting chup-chaap save hona band ho jati hai
//   - browser me kya kya save hota hai, ye jaanne ke liye poori
//     codebase me dhoondhna padta tha
//
// "instachats" purana naam hai (app ab Vārtālāpaḥ hai). Key jaan
// boojhkar nahi badli - badalne par purane users ki theme aur
// settings reset ho jatin
// ==========================================================
export const STORAGE_KEYS = {
  // 'light' ya 'dark'
  theme: 'instachats_theme',

  // "All people" tab aakhri baar kab kholi thi (timestamp).
  // Isse pata chalta hai ki uske baad kitne naye users aaye
  allPeopleSeenAt: 'instachats_all_seen_at',
}
