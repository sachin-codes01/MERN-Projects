import BoltIcon from '@mui/icons-material/Bolt'
import GroupsIcon from '@mui/icons-material/Groups'
import PermMediaIcon from '@mui/icons-material/PermMedia'
import LockIcon from '@mui/icons-material/Lock'
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled'
import ImageIcon from '@mui/icons-material/Image'
import FavoriteIcon from '@mui/icons-material/Favorite'
import Diversity3Icon from '@mui/icons-material/Diversity3'
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom'
import SchoolIcon from '@mui/icons-material/School'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'

// ==========================================================
// LANDING PAGE KA SAARA TEXT EK JAGAH
//
// Section components me sirf DESIGN rehta hai, likha hua text yahan.
// Kuch badalna ho (naya feature, naya FAQ) to sirf yahi file kholni hai -
// JSX me kahin dhoondhne ki zarurat nahi
// ==========================================================

// ----------------------------------------------------------
// NAVBAR KE BEECH WALE BUTTONS
//
// Ye page ke sections par le jate hain. href me jo id likhi hai
// wahi id us section par bhi honi chahiye (dekho SimpleSections.jsx) -
// naam badlo to dono jagah badalna
// ----------------------------------------------------------
export const navButtons = [
  { href: '#how', label: 'How It Works' },
  { href: '#features', label: 'Features' },
  { href: '#reviews', label: 'Reviews' },
]

export const features = [
  { no: '01', icon: <BoltIcon />, title: 'Real-time', text: 'Socket.IO keeps every message, typing dot and online badge in sync. No refresh, ever.' },
  { no: '02', icon: <GroupsIcon />, title: 'Groups', text: 'Create a group, add people you already chat with, and hand out admin controls.' },
  { no: '03', icon: <PermMediaIcon />, title: 'Media', text: 'Send photos and short videos. Stored on Cloudinary, never in the database.' },
  { no: '04', icon: <LockIcon />, title: 'Private', text: 'Google sign-in, httpOnly cookies, and block controls that work both ways.' },
]

export const steps = [
  { no: '01', title: 'Sign in', text: 'One tap with Google. No password to remember or leak.' },
  { no: '02', title: 'Find people', text: 'Search anyone by name or email and send the first message.' },
  { no: '03', title: 'Start talking', text: 'Text, photos, short videos, groups. Everything in real time.' },
]

// ----------------------------------------------------------
// KAUN USE KARTA HAI
//
// Features batata hai app KYA karta hai, ye batata hai KISKE LIYE
// hai - alag angle hai, isliye baat dohrayi nahi jaati
// ----------------------------------------------------------
export const useCases = [
  {
    icon: <Diversity3Icon />,
    title: 'Close friends',
    text: 'The group chat that never really stops. Share photos, plan the weekend, and pick the thread back up whenever.',
  },
  {
    icon: <FamilyRestroomIcon />,
    title: 'Family',
    text: 'Stay close to the people back home. Nothing to teach anyone - they sign in with Google and start talking.',
  },
  {
    icon: <SchoolIcon />,
    title: 'Study groups',
    text: 'One place for notes, doubts and last-minute plans before an exam, instead of five scattered chats.',
  },
  {
    icon: <EmojiEventsIcon />,
    title: 'Teams & clubs',
    text: 'Announce practice, share match photos, and keep everyone on the same page without a long email chain.',
  },
]

export const stats = [
  { value: '100%', label: 'free to use' },
  { value: '1-tap', label: 'Google sign-in' },
  { value: '0', label: 'ads or spam' },
  { value: '24/7', label: 'always online' },
]

export const faqs = [
  { q: 'Is Vārtālāpaḥ really free?', a: 'Yes, completely free forever. No hidden charges, no premium plans, no ads.' },
  { q: 'Do I need to create a password?', a: "No. Sign in with your Google account and you're in - nothing to remember or lose." },
  { q: 'Is my chat private?', a: 'Yes. Only you and the person you are chatting with can see your messages, and you can block anyone anytime.' },
  { q: 'Can I send photos and videos?', a: 'Yes, you can share photos and short videos directly inside any chat.' },
  { q: 'Can I create a group with friends?', a: 'Yes, create a group, add the people you already chat with, and manage it as an admin.' },
  { q: 'Does it work on my phone?', a: 'Yes, the site is fully responsive and works smoothly on mobile, tablet and desktop.' },
]

// ==========================================================
// FOOTER KE LINKS
//
// Ye saare DEMO links hain - click karne par sirf ek chhota toast
// dikhta hai, kahin redirect nahi hota. Isliye inhe <a href> nahi,
// <button> banaya hai (dekho SimpleSections.jsx ka DemoLink):
//   - href="#" hota to page upar chala jata
//   - href="#features" jaise same-page link bhi nahi chahiye the
//   - button screen reader ko bhi sahi batata hai ki ye navigate
//     nahi karta, sirf kuch karta hai
//
// Asli page ban jayein to DemoLink ki jagah <Link to="..."> laga dena
// ==========================================================
export const footerColumns = [
  {
    title: 'Product',
    links: ['Features', 'Group chats', 'Media sharing', 'Read receipts'],
  },
  {
    title: 'Resources',
    links: ['Documentation', 'Changelog', 'System status', 'Support'],
  },
  {
    title: 'Company',
    links: ['About', 'Blog', 'Careers', 'Contact'],
  },
]

// Neeche wali patti ke chhote links
export const footerLegal = ['Privacy', 'Terms', 'Cookies']

// ==========================================================
// "Two people, one thread" section me tairte hue chips
//
// Pehle 6 chips mobile par bhi dikhte hain (unka top/anim mat badalna -
// mobile ka layout inhi 6 par depend karta hai).
// Baaki 6 sirf md+ (tablet/PC) par - bhara hua look, chhoti screen
// par itne chips bheed kar dete
// ==========================================================
export const messageChips = [
  { kind: 'text', emoji: '👋', text: 'Hey!', top: '0%', anim: 'float-lr', duration: '9s', delay: '0s' },
  { kind: 'text', emoji: '😍', text: 'Awesome!', solid: true, top: '16%', anim: 'float-rl', duration: '9s', delay: '0s', hideOnMobile: true },
  { kind: 'emoji', emoji: '😄', top: '32%', anim: 'float-lr', duration: '9.5s', delay: '-5s' },
  { kind: 'icon', icon: <PlayCircleFilledIcon sx={{ fontSize: { xs: 18, md: 24 } }} />, tone: 'solid', top: '48%', anim: 'float-rl', duration: '9s', delay: '-2s' },
  { kind: 'plain', tone: 'solid', top: '64%', anim: 'float-lr', duration: '8.5s', delay: '-6s' },
  { kind: 'text', emoji: '🎉', text: "Can't wait!", top: '80%', anim: 'float-rl', duration: '9s', delay: '-5s' },

  { kind: 'dots', top: '8%', anim: 'float-lr', duration: '8s', delay: '-3s', hideOnMobile: true },
  { kind: 'icon', icon: <ImageIcon sx={{ fontSize: 22 }} />, top: '24%', anim: 'float-lr', duration: '11s', delay: '-2s', hideOnMobile: true },
  { kind: 'icon', icon: <FavoriteIcon sx={{ fontSize: 20 }} />, tone: 'heart', top: '40%', anim: 'float-rl', duration: '8.5s', delay: '-4s', hideOnMobile: true },
  { kind: 'emoji', emoji: '😍', top: '56%', anim: 'float-rl', duration: '8s', delay: '-6s', hideOnMobile: true },
  { kind: 'plain', tone: 'muted', top: '72%', anim: 'float-rl', duration: '10s', delay: '-3s', hideOnMobile: true },
  { kind: 'text', emoji: '✨', text: "That's cool!", solid: true, top: '86%', anim: 'float-lr', duration: '10.5s', delay: '-1s', hideOnMobile: true },
]

export const testimonials = [
  { quote: 'Google se sign in kiya aur ek minute mein chatting shuru - bahut easy hai, no password to remember.', name: 'Ananya R.', role: 'Early user' },
  { quote: 'Messages turant deliver hote hain, feels like texting, not like a slow web app.', name: 'Rohit S.', role: 'Beta tester' },
  { quote: "Group chat banana aur friends ke saath photos share karna - exactly the way I'd expect it to work.", name: 'Priya M.', role: 'Early user' },
  { quote: 'Bhai ekdum smooth chalta hai app, real-time messaging is genuinely fast.', name: 'Aman K.', role: 'Early user' },
  { quote: 'Interface bahut clean hai aur signup process itna simple ki 1 minute mein done ho gaya.', name: 'Sneha V.', role: 'Beta tester' },
  { quote: 'No ads, no spam - bas seedha message bhejo aur baat karo. Loved it!', name: 'Karan T.', role: 'Early user' },
  { quote: 'Video aur photo sharing dono smooth chale, kaafi impressed hoon is app se.', name: 'Ishita D.', role: 'Early user' },
  { quote: 'Free hai, fast hai, aur secure bhi - ek chat app mein aur kya chahiye.', name: 'Rahul B.', role: 'Beta tester' },
  { quote: 'Maine apne poore college group ko yahan shift kar diya, sabko pasand aaya.', name: 'Divya K.', role: 'Early user' },
  { quote: 'Design bahut clean hai, kahin bhi confusion nahi hota use karte waqt.', name: 'Saurabh J.', role: 'Beta tester' },
  { quote: "Doosri app se switch kiya aur regret nahi hua ek baar bhi. It's genuinely fast.", name: 'Meera N.', role: 'Early user' },
  { quote: 'Block feature dono taraf se kaam karta hai, privacy ka acha khayal rakha hai.', name: 'Yash R.', role: 'Early user' },
  { quote: 'Message delivery itni fast hai ki lagta hi nahi internet pe chal raha hai.', name: 'Pooja L.', role: 'Beta tester' },
  { quote: 'Sign up mein zero friction - Google account se click aur andar. Simple as that.', name: 'Arjun M.', role: 'Early user' },
  { quote: 'Group admin controls handy hain, spam log ko manage karna easy ho gaya.', name: 'Tanya H.', role: 'Early user' },
  { quote: 'Photos bhejne mein quality kam nahi hoti, ye baat sabse zyada pasand aayi.', name: 'Deepak C.', role: 'Beta tester' },
  { quote: 'Bahut hi lightweight app hai, purane phone pe bhi bina lag ke chalta hai.', name: 'Kavya P.', role: 'Early user' },
  { quote: 'Dark theme easy on the eyes hai, raat ko chat karte waqt kaafi comfortable lagta hai.', name: 'Harsh V.', role: 'Early user' },
  { quote: 'Notifications time pe aati hain, koi message miss nahi hota.', name: 'Simran A.', role: 'Beta tester' },
  { quote: 'Ek dum straightforward app hai - koi extra clutter nahi, bas chatting.', name: 'Nikhil S.', role: 'Early user' },
  { quote: 'Short videos bhejna kaafi smooth hai, upload bhi jaldi ho jaata hai.', name: 'Ritu G.', role: 'Early user' },
]
