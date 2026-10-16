import { useEffect, useState } from 'react'
import { apiRequest } from './api/api.js'
import { socket } from './socket.js'
import {
  DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors,
  closestCorners, useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy,
  sortableKeyboardCoordinates, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const colors = ['bg-slate-400', 'bg-blue-500', 'bg-emerald-500']
const priorityStyles = {
  High: 'bg-red-50 text-red-700',
  Medium: 'bg-amber-50 text-amber-700',
  Low: 'bg-emerald-50 text-emerald-700',
}
const normalizePriority = (value) => {
  const text = String(value || 'medium').toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const mapTask = (task) => {
  const columnId =
    task.column?._id ??
    task.column ??
    task.columnId ??
    task.status

  return {
    id: task._id ?? task.id,
    title: task.title,
    description: task.description || '',
    priority: normalizePriority(task.priority),
    columnId,
    status: columnId,
    position: Number(task.position || 0),
  }
}

function TaskCard({ task, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { status: task.status } })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  }

  return (
    <article ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="cursor-grab touch-none rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md active:cursor-grabbing">
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[task.priority] || priorityStyles.Medium}`}>
          {task.priority}
        </span>
        <span className="text-xs text-slate-400">↕ Drag</span>
      </div>
      <h4 className="font-semibold leading-6 text-slate-900">{task.title}</h4>
      <p className="mt-2 text-sm leading-5 text-slate-500">{task.description || 'No description added.'}</p>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-400">
          {String(task.id).slice(-8).toUpperCase()}
        </span>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                onEdit(task)
              }}
              className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              Edit
            </button>

            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                onDelete(task)
              }}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
            TF
          </span>
        </div>
      </div>
    </article>
  )
}

function KanbanColumn({ column, tasks, onEdit, onDelete }) {
  const { setNodeRef } = useDroppable({ id: column.id, data: { status: column.id } })
  return (
    <section ref={setNodeRef} className="flex min-h-80 min-w-0 flex-col rounded-2xl bg-slate-100 p-3 sm:p-4" aria-label={`${column.title} column`}>
      <div className="mb-4 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${column.color}`} />
          <h3 className="font-bold text-slate-800">{column.title}</h3>
        </div>
        <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-600">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          {tasks.length === 0 && <div className="flex min-h-24 flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-3 text-center text-sm text-slate-400">Drop a task here</div>}
        </div>
      </SortableContext>
    </section>
  )
}

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem('taskflow_token') || '',
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [tasks, setTasks] = useState([])
  const [onlineUserIds, setOnlineUserIds] = useState([])
  const [columns, setColumns] = useState([])
  const [board, setBoard] = useState(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState('')
  const [search, setSearch] = useState('')
  const [activeNav, setActiveNav] = useState('My Boards')
  const [notice, setNotice] = useState('')
  const activeBoard = board?.title || 'TaskFlow Project'
  const onlineUserCount = onlineUserIds.length
  useEffect(() => {
    if (!token || !board?._id) return undefined

    function handleTaskCreated(newTask) {
      if (!newTask?._id) return

      setTasks((current) => {
        const alreadyExists = current.some(
          (task) => task.id === newTask._id,
        )

        if (alreadyExists) return current

        return [...current, mapTask(newTask)]
      })
    }

    socket.on('task:created', handleTaskCreated)

    return () => {
      socket.off('task:created', handleTaskCreated)
    }
  }, [token, board?._id])

  useEffect(() => {
    if (!token || !board?._id) return undefined
    function handleTaskUpdated(updatedTask) {
      if (!updatedTask?._id) return

      setTasks((current) =>
        current.map((task) =>
          task.id === updatedTask._id
            ? mapTask(updatedTask)
            : task,
        ),
      )
    }

    socket.on('task:updated', handleTaskUpdated)

    return () => {
      socket.off('task:updated', handleTaskUpdated)
    }
  }, [token, board?._id])
  useEffect(() => {
    if (!token || !board?._id) return undefined
    function handleTaskDeleted(deletedTask) {
      if (!deletedTask?.taskId) return

      setTasks((current) =>
        current.filter((task) => task.id !== deletedTask.taskId),
      )
    }

    socket.on('task:deleted', handleTaskDeleted)

    return () => {
      socket.off('task:deleted', handleTaskDeleted)
    }
  }, [token, board?._id])

  useEffect(() => {
    if (!token || !board?._id) {
      setOnlineUserIds([])
      return undefined
    }
    function handlePresenceUpdated(presence) {
      if (presence?.boardId !== board._id) return

      setOnlineUserIds(presence.onlineUserIds || [])
    }

    socket.on('presence:updated', handlePresenceUpdated)

    return () => {
      socket.off('presence:updated', handlePresenceUpdated)
    }
  }, [token, board?._id])

  useEffect(() => {
    if (!token) {
      socket.disconnect()
      return undefined
    }
    function handleConnect() {
      console.log('TaskFlow socket connected:', socket.id)
    }

    function handleConnectError(error) {
      console.error('TaskFlow socket connection failed:', error.message)
    }

    socket.on('connect', handleConnect)
    socket.on('connect_error', handleConnectError)
    socket.connect()

    return () => {
      socket.off('connect', handleConnect)
      socket.off('connect_error', handleConnectError)
      socket.disconnect()
    }
  }, [token])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function handleLogin(event) {
    event.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email: email.trim(), password },
      })
      if (!result.token) throw new Error('Login succeeded but no token was returned.')
      localStorage.setItem('taskflow_token', result.token)
      setToken(result.token)
      setPassword('')
    } catch (error) {
      setLoginError(error.message || 'Unable to log in.')
    } finally {
      setLoginLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return undefined
    let cancelled = false

    async function loadBoardData() {
      setDataLoading(true)
      setDataError('')
      try {
        const boardsResult = await apiRequest('/boards', { token })
        const selectedBoard = boardsResult.data?.[0]
        if (!selectedBoard) {
          if (!cancelled) {
            setBoard(null)
            setColumns([])
            setTasks([])
            setDataError('No boards found. Create a board to get started.')
          }
          return
        }
        const [columnsResult, tasksResult] = await Promise.all([
          apiRequest(`/boards/${selectedBoard._id}/columns`, { token }),
          apiRequest(`/boards/${selectedBoard._id}/tasks`, { token }),
        ])
        const loadedColumns = (columnsResult.data || []).map((column, index) => ({
          id: column._id,
          title: column.title,
          color: colors[index % colors.length],
          position: Number(column.position || index),
        }))
        const loadedTasks = (tasksResult.data || []).map(mapTask)
        if (!cancelled) {
          setBoard(selectedBoard)
          setColumns(loadedColumns)
          setTasks(loadedTasks)
        }
      } catch (error) {
        if (!cancelled) setDataError(error.message || 'Failed to load board data.')
      } finally {
        if (!cancelled) setDataLoading(false)
      }
    }
    loadBoardData()
    return () => { cancelled = true }
  }, [token])

  useEffect(() => {
    if (!token || !board?._id) return undefined

    const joinSelectedBoard = () => {
      socket.emit('board:join', board._id, (result) => {
        if (result?.success) {
          console.log('Joined board room successfully:', result.boardId)
        } else {
          console.error(
            'Failed to join board room:',
            result?.message || 'Unknown error',
          )
        }
      })
    }

    socket.on('connect', joinSelectedBoard)

    if (socket.connected) {
      joinSelectedBoard()
    }

    return () => {
      socket.off('connect', joinSelectedBoard)
    }
  }, [token, board?._id])

  async function createTask() {
    if (!board?._id) {
      setNotice('')
      setDataError('Please select a board before creating a task.')
      return
    }
    const title = window.prompt('Enter a task title:')
    if (!title?.trim()) return
    const description = window.prompt('Enter a short task description:') || ''
    const todoColumn = columns.find((column) => column.title.toLowerCase() === 'to do')
    if (!todoColumn) {
      setDataError('The To Do column was not found.')
      return
    }
    try {
      setDataError('')
      setNotice('')
      const result = await apiRequest(`/boards/${board._id}/tasks`, {
        token,
        method: 'POST',
        body: { title: title.trim(), description: description.trim(), columnId: todoColumn.id, priority: 'medium' },
      })
      if (!result.data?._id) throw new Error('The API did not return the saved task.')
      setTasks((current) => {
        const alreadyExists = current.some(
          (task) => task.id === result.data._id,
        )

        if (alreadyExists) return current

        return [...current, mapTask(result.data)]
      })
      setNotice('Task created and saved successfully.')
    } catch (error) {
      setDataError(error.message || 'Failed to create task.')
    }
  }
  async function editTask(task) {
    const title = window.prompt('Edit task title:', task.title)

    if (title === null) return

    if (!title.trim()) {
      setDataError('Task title cannot be empty.')
      return
    }

    const description = window.prompt(
      'Edit task description:',
      task.description || '',
    )

    if (description === null) return

    setDataError('')
    setNotice('')

    try {
      const response = await apiRequest(`/tasks/${task.id}`, {
        token,
        method: 'PATCH',
        body: {
          title: title.trim(),
          description: description.trim(),
        },
      })

      if (!response.data?._id) {
        throw new Error('The API did not return the updated task.')
      }

      setTasks((current) =>
        current.map((currentTask) =>
          currentTask.id === task.id
            ? mapTask(response.data)
            : currentTask,
        ),
      )

      setNotice('Task updated and saved successfully.')
    } catch (error) {
      setDataError(error.message || 'Failed to update task.')
    }
  }
  async function deleteTask(task) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?`,
    )

    if (!confirmed) return

    setDataError('')
    setNotice('')

    try {
      await apiRequest(`/tasks/${task.id}`, {
        token,
        method: 'DELETE',
      })

      setTasks((current) =>
        current.filter((currentTask) => currentTask.id !== task.id),
      )

      setNotice('Task deleted successfully.')
    } catch (error) {
      setDataError(error.message || 'Failed to delete task.')
    }
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id || !board?._id) return
    const sourceTask = tasks.find((task) => task.id === active.id)
    if (!sourceTask) return
    const targetTask = tasks.find((task) => task.id === over.id)
    const targetColumnId = targetTask ? targetTask.status : (over.data.current?.status || over.id)
    if (!columns.some((column) => column.id === targetColumnId)) return

    const oldIndex = tasks.findIndex((task) => task.id === active.id)
    const targetIndex = targetTask
      ? tasks.findIndex((task) => task.id === targetTask.id)
      : tasks.filter((task) => task.status === targetColumnId).length
    const originalTasks = tasks
    const optimisticTasks = sourceTask.status === targetColumnId && targetTask
      ? arrayMove(tasks, oldIndex, Math.max(0, targetIndex))
      : tasks.map((task) => task.id === active.id ? { ...task, status: targetColumnId } : task)
    setTasks(optimisticTasks)
    setDataError('')
    setNotice('')
    try {
      const response = await apiRequest(`/tasks/${sourceTask.id}`, {
        token,
        method: 'PATCH',
        body: { columnId: targetColumnId, position: Math.max(0, targetIndex) },
      })
      if (response.data) {
        setTasks((current) => current.map((task) =>
          task.id === sourceTask.id ? { ...task, ...mapTask(response.data) } : task))
      }
      setNotice('Task movement saved successfully.')
    } catch (error) {
      setTasks(originalTasks)
      setDataError(error.message || 'Failed to save task movement. The board was restored.')
    }
  }

  const visibleTasks = tasks.filter((task) =>
    `${task.title} ${task.description}`.toLowerCase().includes(search.toLowerCase()),
  )
  const inProgressIds = columns.filter((column) => column.title.toLowerCase() === 'in progress').map((column) => column.id)
  const doneIds = columns.filter((column) => column.title.toLowerCase() === 'done').map((column) => column.id)

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <form onSubmit={handleLogin} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white">T</div>
            <div><h1 className="text-2xl font-bold text-slate-900">TaskFlow</h1><p className="text-sm text-slate-500">Sign in to your workspace</p></div>
          </div>
          <label className="mb-4 block text-sm font-medium text-slate-700">Email
            <input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="you@example.com" />
          </label>
          <label className="mb-4 block text-sm font-medium text-slate-700">Password
            <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="Enter your password" />
          </label>
          {loginError && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{loginError}</p>}
          <button type="submit" disabled={loginLoading} className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60">
            {loginLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 md:flex">
      <aside className="flex w-full shrink-0 flex-col bg-slate-950 p-5 text-slate-300 md:min-h-screen md:w-64">
        <div className="mb-9 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-xl font-bold text-white">T</div>
          <div><h1 className="text-xl font-bold tracking-tight text-white">TaskFlow</h1><p className="text-xs text-slate-400">Work, organized.</p></div>
        </div>
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Workspace</p>
        <nav className="flex flex-col gap-2" aria-label="Main navigation">
          {['My Boards', 'Favorites', 'Recent'].map((item) => (
            <button key={item} onClick={() => setActiveNav(item)} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition ${activeNav === item ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <span aria-hidden="true">{item === 'My Boards' ? '▦' : item === 'Favorites' ? '☆' : '◷'}</span>{item}
              {item === 'My Boards' && <span className="ml-auto text-xs">1</span>}
            </button>
          ))}
        </nav>
        <div className="mt-8 border-t border-slate-800 pt-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Workspace status</p>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white"><span className="h-2 w-2 rounded-full bg-emerald-400" />Workspace ready</div>
            <p className="text-xs leading-5 text-slate-400">Organize tasks and keep every project moving.</p>
          </div>
        </div>
        <div className="mt-6 border-t border-slate-800 pt-5 md:mt-auto">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-400 font-semibold text-white">TF</div>
            <div><p className="text-sm font-semibold text-white">TaskFlow User</p><p className="text-xs text-slate-400">Workspace member</p></div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-indigo-600">
              YOUR WORKSPACE
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              {activeBoard}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Plan, track, and complete your work.
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <span
                className="h-2 w-2 rounded-full bg-emerald-500"
                aria-hidden="true"
              />
              {onlineUserCount} {onlineUserCount === 1 ? 'user' : 'users'} online
            </p>
          </div>

          <button onClick={createTask} disabled={dataLoading || !board} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"><span className="text-lg" aria-hidden="true">+</span>Add task</button>
        </header>

        {dataLoading && <p role="status" className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">Loading your board...</p>}
        {dataError && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{dataError}</p>}
        {notice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total tasks', value: tasks.length, helper: 'Across this board' },
            { label: 'In progress', value: tasks.filter((task) => inProgressIds.includes(task.status)).length, helper: 'Currently underway' },
            { label: 'Completed', value: tasks.filter((task) => doneIds.includes(task.status)).length, helper: 'Successfully finished' },
          ].map((stat) => <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{stat.label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p><p className="mt-1 text-xs text-slate-400">{stat.helper}</p></div>)}
        </section>

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="text-lg font-bold text-slate-900">Board tasks</h3><p className="mt-1 text-sm text-slate-500">Drag tasks between columns to update their status.</p></div>
          <label className="block w-full sm:max-w-xs"><span className="sr-only">Search tasks</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks..." className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></label>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="grid items-start gap-4 lg:grid-cols-3">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={visibleTasks.filter((task) => task.columnId === column.id)}
                onEdit={editTask}
                onDelete={deleteTask}
              />
            ))}
          </div>
        </DndContext>
        <footer className="mt-12 border-t border-slate-200 py-6 text-center text-xs text-slate-400">TaskFlow · Make work flow better.</footer>
      </main>
    </div>
  )
}

export default App
