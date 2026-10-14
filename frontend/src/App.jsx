import { useState } from 'react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const initialTasks = [
  {
    id: 'task-1',
    title: 'Design landing page',
    description: 'Create the first draft of the new landing page.',
    priority: 'High',
    status: 'todo',
  },
  {
    id: 'task-2',
    title: 'Set up project structure',
    description: 'Organize frontend components and folders.',
    priority: 'Medium',
    status: 'todo',
  },
  {
    id: 'task-3',
    title: 'Build authentication API',
    description: 'Implement registration and login endpoints.',
    priority: 'High',
    status: 'progress',
  },
  {
    id: 'task-4',
    title: 'Create dashboard layout',
    description: 'Build the main responsive dashboard.',
    priority: 'Medium',
    status: 'progress',
  },
  {
    id: 'task-5',
    title: 'Initialize repository',
    description: 'Configure Git and the project workspace.',
    priority: 'Low',
    status: 'done',
  },
]

const columns = [
  { id: 'todo', title: 'To Do', color: 'bg-slate-400' },
  { id: 'progress', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'done', title: 'Done', color: 'bg-emerald-500' },
]

const priorityStyles = {
  High: 'bg-red-50 text-red-700',
  Medium: 'bg-amber-50 text-amber-700',
  Low: 'bg-emerald-50 text-emerald-700',
}

function TaskCard({ task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { status: task.status },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab touch-none rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md active:cursor-grabbing"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[task.priority]}`}
        >
          {task.priority}
        </span>
        <span className="text-xs text-slate-400">↕ Drag</span>
      </div>

      <h4 className="font-semibold leading-6 text-slate-900">
        {task.title}
      </h4>

      <p className="mt-2 text-sm leading-5 text-slate-500">
        {task.description}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-400">
          {task.id.toUpperCase()}
        </span>
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700"
          aria-label="TaskFlow member"
        >
          TF
        </span>
      </div>
    </article>
  )
}

function KanbanColumn({ column, tasks }) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: { status: column.id },
  })

  const taskIds = tasks.map((task) => task.id)

  return (
    <section
      ref={setNodeRef}
      className="flex min-h-80 min-w-0 flex-col rounded-2xl bg-slate-100 p-3 sm:p-4"
      aria-label={`${column.title} column`}
    >
      <div className="mb-4 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${column.color}`} />
          <h3 className="font-bold text-slate-800">{column.title}</h3>
        </div>
        <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
          {tasks.length}
        </span>
      </div>

      <SortableContext
        items={taskIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}

          {tasks.length === 0 && (
            <div className="flex min-h-24 flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-3 text-center text-sm text-slate-400">
              Drop a task here
            </div>
          )}
        </div>
      </SortableContext>
    </section>
  )
}

function App() {
  const [tasks, setTasks] = useState(initialTasks)
  const [search, setSearch] = useState('')
  const [activeNav, setActiveNav] = useState('My Boards')
  const activeBoard = 'TaskFlow Project'
  const [notice, setNotice] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const visibleTasks = tasks.filter((task) =>
    `${task.title} ${task.description}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  function handleDragEnd(event) {
    const { active, over } = event

    if (!over || active.id === over.id) return

    setTasks((currentTasks) => {
      const oldIndex = currentTasks.findIndex(
        (task) => task.id === active.id,
      )
      const newIndex = currentTasks.findIndex(
        (task) => task.id === over.id,
      )

      if (oldIndex === -1) return currentTasks

      const sourceTask = currentTasks[oldIndex]
      const targetTask = currentTasks[newIndex]

      // Dropping on another task moves the task into that task's column.
      if (targetTask) {
        if (sourceTask.status === targetTask.status) {
          return arrayMove(currentTasks, oldIndex, newIndex)
        }

        const updated = currentTasks.map((task) =>
          task.id === active.id
            ? { ...task, status: targetTask.status }
            : task,
        )

        const movedTask = updated.find((task) => task.id === active.id)
        const withoutMoved = updated.filter((task) => task.id !== active.id)
        const targetIndex = withoutMoved.findIndex(
          (task) => task.id === targetTask.id,
        )

        withoutMoved.splice(targetIndex, 0, movedTask)
        return withoutMoved
      }

      // Dropping over an empty column is handled by column droppable data.
      const targetStatus = over.data.current?.status

      if (targetStatus && sourceTask.status !== targetStatus) {
        return currentTasks.map((task) =>
          task.id === active.id
            ? { ...task, status: targetStatus }
            : task,
        )
      }

      return currentTasks
    })
  }

  function createTask() {
    const title = window.prompt('Enter a task title:')

    if (!title?.trim()) return

    const description =
      window.prompt('Enter a short task description:') ||
      'No description added.'

    setTasks((current) => [
      ...current,
      {
        id: `task-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        priority: 'Medium',
        status: 'todo',
      },
    ])
    setNotice('Task created successfully.')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 md:flex">
      <aside className="flex w-full shrink-0 flex-col bg-slate-950 p-5 text-slate-300 md:min-h-screen md:w-64">
        <div className="mb-9 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-xl font-bold text-white">
            T
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              TaskFlow
            </h1>
            <p className="text-xs text-slate-400">Work, organized.</p>
          </div>
        </div>

        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Workspace
        </p>

        <nav className="flex flex-col gap-2" aria-label="Main navigation">
          {['My Boards', 'Favorites', 'Recent'].map((item) => (
            <button
              key={item}
              onClick={() => setActiveNav(item)}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition ${
                activeNav === item
                  ? 'bg-indigo-500 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span aria-hidden="true">
                {item === 'My Boards'
                  ? '▦'
                  : item === 'Favorites'
                    ? '☆'
                    : '◷'}
              </span>
              {item}
              {item === 'My Boards' && (
                <span className="ml-auto text-xs">1</span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-8 border-t border-slate-800 pt-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Workspace status
          </p>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Workspace ready
            </div>
            <p className="text-xs leading-5 text-slate-400">
              Organize tasks and keep every project moving.
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-800 pt-5 md:mt-auto">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-400 font-semibold text-white">
              TF
            </div>
            <div>
              <p className="text-sm font-semibold text-white">TaskFlow User</p>
              <p className="text-xs text-slate-400">Workspace member</p>
            </div>
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
          </div>

          <button
            onClick={createTask}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <span className="text-lg" aria-hidden="true">+</span>
            Add task
          </button>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: 'Total tasks',
              value: tasks.length,
              helper: 'Across this board',
            },
            {
              label: 'In progress',
              value: tasks.filter((task) => task.status === 'progress').length,
              helper: 'Currently underway',
            },
            {
              label: 'Completed',
              value: tasks.filter((task) => task.status === 'done').length,
              helper: 'Successfully finished',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-slate-400">{stat.helper}</p>
            </div>
          ))}
        </section>

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Board tasks</h3>
            <p className="mt-1 text-sm text-slate-500">
              Drag tasks between columns to update their status.
            </p>
          </div>

          <label className="block w-full sm:max-w-xs">
            <span className="sr-only">Search tasks</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
        </div>

        {notice && (
          <p
            role="status"
            className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {notice}
          </p>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <div className="grid items-start gap-4 lg:grid-cols-3">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={visibleTasks.filter(
                  (task) => task.status === column.id,
                )}
              />
            ))}
          </div>
        </DndContext>

        <footer className="mt-12 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          TaskFlow · Make work flow better.
        </footer>
      </main>
    </div>
  )
}

export default App
