// Brand-colored social icons. Update `href` values with your real links.
export const SOCIAL_LINKS = [
  {
    name: "WhatsApp",
    href: "https://wa.me/919876543210",
    hoverColor: "#25D366",
    Icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M17.6 6.3A8.8 8.8 0 0012 4a8.9 8.9 0 00-7.7 13.4L3 21l3.7-1.2A8.9 8.9 0 0012 21a8.9 8.9 0 006.3-15.2c-.2-.2-.5-.4-.7-.5zM12 19.3a7.3 7.3 0 01-3.7-1l-.3-.2-2.2.7.7-2.1-.2-.3A7.4 7.4 0 1119.4 12 7.4 7.4 0 0112 19.3zm4-5.5c-.2-.1-1.3-.6-1.5-.7s-.4-.1-.5.1-.5.7-.7.8-.3.2-.5.1a6 6 0 01-1.8-1.1 6.7 6.7 0 01-1.2-1.5c-.1-.2 0-.3.1-.5l.3-.4a1.3 1.3 0 00.2-.4.5.5 0 000-.4c-.1-.1-.5-1.3-.7-1.8s-.4-.4-.5-.4h-.5a.9.9 0 00-.7.3 2.9 2.9 0 00-.9 2.1 5 5 0 001 2.6 11.4 11.4 0 004.4 3.9c.6.3 1.1.4 1.5.6a3.6 3.6 0 001.6.1 2.7 2.7 0 001.8-1.2 2.2 2.2 0 00.1-1.2c-.1-.1-.2-.2-.4-.3z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/sachin_28022005?igsh=MTNtY2kzaTlqaDl6cw==",
    hoverColor: "#E1306C",
    Icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://facebook.com/mdn.nutrition",
    hoverColor: "#1877F2",
    Icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M13.5 21v-7.5H16l.4-3H13.5V8.4c0-.9.2-1.5 1.5-1.5h1.6V4.2A22 22 0 0014.3 4c-2.4 0-4 1.5-4 4.1v2.4H7.8v3h2.5V21h3.2z" />
      </svg>
    ),
  },
  {
    name: "Email",
    href: "mailto:sachin.codes01@gamil.com",
    hoverColor: "#22B14C",
    Icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function SocialRow({ size = 34, gap = "gap-3", className = "" }) {
  return (
    <div className={`flex items-center ${gap} ${className}`}>
      {SOCIAL_LINKS.map(({ name, href, hoverColor, Icon }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={name}
          style={{ width: size, height: size, "--hover-color": hoverColor }}
          className="group flex items-center justify-center rounded-full border border-white/10 text-mdn-gray
                     transition-all duration-200 hover:-translate-y-0.5 hover:border-transparent
                     hover:text-[var(--hover-color)] hover:shadow-[0_0_14px_var(--hover-color)]"
        >
          <Icon width={size * 0.5} height={size * 0.5} />
        </a>
      ))}
    </div>
  );
}