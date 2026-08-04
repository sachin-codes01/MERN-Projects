// ==========================================================
// API TEST SCRIPT
// Chalane se pehle server chalu hona chahiye (npm run dev)
// Phir dusre terminal me: npm test
//
// Ye script 3 test users banati hai, unke JWT tokens khud sign karti hai
// (isliye Google login ki zarurat nahi), poori API test karti hai,
// aur aakhir me saara test data database se hata deti hai
// ==========================================================
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const { User, Group, Message } = require('./models')

const API = 'http://localhost:5000/api'

let pass = 0
let fail = 0
const failures = []

const check = (name, ok, extra = '') => {
  if (ok) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; failures.push(`${name} ${extra}`); console.log(`  FAIL  ${name}  ${extra}`) }
}

const tokenFor = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' })

const call = async (token, method, url, body) => {
  const res = await fetch(`${API}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Cookie: `instachats_token=${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  let data = {}
  try { data = await res.json() } catch {}
  return { status: res.status, data }
}

const run = async () => {
  // dbName wahi jo config/db.js use karta hai - warna test alag database
  // bana dega (URI me purana naam pada ho to)
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME || 'vartalapah-chatting-webapp',
    serverSelectionTimeoutMS: 15000,
  })
  console.log('Connected to', mongoose.connection.name, '\n')

  const stamp = Date.now()
  const mk = (n) => ({ name: `E2E ${n}`, email: `e2e_${n}_${stamp}@test.local`, googleId: `g_${n}_${stamp}` })

  const A = await User.create(mk('Alice'))
  const B = await User.create(mk('Bob'))
  const C = await User.create(mk('Carol'))

  const ta = tokenFor(A._id), tb = tokenFor(B._id), tc = tokenFor(C._id)
  const createdGroups = []

  try {
    // ---------- AUTH ----------
    console.log('AUTH')
    let r = await call(ta, 'GET', '/auth/me')
    check('GET /auth/me returns me', r.status === 200 && r.data.user.email === A.email, `got ${r.status}`)

    r = await call('badtoken', 'GET', '/auth/me')
    check('Invalid token rejected', r.status === 401, `got ${r.status}`)

    r = await call(ta, 'PUT', '/auth/me', { name: 'A' })
    check('Name shorter than 2 chars rejected', r.status === 400, `got ${r.status}`)

    // ---------- USERS + SEARCH ----------
    console.log('\nUSERS + SEARCH')
    r = await call(ta, 'GET', '/users')
    const ids = r.data.users.map((u) => u._id)
    check('User list excludes myself', !ids.includes(A._id.toString()))
    check('User list includes others', ids.includes(B._id.toString()) && ids.includes(C._id.toString()))

    r = await call(ta, 'GET', `/users?search=${encodeURIComponent('E2E Bob')}`)
    check('Search finds Bob only', r.data.users.length === 1 && r.data.users[0]._id === B._id.toString(),
      `got ${r.data.users.length}`)

    r = await call(ta, 'GET', '/users?search=%28%28%28')
    check('Regex-special search does not crash', r.status === 200, `got ${r.status}`)

    // ---------- PRIVATE CHAT ----------
    console.log('\nPRIVATE CHAT')
    r = await call(ta, 'POST', '/messages', { receiver: B._id, text: 'hello bob', messageType: 'text' })
    const msg1 = r.data.message
    check('A sends message to B', r.status === 201, `got ${r.status}`)

    r = await call(ta, 'POST', '/messages', { receiver: B._id, text: '   ', messageType: 'text' })
    check('Empty message rejected', r.status === 400, `got ${r.status}`)

    r = await call(ta, 'POST', '/messages', { receiver: B._id, text: 'x'.repeat(2100), messageType: 'text' })
    check('Too-long message rejected', r.status === 400, `got ${r.status}`)

    r = await call(ta, 'POST', '/messages', { receiver: A._id, text: 'self' })
    check('Cannot message yourself', r.status === 400, `got ${r.status}`)

    r = await call(tb, 'GET', `/messages/${A._id}`)
    check('B sees the message', r.data.messages.length === 1, `got ${r.data.messages?.length}`)

    // ---------- READ RECEIPTS ----------
    console.log('\nREAD RECEIPTS')
    r = await call(ta, 'GET', `/messages/${B._id}`)
    check('Message unread right after sending', r.data.messages[0].isRead === false)

    // B ne sirf list dekhi, chat kholi NAHI - message abhi bhi unread rehna chahiye
    await call(tb, 'GET', '/users')
    await call(tb, 'GET', '/messages/conversations')
    r = await call(ta, 'GET', `/messages/${B._id}`)
    check('Still unread when B only sees the list', r.data.messages[0].isRead === false)

    // B ne messages fetch kiye lekin "read" call nahi ki - tab bhi unread
    await call(tb, 'GET', `/messages/${A._id}`)
    r = await call(ta, 'GET', `/messages/${B._id}`)
    check('Still unread when B only fetches messages', r.data.messages[0].isRead === false)

    // Ab B ne asli me chat kholi
    await call(tb, 'PUT', `/messages/${A._id}/read`)
    r = await call(ta, 'GET', `/messages/${B._id}`)
    check('Marked read only after B actually opens the chat', r.data.messages[0].isRead === true)

    // ---------- CONVERSATIONS / TABS ----------
    console.log('\nCONVERSATIONS (tabs)')
    r = await call(ta, 'GET', '/messages/conversations')
    let conv = r.data.conversations.find((c) => c.userId === B._id.toString())
    check('A: Bob is in Chats (iReplied)', conv?.iReplied === true)

    r = await call(tb, 'GET', '/messages/conversations')
    conv = r.data.conversations.find((c) => c.userId === A._id.toString())
    check('B: Alice is a Request (theyMessaged, not replied)',
      conv?.theyMessaged === true && conv?.iReplied === false)

    // ---------- EDIT / UNSEND ----------
    console.log('\nEDIT / UNSEND')
    r = await call(ta, 'PUT', `/messages/${msg1._id}`, { text: 'edited text' })
    check('A edits own message', r.status === 200 && r.data.message.isEdited === true, `got ${r.status}`)

    r = await call(tc, 'PUT', `/messages/${msg1._id}`, { text: 'hacked' })
    check('C cannot edit A\'s message', r.status === 403, `got ${r.status}`)

    r = await call(tc, 'DELETE', `/messages/${msg1._id}`)
    check('C cannot delete A\'s message', r.status === 403, `got ${r.status}`)

    // ---------- BLOCK ----------
    console.log('\nBLOCK')
    await call(tb, 'PUT', `/users/${A._id}/relation`, { blocked: true })

    r = await call(ta, 'POST', '/messages', { receiver: B._id, text: 'after block' })
    check('Blocked: A cannot message B', r.status === 403, `got ${r.status}`)

    r = await call(tb, 'POST', '/messages', { receiver: A._id, text: 'after block' })
    check('Blocked: B cannot message A either (both ways)', r.status === 403, `got ${r.status}`)

    r = await call(ta, 'GET', '/users')
    let bRow = r.data.users.find((u) => u._id === B._id.toString())
    check('Blocked: online status hidden', bRow.isOnline === false && bRow.canMessage === false)

    // Block par chat me ek system message banna chahiye
    r = await call(tb, 'GET', `/messages/${A._id}`)
    let sys = r.data.messages.filter((m) => m.messageType === 'system')
    check('Block creates a system message', sys.length === 1 && sys[0].text === 'blocked',
      `got ${sys.length} / ${sys[0]?.text}`)
    check('System message does not count as unread', sys[0]?.isRead === true)

    await call(tb, 'PUT', `/users/${A._id}/relation`, { blocked: false })
    r = await call(ta, 'POST', '/messages', { receiver: B._id, text: 'after unblock' })
    check('Unblocked: messaging works again', r.status === 201, `got ${r.status}`)

    r = await call(tb, 'GET', `/messages/${A._id}`)
    sys = r.data.messages.filter((m) => m.messageType === 'system')
    check('Unblock creates a system message', sys.length === 2 && sys[1].text === 'unblocked',
      `got ${sys.length} / ${sys[1]?.text}`)

    // ---------- PIN / ARCHIVE / HIDE ----------
    console.log('\nPIN / ARCHIVE / HIDE')
    await call(ta, 'PUT', `/users/${B._id}/relation`, { pinned: true, archived: true })
    r = await call(ta, 'GET', '/users')
    bRow = r.data.users.find((u) => u._id === B._id.toString())
    check('Pin + archive applied', bRow.isPinned === true && bRow.isArchived === true)

    await call(ta, 'PUT', `/users/${B._id}/relation`, { hidden: true })
    r = await call(ta, 'GET', '/users')
    bRow = r.data.users.find((u) => u._id === B._id.toString())
    check('Hidden flag set', bRow.isHidden === true)

    await call(tb, 'POST', '/messages', { receiver: A._id, text: 'come back' })
    r = await call(ta, 'GET', '/users')
    bRow = r.data.users.find((u) => u._id === B._id.toString())
    check('New message un-hides the person', bRow.isHidden === false)

    r = await call(ta, 'PUT', `/users/${A._id}/relation`, { blocked: true })
    check('Cannot block yourself', r.status === 400, `got ${r.status}`)

    // ---------- GROUPS ----------
    console.log('\nGROUPS')
    r = await call(ta, 'POST', '/groups', { name: 'E2E Group', members: [C._id] })
    check('Cannot add someone you never chatted with', r.status === 400, `got ${r.status} ${r.data.message}`)

    r = await call(ta, 'POST', '/groups', { name: 'X', members: [B._id] })
    check('Group name shorter than 2 chars rejected', r.status === 400, `got ${r.status}`)

    r = await call(ta, 'POST', '/groups', { name: 'E2E Group', members: [] })
    check('Group with no members rejected', r.status === 400, `got ${r.status}`)

    r = await call(ta, 'POST', '/groups', { name: 'E2E Group', members: [B._id] })
    const group = r.data.group
    if (group) createdGroups.push(group._id)
    check('A creates group with Bob', r.status === 201, `got ${r.status} ${r.data.message}`)
    check('Creator is admin', group?.isAdmin === true)
    check('Group has 2 members', group?.members.length === 2, `got ${group?.members.length}`)

    // Non-member access
    r = await call(tc, 'GET', `/messages/group/${group._id}`)
    check('Non-member cannot read group messages', r.status === 403, `got ${r.status}`)

    r = await call(tc, 'POST', '/messages', { group: group._id, text: 'sneak' })
    check('Non-member cannot post to group', r.status === 403, `got ${r.status}`)

    // Admin-only rules
    r = await call(tb, 'PUT', `/groups/${group._id}`, { name: 'Hijacked' })
    check('Non-admin cannot rename group', r.status === 403, `got ${r.status}`)

    r = await call(tb, 'POST', `/groups/${group._id}/members`, { members: [C._id] })
    check('Non-admin cannot add members', r.status === 403, `got ${r.status}`)

    r = await call(tb, 'DELETE', `/groups/${group._id}`)
    check('Non-admin cannot delete group', r.status === 403, `got ${r.status}`)

    // Group messages
    r = await call(ta, 'POST', '/messages', { group: group._id, text: 'hi group' })
    check('A posts to group', r.status === 201, `got ${r.status}`)
    check('Group message has sender name populated', !!r.data.message?.sender?.name)

    r = await call(tb, 'GET', `/messages/group/${group._id}`)
    check('B reads group messages', r.data.messages?.length === 1, `got ${r.data.messages?.length}`)

    // Add C after A chats with C
    await call(ta, 'POST', '/messages', { receiver: C._id, text: 'hi carol' })
    r = await call(ta, 'POST', `/groups/${group._id}/members`, { members: [C._id] })
    check('Admin adds C after chatting with C', r.status === 200, `got ${r.status} ${r.data.message}`)
    check('Group now has 3 members', r.data.group?.members.length === 3, `got ${r.data.group?.members.length}`)

    // Leave / delete rules
    r = await call(tb, 'DELETE', `/groups/${group._id}/members/${B._id}`)
    check('Member can leave the group', r.status === 200, `got ${r.status}`)

    r = await call(ta, 'DELETE', `/groups/${group._id}/members/${A._id}`)
    check('Admin cannot leave while others remain', r.status === 400, `got ${r.status}`)

    // ---------- UNSEND ALL ----------
    console.log('\nUNSEND ALL')

    // Pehle ek fresh message bhejte hain - isse B pakke taur par A ki chat list me aa jata hai
    // (upar "hidden" wale test ne use list se hata diya tha)
    await call(ta, 'POST', '/messages', { receiver: B._id, text: 'sticky test' })

    const beforeMine = await Message.countDocuments({ sender: A._id, receiver: B._id })
    const beforeTheirs = await Message.countDocuments({ sender: B._id, receiver: A._id })

    r = await call(ta, 'DELETE', `/messages/all/${B._id}`)
    const afterMine = await Message.countDocuments({ sender: A._id, receiver: B._id })
    const afterTheirs = await Message.countDocuments({ sender: B._id, receiver: A._id })

    check('Unsend all removed my messages', beforeMine > 0 && afterMine === 0, `${beforeMine} -> ${afterMine}`)
    check('Unsend all kept their messages', afterTheirs === beforeTheirs, `${beforeTheirs} -> ${afterTheirs}`)

    // ---------- CHAT LIST STICKINESS ----------
    // Saare messages unsend karne ke baad bhi banda "Chats" tab me rehna chahiye
    r = await call(ta, 'GET', '/users')
    bRow = r.data.users.find((u) => u._id === B._id.toString())
    check('Person stays in Chats after unsending everything', bRow.inChatList === true)

    // "Remove from list" karne par hi list se hatta hai
    await call(ta, 'PUT', `/users/${B._id}/relation`, { hidden: true })
    r = await call(ta, 'GET', '/users')
    bRow = r.data.users.find((u) => u._id === B._id.toString())
    check('Remove from list clears the chat list entry', bRow.inChatList === false)

    // ---------- UPLOAD ----------
    console.log('\nUPLOAD')
    const up = await fetch(`${API}/upload`, { method: 'POST', headers: { Cookie: `instachats_token=${ta}` } })
    check('Upload without file rejected', up.status === 400, `got ${up.status}`)

    // ---------- DELETE ACCOUNT ----------
    console.log('\nDELETE ACCOUNT')
    const cMsgsBefore = await Message.countDocuments({ sender: C._id })

    r = await call(tc, 'DELETE', '/auth/me')
    check('C deletes account', r.status === 200, `got ${r.status}`)

    r = await call(tc, 'GET', '/auth/me')
    check('Deleted account token no longer works', r.status === 401, `got ${r.status}`)

    r = await call(ta, 'GET', '/users')
    check('Deleted user gone from search',
      !r.data.users.some((u) => u._id === C._id.toString()))

    const cMsgsAfter = await Message.countDocuments({ sender: C._id })
    check('Deleted user messages kept for others', cMsgsAfter === cMsgsBefore, `${cMsgsBefore} -> ${cMsgsAfter}`)

    const freshC = await User.findById(C._id)
    check('Old email freed so re-login makes a new account', freshC.email !== mk('Carol').email.replace(/_\d+@/, '@') && freshC.email.startsWith('deleted_'))

  } finally {
    // ---------- CLEANUP ----------
    console.log('\nCLEANUP')
    const userIds = [A._id, B._id, C._id]
    await Message.deleteMany({ $or: [{ sender: { $in: userIds } }, { receiver: { $in: userIds } }] })
    await Group.deleteMany({ _id: { $in: createdGroups } })
    await Message.deleteMany({ group: { $in: createdGroups } })
    await User.deleteMany({ _id: { $in: userIds } })
    console.log('  test data removed')
  }

  console.log(`\n================  ${pass} passed, ${fail} failed  ================`)
  if (failures.length) console.log('Failures:\n - ' + failures.join('\n - '))

  await mongoose.disconnect()
  process.exit(fail ? 1 : 0)
}

run().catch(async (e) => {
  console.error('SCRIPT ERROR:', e)
  await mongoose.disconnect()
  process.exit(2)
})
