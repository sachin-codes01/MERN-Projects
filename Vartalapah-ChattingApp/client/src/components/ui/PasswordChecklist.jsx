import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'

// ==========================================================
// PASSWORD CHECKLIST
// Live checklist - type karte hi har niyam ke aage green tick lag jata hai.
// Rules aur "kaunsa pass hua" ka hisaab hooks/ui/usePasswordRules.js karta hai -
// ye component sirf usko dikhata hai
// ==========================================================
const PasswordChecklist = ({ results }) => (
  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 -mt-1" aria-label="Password requirements">
    {results.map((rule) => (
      <li key={rule.key} className="flex items-center gap-1.5 text-xs">
        {rule.ok ? (
          <CheckCircleIcon sx={{ fontSize: 15 }} className="text-green-400 shrink-0" />
        ) : (
          <RadioButtonUncheckedIcon sx={{ fontSize: 15 }} className="text-app-muted shrink-0" />
        )}
        <span className={rule.ok ? 'text-app-text' : 'text-app-muted'}>{rule.label}</span>
      </li>
    ))}
  </ul>
)

export default PasswordChecklist
