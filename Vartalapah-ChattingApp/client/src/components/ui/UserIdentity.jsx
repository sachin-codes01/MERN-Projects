// ==========================================================
// USER IDENTITY
//
// "Naam bada, email neeche chhota aur gray" - ye pattern profile
// dialog, search results (member picker) aur khud ki profile row
// me barabar dikhna chahiye. Ek jagah rakha hai taaki teeno hamesha
// sync rahein.
//
// Chat header aur chat-list rows me isse jaan-boojhkar NAHI lagaya -
// wahan already zaroori live info hai (online/typing status, last
// message preview). Email ke liye wo hata dete to chatting karte waqt
// kaam ki cheez gayab ho jati
// ==========================================================
const UserIdentity = ({ name, email, align = 'left', size = 'md', className = '' }) => {
  const nameSize = size === 'lg' ? 'text-lg' : 'text-sm'
  const emailSize = size === 'lg' ? 'text-sm' : 'text-xs'

  return (
    <div className={`min-w-0 ${align === 'center' ? 'text-center' : 'text-left'} ${className}`}>
      <p className={`${nameSize} font-semibold truncate`}>{name}</p>
      {email && (
        <p className={`plain-text ${emailSize} text-app-muted truncate`}>{email}</p>
      )}
    </div>
  )
}

export default UserIdentity
