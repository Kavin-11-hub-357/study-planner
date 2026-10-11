import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Bell, BookOpen, CalendarDays, Check,
  CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, Command,
  Flame, GraduationCap, LayoutDashboard, ListChecks, Menu, Moon, MoreHorizontal,
  Pause, Play, Plus, RotateCcw, Search, Settings2, Sparkles, Sun, Target, Timer,
  Trash2, TrendingUp, X, Zap,
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

const STORAGE_KEY = 'studyflow-planner-v1'
const palette = ['#7767e8', '#ef9b72', '#54b6a8', '#e6b84e', '#e77d9b', '#5c9add']
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const navItems = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'schedule', label: 'My schedule', icon: CalendarDays },
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'exams', label: 'Exams', icon: GraduationCap },
  { id: 'focus', label: 'Focus timer', icon: Timer },
]

const dateISO = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}
const todayISO = dateISO(new Date())
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
const readStored = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}
const initialData = () => {
  const saved = readStored()
  return {
    subjects: saved.subjects ?? [
      { id: 's1', name: 'Mathematics', teacher: 'Ms. Olivia', color: palette[0], hours: 12 },
      { id: 's2', name: 'Biology', teacher: 'Dr. Mitchell', color: palette[1], hours: 8 },
      { id: 's3', name: 'Physics', teacher: 'Mr. Chen', color: palette[2], hours: 6 },
      { id: 's4', name: 'Literature', teacher: 'Ms. Harper', color: palette[3], hours: 5 },
    ],
    tasks: saved.tasks ?? [
      { id: 't1', title: 'Review quadratic equations', subjectId: 's1', dueDate: todayISO, priority: 'High', done: false },
      { id: 't2', title: 'Read chapter 8: Cell division', subjectId: 's2', dueDate: todayISO, priority: 'Medium', done: false },
      { id: 't3', title: 'Complete lab report', subjectId: 's3', dueDate: todayISO, priority: 'High', done: true },
      { id: 't4', title: 'Essay outline — The Great Gatsby', subjectId: 's4', dueDate: todayISO, priority: 'Low', done: false },
    ],
    sessions: saved.sessions ?? [
      { id: 'p1', title: 'Algebra practice', subjectId: 's1', date: todayISO, start: '09:00', end: '10:30' },
      { id: 'p2', title: 'Cell biology', subjectId: 's2', date: todayISO, start: '11:00', end: '12:00' },
      { id: 'p3', title: 'Physics problem set', subjectId: 's3', date: todayISO, start: '14:00', end: '15:30' },
      { id: 'p4', title: 'Literature reading', subjectId: 's4', date: todayISO, start: '16:00', end: '17:00' },
    ],
    exams: saved.exams ?? [
      { id: 'e1', title: 'Calculus midterm', subjectId: 's1', date: addDays(todayISO, 8), time: '09:00', location: 'Room 204' },
      { id: 'e2', title: 'Biology final', subjectId: 's2', date: addDays(todayISO, 16), time: '13:30', location: 'Science Hall' },
    ],
    focusSessions: saved.focusSessions ?? 0,
    theme: saved.theme ?? 'light',
    streak: saved.streak ?? 7,
  }
}
function addDays(date, amount) {
  const result = new Date(`${date}T12:00:00`)
  result.setDate(result.getDate() + amount)
  return dateISO(result)
}
const formatDate = (date, options = { weekday: 'long', month: 'long', day: 'numeric' }) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('en-US', options)
const getWeekStart = (date) => {
  const d = new Date(`${date}T12:00:00`)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return dateISO(d)
}
const subjectProgress = (tasks, subjectId) => {
  const subjectTasks = tasks.filter((task) => task.subjectId === subjectId)
  return subjectTasks.length ? Math.round(subjectTasks.filter((task) => task.done).length / subjectTasks.length * 100) : 0
}

function App() {
  const [data, setData] = useState(initialData)
  const location = useLocation()
  const navigate = useNavigate()
  const page = navItems.find((item) => item.id === location.pathname.replace(/^\//, ''))?.id ?? 'dashboard'
  const setPage = (nextPage) => navigate(nextPage === 'dashboard' ? '/' : `/${nextPage}`)
  const [modal, setModal] = useState(null)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    document.documentElement.classList.toggle('dark', data.theme === 'dark')
  }, [data])
  useEffect(() => {
    if (!toast) return undefined
    const timeout = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(timeout)
  }, [toast])

  const update = (key, value) => setData((current) => ({ ...current, [key]: value }))
  const flash = (message) => setToast(message)
  const subjectFor = (id) => data.subjects.find((subject) => subject.id === id)
  const openModal = (type, item = null) => { setEditing(item); setModal(type) }
  const closeModal = () => { setModal(null); setEditing(null) }

  const toggleTask = (id) => {
    const task = data.tasks.find((item) => item.id === id)
    update('tasks', data.tasks.map((item) => item.id === id ? { ...item, done: !item.done } : item))
    if (!task?.done) flash('Nice work — task completed!')
  }
  const deleteItem = (kind, id) => {
    const label = kind === 'subjects' ? 'Subject' : kind === 'tasks' ? 'Task' : kind === 'sessions' ? 'Study session' : 'Exam'
    const next = data[kind].filter((item) => item.id !== id)
    if (kind === 'subjects') {
      update('subjects', next)
      update('tasks', data.tasks.filter((item) => item.subjectId !== id))
      update('sessions', data.sessions.filter((item) => item.subjectId !== id))
      update('exams', data.exams.filter((item) => item.subjectId !== id))
    } else update(kind, next)
    flash(`${label} deleted`)
  }

  const renderPage = () => {
    const props = { data, subjectFor, update, openModal, deleteItem, toggleTask, setPage, flash, search }
    switch (page) {
      case 'schedule': return <SchedulePage {...props} />
      case 'tasks': return <TasksPage {...props} />
      case 'subjects': return <SubjectsPage {...props} />
      case 'exams': return <ExamsPage {...props} />
      case 'focus': return <FocusPage {...props} />
      default: return <Dashboard {...props} />
    }
  }

  return (
    <div className="min-h-screen bg-paper text-ink transition-colors dark:bg-[#11121c] dark:text-[#eeeefa]">
      <Sidebar page={page} setPage={setPage} mobileNav={mobileNav} setMobileNav={setMobileNav} taskCount={data.tasks.filter((task) => !task.done).length} />
      <div className="min-h-screen lg:pl-[252px]">
        <Header page={page} data={data} update={update} search={search} setSearch={setSearch} setMobileNav={setMobileNav} flash={flash} />
        <main className="mx-auto max-w-[1480px] px-5 pb-12 pt-6 sm:px-8 lg:px-10 lg:pt-9">
          {renderPage()}
          <footer className="mt-12 flex items-center justify-between border-t border-[#e9eaf1] py-5 text-xs text-muted dark:border-white/10">
            <span>Made for your next big thing <span className="text-violet">✳</span></span>
            <span>Your data stays on this device</span>
          </footer>
        </main>
      </div>
      {modal && <EditorModal type={modal} item={editing} data={data} subjectFor={subjectFor} onClose={closeModal} onSave={(kind, item) => {
        const list = data[kind]
        update(kind, editing?.id ? list.map((entry) => entry.id === editing.id ? { ...item, id: editing.id } : entry) : [...list, { ...item, id: uid() }])
        flash(editing ? 'Changes saved' : 'Added successfully')
        closeModal()
      }} />}
      {toast && <div role="status" className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-xl animate-fade-in dark:bg-white dark:text-ink"><CheckCircle2 size={17} className="text-emerald-400" />{toast}</div>}
    </div>
  )
}

function Sidebar({ page, setPage, mobileNav, setMobileNav, taskCount }) {
  return <>
    {mobileNav && <button aria-label="Close navigation" onClick={() => setMobileNav(false)} className="fixed inset-0 z-40 bg-ink/30 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col border-r border-[#edecf3] bg-white px-5 py-6 transition-transform dark:border-white/10 dark:bg-[#181925] lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between px-2">
        <button className="flex items-center gap-3" onClick={() => { setPage('dashboard'); setMobileNav(false) }}>
          <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-violet text-white shadow-[0_6px_16px_rgba(117,101,232,.3)]"><BookOpen size={21} strokeWidth={2.2} /></span>
          <span className="text-[19px] font-extrabold tracking-[-.8px] text-ink dark:text-white">study<span className="text-violet">flow</span></span>
        </button>
        <button aria-label="Close menu" onClick={() => setMobileNav(false)} className="rounded-lg p-2 text-muted hover:bg-paper lg:hidden"><X size={18} /></button>
      </div>
      <div className="mb-3 mt-11 px-3 text-[10px] font-bold uppercase tracking-[1.5px] text-[#aaaaba]">Workspace</div>
      <nav className="space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setPage(id); setMobileNav(false) }} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-[11px] text-[13px] font-semibold transition ${page === id ? 'bg-[#f0efff] text-violet dark:bg-violet/15 dark:text-[#a99eff]' : 'text-[#77798e] hover:bg-[#f7f7fb] hover:text-ink dark:text-[#b0b0c3] dark:hover:bg-white/5 dark:hover:text-white'}`}>
            <Icon size={18} strokeWidth={1.9} /><span>{label}</span>
            {id === 'tasks' && <span className="ml-auto rounded-md bg-white px-2 py-0.5 text-[10px] text-[#999aac] dark:bg-white/10">{taskCount}</span>}
          </button>
        ))}
      </nav>
      <div className="mt-auto">
        <div className="relative mb-5 overflow-hidden rounded-2xl bg-[#f2f0ff] p-4 dark:bg-violet/10">
          <div className="absolute -right-4 -top-5 h-20 w-20 rounded-full bg-[#e6e1ff] dark:bg-violet/10" />
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-white text-violet shadow-sm dark:bg-white/10"><Sparkles size={16} /></div>
          <p className="relative mt-3 text-[13px] font-bold">Make it a good day</p>
          <p className="relative mt-1 text-[11px] leading-relaxed text-[#85839a] dark:text-[#aaa9bd]">A little progress each day adds up to big results.</p>
          <div className="relative mt-3 flex items-center gap-1 text-[10px] font-bold text-violet"><Flame size={13} fill="currentColor" /> 7 day streak</div>
        </div>
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-[#898a9c] hover:bg-[#f7f7fb] dark:hover:bg-white/5"><CircleHelp size={17} />Help & feedback</button>
        <div className="mt-4 flex items-center gap-3 border-t border-[#eeeef3] pt-4 dark:border-white/10">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffe6d8] text-[12px] font-bold text-[#b16e4d]">JD</div>
          <div className="min-w-0 flex-1"><div className="truncate text-[12px] font-bold">Jamie Davis</div><div className="text-[10px] text-muted">Student account</div></div>
          <button aria-label="Account options" className="text-muted"><MoreHorizontal size={19} /></button>
        </div>
      </div>
    </aside>
  </>
}

function Header({ page, data, update, search, setSearch, setMobileNav, flash }) {
  const title = navItems.find((item) => item.id === page)?.label ?? 'Overview'
  return <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[#edecf3] bg-white/90 px-5 backdrop-blur-xl dark:border-white/10 dark:bg-[#181925]/90 sm:px-8 lg:px-10">
    <div className="flex min-w-0 items-center gap-3">
      <button aria-label="Open menu" onClick={() => setMobileNav(true)} className="rounded-lg p-2 text-muted hover:bg-paper lg:hidden"><Menu size={19} /></button>
      <div className="hidden text-[11px] font-medium text-[#a2a2b2] sm:block">Workspace <span className="mx-2 text-[#dedee6]">/</span></div>
      <h1 className="truncate text-[14px] font-bold">{title}</h1>
    </div>
    <div className="flex items-center gap-2 sm:gap-3">
      <label className="hidden h-9 w-[210px] items-center gap-2 rounded-lg border border-[#ededf3] bg-[#fbfbfd] px-3 text-[#a0a1b0] md:flex dark:border-white/10 dark:bg-white/5">
        <Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search anything..." className="w-full bg-transparent text-[11px] text-ink outline-none placeholder:text-[#a0a1b0] dark:text-white" /><span className="flex items-center gap-0.5 rounded border border-[#e7e7ee] px-1 py-0.5 text-[9px] dark:border-white/10"><Command size={9} /> K</span>
      </label>
      <button aria-label={data.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => update('theme', data.theme === 'dark' ? 'light' : 'dark')} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#ededf3] text-[#84859a] transition hover:bg-[#f6f5fc] dark:border-white/10 dark:hover:bg-white/10">{data.theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
      <button aria-label="Notifications" onClick={() => flash('You’re all caught up!')} className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#ededf3] text-[#84859a] transition hover:bg-[#f6f5fc] dark:border-white/10 dark:hover:bg-white/10"><Bell size={17} /><span className="absolute right-[8px] top-[7px] h-1.5 w-1.5 rounded-full bg-[#ed8f77]" /></button>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffe6d8] text-[11px] font-bold text-[#b16e4d]">JD</span>
    </div>
  </header>
}

function PageHeading({ eyebrow, title, subtitle, children }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
    <div><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-violet"><span className="h-1.5 w-1.5 rounded-full bg-violet" />{eyebrow}</div><h2 className="font-display text-[26px] font-extrabold tracking-[-1.1px] sm:text-[30px]">{title}</h2>{subtitle && <p className="mt-1.5 text-[13px] text-muted">{subtitle}</p>}</div>
    {children}
  </div>
}
function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex h-10 items-center justify-center gap-2 rounded-[10px] px-4 text-[12px] font-bold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50'
  const style = variant === 'primary' ? 'bg-violet text-white shadow-[0_5px_12px_rgba(117,101,232,.2)] hover:bg-[#6655d7]' : variant === 'outline' ? 'border border-[#e9e9f0] bg-white text-[#65677c] hover:bg-[#f8f8fc] dark:border-white/10 dark:bg-white/5 dark:text-[#cfcee0] dark:hover:bg-white/10' : 'text-[#77798e] hover:bg-[#f5f5fa] dark:hover:bg-white/10'
  return <button className={`${base} ${style} ${className}`} {...props}>{children}</button>
}
function Card({ children, className = '' }) {
  return <section className={`rounded-[16px] border border-[#edecf3] bg-white p-5 shadow-soft dark:border-white/[.08] dark:bg-[#181925] dark:shadow-none sm:p-6 ${className}`}>{children}</section>
}
function SectionTitle({ title, subtitle, action }) {
  return <div className="mb-5 flex items-center justify-between gap-2"><div><h3 className="text-[14px] font-bold">{title}</h3>{subtitle && <p className="mt-1 text-[11px] text-muted">{subtitle}</p>}</div>{action}</div>
}
function EmptyState({ title, description, action }) {
  return <div className="flex flex-col items-center justify-center py-10 text-center"><span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f2f0ff] text-violet dark:bg-violet/15"><Sparkles size={19} /></span><p className="text-[13px] font-bold">{title}</p><p className="mt-1 max-w-[230px] text-[11px] leading-relaxed text-muted">{description}</p>{action && <div className="mt-4">{action}</div>}</div>
}

function Dashboard({ data, subjectFor, openModal, toggleTask, setPage }) {
  const remaining = data.tasks.filter((item) => !item.done && item.dueDate <= todayISO)
  const doneToday = data.tasks.filter((item) => item.done && item.dueDate === todayISO).length
  const todaySessions = data.sessions.filter((item) => item.date === todayISO).sort((a, b) => a.start.localeCompare(b.start))
  const upcomingExam = [...data.exams].sort((a, b) => a.date.localeCompare(b.date))[0]
  const weekStart = getWeekStart(todayISO)
  const weekSessions = data.sessions.filter((item) => item.date >= weekStart && item.date <= addDays(weekStart, 6))
  const sessionHours = (session) => {
    const [startHour, startMinute] = session.start.split(':').map(Number)
    const [endHour, endMinute] = session.end.split(':').map(Number)
    return Math.max(0, (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60)
  }
  const hoursThisWeek = weekSessions.reduce((total, session) => total + sessionHours(session), 0)
  const chartData = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index)
    return {
      day: new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' }),
      hours: Number(weekSessions.filter((session) => session.date === date).reduce((total, session) => total + sessionHours(session), 0).toFixed(1)),
    }
  })
  return <div className="animate-fade-in">
    <PageHeading eyebrow={`TODAY · ${formatDate(todayISO, { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}`} title="Good morning, Jamie ☀️" subtitle="A little progress today goes a long way. Let's make it count.">
      <Button onClick={() => openModal('session')}><Plus size={16} /> Plan a study session</Button>
    </PageHeading>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={Target} label="Tasks completed" value={`${doneToday} / ${data.tasks.filter((item) => item.dueDate === todayISO).length}`} delta={doneToday ? 'Great momentum today' : 'Your day is yours to shape'} tone="violet" />
      <StatCard icon={Clock3} label="Study hours this week" value={`${hoursThisWeek.toFixed(1)}h`} delta="+12% from last week" tone="peach" trend />
      <StatCard icon={Flame} label="Current streak" value={`${data.streak} days`} delta="You’re on a roll!" tone="yellow" />
      <StatCard icon={GraduationCap} label="Next exam" value={upcomingExam ? `${Math.max(0, Math.ceil((new Date(`${upcomingExam.date}T12:00:00`) - new Date(`${todayISO}T12:00:00`)) / 86400000))} days` : 'Not set'} delta={upcomingExam?.title ?? 'Add your next exam'} tone="mint" />
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
      <Card>
        <SectionTitle title="Study activity" subtitle="Your focus time throughout the week" action={<button className="flex items-center gap-1 rounded-lg border border-[#ededf3] px-2.5 py-1.5 text-[10px] font-semibold text-[#77798e] dark:border-white/10">This week <ChevronDown size={13} /></button>} />
        <div className="mb-4 flex items-baseline gap-2"><span className="font-display text-[27px] font-extrabold tracking-[-1px]">{hoursThisWeek.toFixed(1)} hrs</span><span className="flex items-center text-[10px] font-semibold text-[#4dab91]"><ArrowUpRight size={13} /> 12.8%</span></div>
        <div className="h-[210px] w-full">
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
            <defs><linearGradient id="studyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8172ed" stopOpacity={0.2} /><stop offset="95%" stopColor="#8172ed" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid vertical={false} stroke="#efeff4" strokeDasharray="4 5" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#a1a1b1', fontSize: 10 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1b1', fontSize: 10 }} tickFormatter={(value) => `${value}h`} />
            <Tooltip contentStyle={{ border: '1px solid #eeeef4', borderRadius: 10, fontSize: 11, boxShadow: '0 8px 25px rgba(30,30,60,.08)' }} formatter={(value) => [`${value} hrs`, 'Study time']} />
            <Area type="monotone" dataKey="hours" stroke="#7969e8" strokeWidth={2.5} fill="url(#studyFill)" activeDot={{ r: 5, fill: '#7969e8', stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart></ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <SectionTitle title="Today's focus" subtitle={`${remaining.length} tasks left to tackle`} action={<button onClick={() => setPage('tasks')} className="text-[11px] font-bold text-violet">See all <ArrowRight size={13} className="ml-1 inline" /></button>} />
        <div className="space-y-1">
          {data.tasks.filter((item) => item.dueDate === todayISO).slice(0, 4).map((task) => <TaskRow key={task.id} task={task} subject={subjectFor(task.subjectId)} onToggle={() => toggleTask(task.id)} compact />)}
          {!data.tasks.some((item) => item.dueDate === todayISO) && <EmptyState title="A fresh slate" description="Add a task to give your day some direction." action={<Button variant="outline" onClick={() => openModal('task')}><Plus size={14} /> Add a task</Button>} />}
        </div>
        <button onClick={() => setPage('tasks')} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#f7f6fc] py-2.5 text-[11px] font-bold text-[#77798e] hover:bg-[#f0effa] dark:bg-white/5 dark:hover:bg-white/10">View task manager <ArrowRight size={14} /></button>
      </Card>
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
      <Card>
        <SectionTitle title="Today's schedule" subtitle={formatDate(todayISO)} action={<button onClick={() => setPage('schedule')} className="text-[11px] font-bold text-violet">Full timetable <ArrowRight size={13} className="ml-1 inline" /></button>} />
        {todaySessions.length ? <div className="space-y-2">{todaySessions.slice(0, 4).map((session) => <ScheduleRow key={session.id} session={session} subject={subjectFor(session.subjectId)} />)}</div> : <EmptyState title="No study sessions planned" description="Make a little room for focused learning today." action={<Button variant="outline" onClick={() => openModal('session')}><Plus size={14} /> Add session</Button>} />}
      </Card>
      <Card>
        <SectionTitle title="Your subjects" subtitle="A snapshot of your learning" action={<button onClick={() => setPage('subjects')} className="text-[11px] font-bold text-violet">View all <ArrowRight size={13} className="ml-1 inline" /></button>} />
        <div className="space-y-4">{data.subjects.slice(0, 4).map((subject) => <div key={subject.id}>
          <div className="mb-2 flex items-center justify-between text-[11px]"><div className="flex items-center gap-2 font-semibold"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: subject.color }} />{subject.name}</div><span className="text-muted">{subjectProgress(data.tasks, subject.id)}%</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#f0f0f5] dark:bg-white/10"><div className="h-full rounded-full" style={{ width: `${subjectProgress(data.tasks, subject.id)}%`, backgroundColor: subject.color }} /></div>
        </div>)}
        {!data.subjects.length && <EmptyState title="Add your first subject" description="Your progress starts with a subject." action={<Button onClick={() => openModal('subject')}><Plus size={14} /> Add subject</Button>} />}
        </div>
      </Card>
    </div>
  </div>
}

function StatCard({ icon: Icon, label, value, delta, tone, trend }) {
  const tones = { violet: 'bg-[#f0eeff] text-violet dark:bg-violet/15', peach: 'bg-[#fff1ea] text-[#e18b66] dark:bg-[#e18b66]/10', yellow: 'bg-[#fff7df] text-[#d8a32e] dark:bg-[#d8a32e]/10', mint: 'bg-[#e9f8f4] text-[#51a991] dark:bg-[#51a991]/10' }
  return <Card className="!p-4 sm:!p-5"><div className="flex items-start justify-between"><span className="text-[11px] font-semibold text-muted">{label}</span><span className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${tones[tone]}`}><Icon size={16} /></span></div><div className="mt-3 font-display text-[24px] font-extrabold tracking-[-1px]">{value}</div><div className={`mt-1 flex items-center gap-1 text-[10px] ${trend ? 'font-semibold text-[#4dab91]' : 'text-muted'}`}>{trend && <TrendingUp size={12} />}{delta}</div></Card>
}
function TaskRow({ task, subject, onToggle, onEdit, onDelete, compact }) {
  return <div className="group flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-[#fafafd] dark:hover:bg-white/[.035]">
    <button aria-label={task.done ? 'Mark task incomplete' : 'Mark task complete'} onClick={onToggle} className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition ${task.done ? 'border-violet bg-violet text-white' : 'border-[#d9d9e5] hover:border-violet dark:border-white/20'}`}>{task.done && <Check size={12} />}</button>
    <div className="min-w-0 flex-1"><p className={`truncate text-[12px] font-semibold ${task.done ? 'text-[#aaaab7] line-through' : ''}`}>{task.title}</p><div className="mt-1 flex items-center gap-2 text-[10px] text-muted">{subject && <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: subject.color }} />{subject.name}</span>}{!compact && <span>· Due {formatDate(task.dueDate, { month: 'short', day: 'numeric' })}</span>}</div></div>
    {!compact && <span className={`rounded-md px-2 py-1 text-[9px] font-bold ${task.priority === 'High' ? 'bg-[#fff0ed] text-[#e7836b] dark:bg-[#e7836b]/10' : task.priority === 'Medium' ? 'bg-[#fff7e6] text-[#c39332] dark:bg-[#c39332]/10' : 'bg-[#eff5ff] text-[#6790d3] dark:bg-[#6790d3]/10'}`}>{task.priority}</span>}
    {(onEdit || onDelete) && <div className="flex opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"><button aria-label="Edit task" onClick={onEdit} className="rounded p-1.5 text-muted hover:text-violet"><Settings2 size={14} /></button><button aria-label="Delete task" onClick={onDelete} className="rounded p-1.5 text-muted hover:text-rose-500"><Trash2 size={14} /></button></div>}
  </div>
}
function ScheduleRow({ session, subject }) {
  return <div className="flex items-center gap-3 rounded-xl border border-[#f0eff5] p-3 dark:border-white/[.07]"><div className="w-[73px] shrink-0 text-center"><p className="text-[11px] font-bold">{session.start}</p><p className="mt-0.5 text-[9px] text-muted">{session.end}</p></div><span className="h-9 w-1 rounded-full" style={{ backgroundColor: subject?.color ?? palette[0] }} /><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-bold">{session.title}</p><p className="mt-1 text-[10px] text-muted">{subject?.name ?? 'No subject'}</p></div><span className="rounded-md bg-[#f6f5fc] px-2 py-1 text-[9px] font-semibold text-[#77798e] dark:bg-white/5">{session.start} – {session.end}</span></div>
}

function SubjectsPage({ data, openModal, deleteItem, search }) {
  const [query, setQuery] = useState('')
  const filtered = data.subjects.filter((item) => `${item.name} ${item.teacher}`.toLowerCase().includes((query || search).toLowerCase()))
  return <div className="animate-fade-in">
    <PageHeading eyebrow="YOUR LEARNING" title="Subjects" subtitle="All your classes and the progress you're making."><Button onClick={() => openModal('subject')}><Plus size={16} /> Add subject</Button></PageHeading>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-[12px] text-muted">{data.subjects.length} subjects in your library</p><label className="flex h-9 w-full max-w-[240px] items-center gap-2 rounded-lg border border-[#ededf3] bg-white px-3 text-muted dark:border-white/10 dark:bg-[#181925]"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a subject..." className="w-full bg-transparent text-[11px] outline-none placeholder:text-[#aaaaba]" /></label></div>
    {filtered.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((subject) => <SubjectCard key={subject.id} subject={subject} data={data} openModal={openModal} deleteItem={deleteItem} />)}</div> : <Card><EmptyState title="No subjects found" description={data.subjects.length ? 'Try another search or add a subject.' : 'Create a subject to start organizing your studies.'} action={<Button onClick={() => openModal('subject')}><Plus size={14} /> Add subject</Button>} /></Card>}
  </div>
}
function SubjectCard({ subject, data, openModal, deleteItem }) {
  const taskCount = data.tasks.filter((task) => task.subjectId === subject.id).length
  const sessionCount = data.sessions.filter((session) => session.subjectId === subject.id).length
  const progress = subjectProgress(data.tasks, subject.id)
  return <Card className="group relative overflow-hidden !p-5"><div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full opacity-[.08]" style={{ backgroundColor: subject.color }} />
    <div className="relative flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-[13px] text-white" style={{ backgroundColor: subject.color }}><BookOpen size={20} /></span><div className="flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"><button aria-label="Edit subject" onClick={() => openModal('subject', subject)} className="rounded-lg p-2 text-muted hover:bg-paper hover:text-violet"><Settings2 size={15} /></button><button aria-label="Delete subject" onClick={() => deleteItem('subjects', subject.id)} className="rounded-lg p-2 text-muted hover:bg-rose-50 hover:text-rose-500"><Trash2 size={15} /></button></div></div>
    <h3 className="mt-5 text-[16px] font-bold">{subject.name}</h3><p className="mt-1 text-[11px] text-muted">{subject.teacher || 'No teacher added'}</p>
    <div className="mt-5 flex items-center justify-between text-[10px]"><span className="font-semibold text-[#77798e] dark:text-[#b9b8ca]">{subject.hours ?? 0} study hours</span><span className="text-muted">{progress}% complete</span></div>
    <div className="mt-2 h-1.5 rounded-full bg-[#f0f0f5] dark:bg-white/10"><div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: subject.color }} /></div>
    <div className="mt-4 flex gap-4 border-t border-[#f0eff5] pt-3 text-[10px] text-muted dark:border-white/[.07]"><span>{taskCount} tasks</span><span>{sessionCount} study sessions</span></div>
  </Card>
}

function TasksPage({ data, subjectFor, openModal, toggleTask, deleteItem, search }) {
  const [filter, setFilter] = useState('All')
  const tasks = data.tasks.filter((task) => {
    const matches = `${task.title} ${subjectFor(task.subjectId)?.name ?? ''}`.toLowerCase().includes(search.toLowerCase())
    if (filter === 'Completed') return task.done && matches
    if (filter === 'Active') return !task.done && matches
    if (filter === 'Today') return task.dueDate === todayISO && matches
    return matches
  }).sort((a, b) => Number(a.done) - Number(b.done) || a.dueDate.localeCompare(b.dueDate))
  const done = data.tasks.filter((task) => task.done).length
  return <div className="animate-fade-in">
    <PageHeading eyebrow="STAY ON TRACK" title="Task manager" subtitle="Small steps, big progress. Keep your momentum going."><Button onClick={() => openModal('task')}><Plus size={16} /> Add a task</Button></PageHeading>
    <Card className="mb-5 !p-5 sm:!p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[11px] font-semibold text-muted">OVERALL COMPLETION</p><p className="mt-1 text-[21px] font-extrabold">{done} <span className="text-[13px] font-medium text-muted">of {data.tasks.length} tasks</span></p></div><div className="flex-1 sm:max-w-[420px]"><div className="mb-2 flex justify-between text-[10px] text-muted"><span>Keep it up!</span><span>{data.tasks.length ? Math.round(done / data.tasks.length * 100) : 0}%</span></div><div className="h-2 rounded-full bg-[#f0f0f5] dark:bg-white/10"><div className="h-full rounded-full bg-violet transition-all" style={{ width: `${data.tasks.length ? done / data.tasks.length * 100 : 0}%` }} /></div></div></div></Card>
    <Card><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><SectionTitle title="Your tasks" subtitle="Everything you need to get done" /><div className="flex gap-1 rounded-lg bg-[#f6f6fa] p-1 dark:bg-white/5">{['All', 'Today', 'Active', 'Completed'].map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-md px-3 py-1.5 text-[10px] font-bold transition ${filter === item ? 'bg-white text-violet shadow-sm dark:bg-white/10' : 'text-muted'}`}>{item}</button>)}</div></div>
      <div className="divide-y divide-[#f2f1f6] dark:divide-white/[.06]">{tasks.map((task) => <TaskRow key={task.id} task={task} subject={subjectFor(task.subjectId)} onToggle={() => toggleTask(task.id)} onEdit={() => openModal('task', task)} onDelete={() => deleteItem('tasks', task.id)} />)}</div>
      {!tasks.length && <EmptyState title="Nothing on your list" description="Enjoy the breathing room, or add a task to keep your plans moving." action={<Button onClick={() => openModal('task')}><Plus size={14} /> Add a task</Button>} />}
    </Card>
  </div>
}

function SchedulePage({ data, subjectFor, openModal, deleteItem }) {
  const [view, setView] = useState('Week')
  const [anchor, setAnchor] = useState(todayISO)
  const start = getWeekStart(anchor)
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index))
  const shownDays = view === 'Day' ? [anchor] : days
  const changeRange = (direction) => setAnchor(addDays(anchor, direction * (view === 'Day' ? 1 : 7)))
  return <div className="animate-fade-in">
    <PageHeading eyebrow="MAKE TIME FOR WHAT MATTERS" title="Study schedule" subtitle="A little structure can make a big difference."><Button onClick={() => openModal('session')}><Plus size={16} /> Add session</Button></PageHeading>
    <Card>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><button aria-label="Previous period" onClick={() => changeRange(-1)} className="rounded-lg border border-[#ededf3] p-2 text-muted hover:text-violet dark:border-white/10"><ChevronLeft size={16} /></button><button aria-label="Next period" onClick={() => changeRange(1)} className="rounded-lg border border-[#ededf3] p-2 text-muted hover:text-violet dark:border-white/10"><ChevronRight size={16} /></button><button onClick={() => setAnchor(todayISO)} className="ml-1 text-[11px] font-bold text-violet">Today</button><h3 className="ml-2 text-[13px] font-bold">{formatDate(start, { month: 'long', day: 'numeric' })} – {formatDate(addDays(start, 6), { month: 'long', day: 'numeric', year: 'numeric' })}</h3></div><div className="flex gap-1 rounded-lg bg-[#f6f6fa] p-1 dark:bg-white/5">{['Day', 'Week'].map((item) => <button key={item} onClick={() => setView(item)} className={`rounded-md px-3 py-1.5 text-[10px] font-bold ${view === item ? 'bg-white text-violet shadow-sm dark:bg-white/10' : 'text-muted'}`}>{item}</button>)}</div></div>
      <div className={`grid min-w-0 gap-2 ${view === 'Day' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-7'}`}>
        {shownDays.map((date) => {
          const sessions = data.sessions.filter((session) => session.date === date).sort((a, b) => a.start.localeCompare(b.start))
          const dayLabel = new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' })
          return <div key={date} className={`min-h-[180px] rounded-xl border p-3 ${date === todayISO ? 'border-violet/30 bg-[#faf9ff] dark:bg-violet/[.06]' : 'border-[#efeff4] dark:border-white/[.07]'}`}>
            <div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-bold text-muted">{dayLabel.toUpperCase()}</span><span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${date === todayISO ? 'bg-violet text-white' : ''}`}>{new Date(`${date}T12:00:00`).getDate()}</span></div>
            <div className="space-y-2">{sessions.map((session) => {
              const subject = subjectFor(session.subjectId)
              return <div key={session.id} className="group relative rounded-lg p-2.5 pr-8" style={{ backgroundColor: `${subject?.color ?? palette[0]}15`, borderLeft: `2px solid ${subject?.color ?? palette[0]}` }}>
                <p className="truncate text-[10px] font-bold">{session.title}</p><p className="mt-1 text-[9px] text-muted">{session.start}–{session.end}</p><p className="mt-1 truncate text-[9px] text-muted">{subject?.name}</p>
                <button aria-label="Delete study session" onClick={() => deleteItem('sessions', session.id)} className="absolute right-1 top-1 rounded p-1 text-muted opacity-100 transition hover:text-rose-500 sm:opacity-0 sm:group-hover:opacity-100"><X size={12} /></button>
              </div>
            })}</div>
            <button onClick={() => openModal('session', { date })} className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[9px] font-semibold text-muted hover:bg-black/[.03] hover:text-violet dark:hover:bg-white/5"><Plus size={12} /> Add</button>
          </div>
        })}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-[#f0eff5] pt-4 text-[10px] text-muted dark:border-white/[.07]">{data.subjects.map((subject) => <span key={subject.id} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: subject.color }} />{subject.name}</span>)}</div>
    </Card>
  </div>
}

function ExamsPage({ data, subjectFor, openModal, deleteItem }) {
  const exams = [...data.exams].sort((a, b) => a.date.localeCompare(b.date))
  return <div className="animate-fade-in">
    <PageHeading eyebrow="LOOK AHEAD" title="Exam planner" subtitle="Know what's coming, and give yourself time to prepare."><Button onClick={() => openModal('exam')}><Plus size={16} /> Add exam</Button></PageHeading>
    {exams.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{exams.map((exam) => {
      const subject = subjectFor(exam.subjectId)
      const days = Math.ceil((new Date(`${exam.date}T12:00:00`) - new Date(`${todayISO}T12:00:00`)) / 86400000)
      return <Card key={exam.id} className="group relative overflow-hidden"><div className="absolute -right-4 -top-6 h-28 w-28 rounded-full opacity-[.08]" style={{ backgroundColor: subject?.color ?? palette[0] }} />
        <div className="relative flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ backgroundColor: subject?.color ?? palette[0] }}><GraduationCap size={19} /></span><button aria-label="Delete exam" onClick={() => deleteItem('exams', exam.id)} className="rounded-lg p-2 text-muted opacity-100 transition hover:text-rose-500 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={15} /></button></div>
        <p className="mt-4 text-[16px] font-bold">{exam.title}</p><p className="mt-1 text-[11px] text-muted">{subject?.name ?? 'No subject'}</p>
        <div className="mt-5 rounded-xl bg-[#f8f7fc] p-3 dark:bg-white/[.04]"><div className="flex items-center gap-2 text-[11px] font-semibold"><CalendarDays size={14} className="text-violet" />{formatDate(exam.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div><div className="mt-2 flex items-center gap-2 text-[10px] text-muted"><Clock3 size={13} />{exam.time || 'Time not set'}{exam.location && <><span>·</span>{exam.location}</>}</div></div>
        <div className={`mt-4 text-[11px] font-bold ${days < 0 ? 'text-muted' : days < 7 ? 'text-[#e18369]' : 'text-violet'}`}>{days < 0 ? 'Completed' : days === 0 ? 'Today' : `${days} days to go`}</div>
      </Card>
    })}</div> : <Card><EmptyState title="No exams on the horizon" description="Add your exam dates and we'll help you keep them in sight." action={<Button onClick={() => openModal('exam')}><Plus size={14} /> Add your first exam</Button>} /></Card>}
    <Card className="mt-5"><SectionTitle title="A little exam-day wisdom" /><div className="flex items-start gap-3 rounded-xl bg-[#f6f4ff] p-4 dark:bg-violet/10"><Sparkles size={17} className="mt-0.5 shrink-0 text-violet" /><p className="text-[12px] leading-relaxed text-[#6e6d86] dark:text-[#c1bfd4]">Start with small review sessions spaced over time. A little practice each day is more powerful than a last-minute all-nighter.</p></div></Card>
  </div>
}

function FocusPage({ data, update, subjectFor }) {
  const [duration, setDuration] = useState(25)
  const [mode, setMode] = useState('Focus')
  const [seconds, setSeconds] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [completed, setCompleted] = useState(false)
  useEffect(() => { if (!running) return undefined; const interval = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000); return () => clearInterval(interval) }, [running])
  useEffect(() => {
    if (seconds === 0 && running) {
      setRunning(false)
      setCompleted(true)
      if (mode === 'Focus') update('focusSessions', data.focusSessions + 1)
    }
  }, [seconds, running, mode])
  const reset = () => { setRunning(false); setSeconds(duration * 60); setCompleted(false) }
  const chooseDuration = (value, nextMode) => { setDuration(value); setMode(nextMode); setSeconds(value * 60); setRunning(false); setCompleted(false) }
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')
  const progress = (duration * 60 - seconds) / (duration * 60)
  const circumference = 2 * Math.PI * 103
  return <div className="animate-fade-in">
    <PageHeading eyebrow="ONE THING AT A TIME" title="Focus timer" subtitle="Settle in, tune out distractions, and do your best work." />
    <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <Card className="flex min-h-[520px] flex-col items-center justify-center !py-10">
        <div className="mb-7 flex rounded-xl bg-[#f6f5fa] p-1 dark:bg-white/5">{[['Focus', 25], ['Short break', 5], ['Long break', 15]].map(([label, value]) => <button key={label} onClick={() => chooseDuration(value, label)} className={`rounded-lg px-4 py-2.5 text-[11px] font-bold transition ${mode === label ? 'bg-white text-violet shadow-sm dark:bg-white/10' : 'text-muted hover:text-ink dark:hover:text-white'}`}>{label}</button>)}</div>
        <div className="relative flex h-[250px] w-[250px] items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 230 230"><circle cx="115" cy="115" r="103" fill="none" stroke="currentColor" className="text-[#f1f0f6] dark:text-white/10" strokeWidth="5" /><circle cx="115" cy="115" r="103" fill="none" stroke="#7767e8" strokeWidth="5" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} className="transition-[stroke-dashoffset] duration-500" /></svg>
          <div className="text-center"><div className="font-display text-[58px] font-extrabold tracking-[-4px]">{mins}<span className="text-violet">:</span>{secs}</div><p className="mt-1 text-[11px] font-medium text-muted">{completed ? 'Session complete — well done!' : running ? 'You’re in the zone. Keep going.' : 'Ready when you are'}</p></div>
        </div>
        <div className="mt-5 flex items-center gap-3"><button onClick={reset} aria-label="Reset timer" className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#ededf3] text-muted hover:text-violet dark:border-white/10"><RotateCcw size={17} /></button><Button className="!h-12 !min-w-[150px] !rounded-xl !text-[13px]" onClick={() => setRunning((value) => !value)}>{running ? <><Pause size={17} fill="currentColor" /> Pause focus</> : <><Play size={17} fill="currentColor" /> {seconds !== duration * 60 ? 'Resume focus' : 'Start focusing'}</>}</Button></div>
        <label className="mt-6 flex items-center gap-2 text-[10px] font-medium text-muted">Studying <select value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)} className="rounded-md border border-[#ededf3] bg-white px-2 py-1.5 text-[10px] font-semibold text-ink outline-none dark:border-white/10 dark:bg-[#181925] dark:text-white"><option value="">Choose a subject</option>{data.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
      </Card>
      <div className="space-y-5">
        <Card><SectionTitle title="Your focus stats" subtitle="A little more focused every day" /><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#f7f6fc] p-4 dark:bg-white/[.04]"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0eeff] text-violet dark:bg-violet/15"><Zap size={16} /></span><p className="mt-3 text-[22px] font-extrabold">{data.focusSessions}</p><p className="mt-0.5 text-[10px] text-muted">Focus sessions</p></div><div className="rounded-xl bg-[#f7f6fc] p-4 dark:bg-white/[.04]"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff5e6] text-[#d8a32e] dark:bg-[#d8a32e]/10"><Clock3 size={16} /></span><p className="mt-3 text-[22px] font-extrabold">{data.focusSessions * 25}<span className="ml-1 text-[11px] text-muted">min</span></p><p className="mt-0.5 text-[10px] text-muted">Deep work time</p></div></div></Card>
        <Card><SectionTitle title="A gentle reminder" /><div className="rounded-xl bg-[#f1f9f6] p-4 dark:bg-[#51a991]/10"><p className="text-[12px] font-bold text-[#398d76]">Rest is part of the work.</p><p className="mt-1.5 text-[11px] leading-relaxed text-[#70988c] dark:text-[#a5cabe]">After a focused session, take a short break. Stretch, get some water, and let your brain reset before the next round.</p></div></Card>
        <Card><SectionTitle title="Timer settings" /><div className="space-y-3">{[[25, 'Focus session'], [5, 'Short break'], [15, 'Long break']].map(([minsValue, label]) => <div key={label} className="flex items-center justify-between text-[11px]"><span className="text-muted">{label}</span><span className="font-bold">{minsValue} min</span></div>)}</div></Card>
      </div>
    </div>
  </div>
}

function EditorModal({ type, item, data, subjectFor, onClose, onSave }) {
  const labels = { subject: 'subject', task: 'task', session: 'study session', exam: 'exam' }
  const [form, setForm] = useState(() => {
    if (item) return { ...item }
    if (type === 'subject') return { name: '', teacher: '', color: palette[data.subjects.length % palette.length], hours: 0 }
    if (type === 'task') return { title: '', subjectId: data.subjects[0]?.id ?? '', dueDate: todayISO, priority: 'Medium', done: false }
    if (type === 'session') return { title: '', subjectId: data.subjects[0]?.id ?? '', date: item?.date ?? todayISO, start: '09:00', end: '10:00' }
    return { title: '', subjectId: data.subjects[0]?.id ?? '', date: todayISO, time: '09:00', location: '' }
  })
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const handleSubmit = (event) => {
    event.preventDefault()
    if (type === 'subject') {
      if (!form.name.trim()) return
      onSave('subjects', { ...form, name: form.name.trim(), teacher: form.teacher.trim(), hours: Number(form.hours) || 0 })
    } else if (type === 'task') {
      if (!form.title.trim() || !form.dueDate) return
      onSave('tasks', { ...form, title: form.title.trim() })
    } else if (type === 'session') {
      if (!form.title.trim() || !form.date || !form.start || !form.end || form.end <= form.start) return
      onSave('sessions', { ...form, title: form.title.trim() })
    } else {
      if (!form.title.trim() || !form.date) return
      onSave('exams', { ...form, title: form.title.trim() })
    }
  }
  const inputClass = 'mt-1.5 h-10 w-full rounded-lg border border-[#e9e9f0] bg-white px-3 text-[12px] outline-none transition focus:border-violet focus:ring-2 focus:ring-violet/10 dark:border-white/10 dark:bg-[#20212f] dark:text-white'
  const labelClass = 'block text-[11px] font-semibold text-[#65677c] dark:text-[#c5c4d3]'
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-4 backdrop-blur-[3px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="max-h-[90vh] w-full max-w-[440px] overflow-y-auto rounded-2xl border border-[#ededf3] bg-white p-6 shadow-2xl animate-fade-in dark:border-white/10 dark:bg-[#181925]">
      <div className="mb-5 flex items-start justify-between"><div><h2 id="modal-title" className="text-[17px] font-bold">{item?.id ? 'Edit' : 'Add'} {labels[type]}</h2><p className="mt-1 text-[11px] text-muted">Keep your study space up to date.</p></div><button aria-label="Close dialog" onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-[#f5f5fa] dark:hover:bg-white/10"><X size={17} /></button></div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {type === 'subject' ? <>
          <label className={labelClass}>Subject name<input required autoFocus value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="e.g. Chemistry" className={inputClass} /></label>
          <label className={labelClass}>Teacher (optional)<input value={form.teacher} onChange={(event) => set('teacher', event.target.value)} placeholder="e.g. Ms. Parker" className={inputClass} /></label>
          <label className={labelClass}>Weekly study goal (hours)<input type="number" min="0" max="168" value={form.hours} onChange={(event) => set('hours', event.target.value)} className={inputClass} /></label>
          <div><span className={labelClass}>Subject color</span><div className="mt-2 flex gap-2">{palette.map((color) => <button key={color} type="button" aria-label={`Choose ${color} color`} onClick={() => set('color', color)} className={`h-7 w-7 rounded-full transition ${form.color === color ? 'ring-2 ring-offset-2 ring-violet dark:ring-offset-[#181925]' : ''}`} style={{ backgroundColor: color }} />)}</div></div>
        </> : <>
          <label className={labelClass}>{type === 'task' ? 'Task name' : type === 'session' ? 'Session name' : 'Exam name'}<input required autoFocus value={form.title} onChange={(event) => set('title', event.target.value)} placeholder={type === 'task' ? 'What do you need to do?' : type === 'session' ? 'What will you study?' : 'e.g. Chemistry final'} className={inputClass} /></label>
          <label className={labelClass}>Subject<select value={form.subjectId} onChange={(event) => set('subjectId', event.target.value)} className={inputClass}><option value="">No subject</option>{data.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
          <label className={labelClass}>{type === 'task' ? 'Due date' : type === 'session' ? 'Study date' : 'Exam date'}<input required type="date" value={type === 'session' ? form.date : form.date ?? form.dueDate} onChange={(event) => set(type === 'task' ? 'dueDate' : 'date', event.target.value)} className={inputClass} /></label>
          {type === 'task' && <label className={labelClass}>Priority<select value={form.priority} onChange={(event) => set('priority', event.target.value)} className={inputClass}>{['Low', 'Medium', 'High'].map((priority) => <option key={priority}>{priority}</option>)}</select></label>}
          {type === 'session' && <div className="grid grid-cols-2 gap-3"><label className={labelClass}>Starts<input required type="time" value={form.start} onChange={(event) => set('start', event.target.value)} className={inputClass} /></label><label className={labelClass}>Ends<input required type="time" min={form.start} value={form.end} onChange={(event) => set('end', event.target.value)} className={inputClass} /></label></div>}
          {type === 'exam' && <><label className={labelClass}>Start time<input type="time" value={form.time} onChange={(event) => set('time', event.target.value)} className={inputClass} /></label><label className={labelClass}>Location (optional)<input value={form.location} onChange={(event) => set('location', event.target.value)} placeholder="e.g. Room 204" className={inputClass} /></label></>}
        </>}
        <div className="flex justify-end gap-2 border-t border-[#f0eff5] pt-4 dark:border-white/[.07]"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">{item?.id ? 'Save changes' : `Add ${labels[type]}`}</Button></div>
      </form>
    </div>
  </div>
}

export default App
