// Reference ka "What's Your Target?" wala tile: photo, neeche dark fade,
// upar safed bold title aur chhota "Shop" pill. Collections aur Goals dono
// isi ko use karte hain, taaki dono sections ek jaise dikhein.
const ImageTile = ({ title, image, onClick, ratio = "aspect-[4/5]", imgClassName = "object-cover object-top" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`lift press group relative block w-full overflow-hidden rounded-xl border border-transparent bg-mdn-sand text-left shadow-xs ${ratio}`}
  >
    {image && (
      <img
        src={image}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 h-full w-full transition-transform duration-700 ease-brand-out group-hover:scale-[1.07] ${imgClassName}`}
      />
    )}
    <span
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/25 to-transparent"
    />
    <span className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 p-3 sm:p-4">
      <span className="font-heading text-[15px] font-bold leading-tight text-white drop-shadow-sm sm:text-lg">{title}</span>
      <span className="inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 font-heading text-xs font-semibold text-[#241f1a] transition-colors duration-200 group-hover:bg-mdn-orange-solid group-hover:text-white">
        Shop
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="transition-transform duration-300 group-hover:translate-x-0.5">
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </span>
  </button>
);

export default ImageTile;
