import InstagramIcon from '@mui/icons-material/Instagram'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import GitHubIcon from '@mui/icons-material/GitHub'
import MailOutlineIcon from '@mui/icons-material/MailOutline'

// Poster images - local files hain (koi internet se image nahi aati)
// Sab 1024 x 1024 hain yaani bilkul square
import poster1 from '../../assets/posters/poster-1.png'
import poster2 from '../../assets/posters/poster-2.png'
import poster3 from '../../assets/posters/poster-3.png'
import poster4 from '../../assets/posters/poster-4.png'
import poster5 from '../../assets/posters/poster-5.png'
import poster6 from '../../assets/posters/poster-6.png'

// ==========================================================
// HERO KE COMMON HISSE
//
// Home page aur Login page dono par ek jaisa top section hai.
// Isliye ye do cheezein yahan rakh di hain - dono jagah wahi code
// dobara likhne ki zarurat nahi padti. Kuch badalna ho to sirf yahan badlo.
// ==========================================================

const slides = [poster1, poster2, poster3, poster4, poster5, poster6]

// Left rail ke social icons
// href abhi nahi diya - tumhare asli links aayein to yahan daal dena
const socials = [
  { icon: <InstagramIcon sx={{ fontSize: 17 }} />, label: 'Instagram' },
  { icon: <LinkedInIcon sx={{ fontSize: 17 }} />, label: 'LinkedIn' },
  { icon: <GitHubIcon sx={{ fontSize: 17 }} />, label: 'GitHub' },
  { icon: <MailOutlineIcon sx={{ fontSize: 17 }} />, label: 'Email' },
]

// ----------------------------------------------------------
// LEFT RAIL
// Patli vertical line + dashes + hamburger + social icons
// lg se chhoti screen par chhupa dete hain, wahan jagah nahi hoti
// ----------------------------------------------------------
export const HeroRail = () => (
  <div className="hidden lg:flex absolute left-0 top-0 bottom-0 w-20 z-20 flex-col items-center py-8">
    {/* Upar solid line */}
    <div className="w-px h-16 bg-app-border" />

    {/* Beech me dashes - line tuti hui dikhti hai */}
    <div className="flex flex-col gap-1.5 my-4">
      {[...Array(5)].map((_, i) => (
        <span key={i} className="w-px h-2 bg-app-border" />
      ))}
    </div>

    {/* Hamburger - teen chhoti lines */}
    <div className="flex flex-col gap-1 my-4">
      <span className="w-4 h-px bg-app-muted" />
      <span className="w-4 h-px bg-app-muted" />
      <span className="w-3 h-px bg-app-muted" />
    </div>

    {/* Ye line baaki ki jagah le leti hai, isse icons neeche chale jate hain */}
    <div className="w-px flex-1 bg-app-border" />

    {/* Neeche social icons */}
    <div className="flex flex-col gap-4 my-5 text-app-muted">
      {socials.map((s) => (
        <span
          key={s.label}
          title={s.label}
          className="hover:text-brand transition-colors cursor-pointer"
        >
          {s.icon}
        </span>
      ))}
    </div>

    <div className="w-px h-10 bg-app-border" />
  </div>
)

// ----------------------------------------------------------
// SLIDE HOTI IMAGES
// Images upar se neeche khisakti rehti hain
//
// List DO baar render karte hain aur CSS animation poori strip ko
// -50% se 0% tak le jati hai. Jab pehli copy khatam hoti hai tab
// dusri copy bilkul usi jagah hoti hai - loop ka jodh dikhta hi nahi
// ----------------------------------------------------------
export const HeroImages = () => (
  <div className="relative h-[300px] sm:h-[420px] lg:h-full overflow-hidden lg:ml-20">
    {/* gap-7 se do images ke beech thodi jagah rehti hai.
        Gap flex container par hai isliye har jodi ke beech ek jaisa
        rehta hai - loop ke jodh par bhi */}
    <div className="marquee-track flex flex-col gap-7">
      {[...slides, ...slides].map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          // aria-hidden kyunki ye sirf sajawat hai, koi jaankari nahi deti
          aria-hidden="true"
          // Poster 1024x1024 (square) hain, isliye slide ko bhi aspect-square
          // rakha hai - image poori dikhti hai, na kinare kate na kheenchi jaye.
          // object-fill ka matlab: agar kabhi koi image square na ho to wo
          // kat-ne ki jagah thodi kheench kar poori fit ho jayegi
          className="block w-full aspect-square object-fill shrink-0"
        />
      ))}
    </div>
  </div>
)
