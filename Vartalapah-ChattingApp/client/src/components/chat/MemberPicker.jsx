import { useState } from 'react'
import { Checkbox, InputBase } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ChatAvatar from '@/components/ui/ChatAvatar.jsx'
import UserIdentity from '@/components/ui/UserIdentity.jsx'
import { fieldSx } from '@/styles/muiStyles.js'

// ==========================================================
// MEMBER PICKER
//
// "Search + checkbox wali list" - do jagah bilkul ek jaisi chahiye:
// naya group banate waqt, aur group me members add karte waqt.
//
// Isliye ye apni file me hai. Selection ka state parent rakhta hai
// (useSelection hook se) - is component ka apna state sirf search box
// ka text hai, kyunki wo bahar kisi ko nahi chahiye
// ==========================================================
const MemberPicker = ({ people, selected, onToggle }) => {
  const [search, setSearch] = useState('')

  const query = search.trim().toLowerCase()

  const filtered = query
    ? people.filter(
        (person) =>
          person.name.toLowerCase().includes(query) ||
          (person.email || '').toLowerCase().includes(query)
      )
    : people

  return (
    <>
      <div className="flex items-center gap-2 bg-app-bg rounded-full px-3 py-1.5 mt-2 no-zoom-input">
        <SearchIcon fontSize="small" className="text-app-muted" />
        <InputBase
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search people..."
          className="w-full text-sm"
          sx={fieldSx}
          inputProps={{ 'aria-label': 'Search people to add' }}
        />
      </div>

      <div className="max-h-52 overflow-y-auto thin-scroll chat-scroll mt-2" role="group">
        {filtered.length === 0 && (
          <div className="text-center py-4 px-2">
            <p className="text-sm text-app-muted">
              {query ? 'No people found' : 'Nobody available to add'}
            </p>

            {/* Khali list ki WAJAH batana zaroori hai - warna user
                samajhta hai ki app toot gayi hai */}
            {!query && (
              <p className="text-xs text-app-muted mt-1">
                You can only add people you have already chatted with. Send them a message
                first from "All people".
              </p>
            )}
          </div>
        )}

        {filtered.map((person) => (
          <label
            key={person._id}
            className="flex items-center gap-2 py-1.5 px-1 cursor-pointer hover:bg-app-hover rounded no-tap-flash"
            style={{ minHeight: 48 }}
          >
            {/* <label> me lapetne se poori row par tap karne se checkbox
                badalta hai - aur screen reader ko bhi naam sunayi deta hai */}
            <Checkbox
              size="small"
              checked={selected.includes(person._id)}
              onChange={() => onToggle(person._id)}
            />

            <ChatAvatar user={person} size={30} />

            <UserIdentity name={person.name} email={person.email} />
          </label>
        ))}
      </div>
    </>
  )
}

export default MemberPicker
