// Collection tile: photo, neeche dark fade aur safed bold title.
// Poora card hi button hai — kahin bhi click karo, collection khulta hai (Shop pill hata diya).
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
      <span className="font-heading text-[17px] font-bold leading-tight text-white drop-shadow-sm sm:text-[21px]">{title}</span>
    </span>
  </button>
);

export default ImageTile;
