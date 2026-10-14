
import { useState } from 'react'

const initialBoards = [
  {
    id: 1,
    name: 'Website Redesign',
    description: 'Plan and track the website redesign.',
    color: 'bg-violet-500',
    columns: 4,
    tasks: 12,
  },
  {
    id: 2,
    name: 'Development',
    description: 'Manage development tasks and releases.',
    color: 'bg-blue-500',
    columns: 3,
    tasks: 8,
  },
  {
    id: 3,
    name: 'Marketing Campaign',
    description: 'Organize marketing activities and ideas.',
    color: 'bg-emerald-500',
    columns: 4,
    tasks: 15,
  },
]

function App() {
  const [boards, setBoards] = useState(initialBoards)
  const [search, setSearch] = useState('')
  const [activeNav, setActiveNav] = useState('My Boards')

  const filteredBoards = boards.filter((board) =>
    board.name.toLowerCase().includes(search.toLowerCase())
  )

  function createBoard() {
    const newBoard = {
      id: Date.now(),
      name: 'Untitled Board',
      description: 'Your new workspace is ready to organize.',
      color: 'bg-indigo-500',
      columns: 0,
      tasks: 0,
    }

    setBoards((currentBoards) => [...currentBoards, newBoard])
    setActiveNav('My Boards')
    setSearch('')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 md:flex">
      <aside className="flex w-full shrink-0 flex-col bg-slate-950 p-5 text-slate-300 md:min-h-screen md:w-64">
        <a href="#" className="mb-9 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-xl font-bold text-white">
            T
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              TaskFlow
            </h1>
            <p className="text-xs text-slate-400">Work, organized.</p>
          </div>
        </a>

        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Workspace
        </p>

        <nav className="flex flex-col gap-2" aria-label="Main navigation">
          <button
            onClick={() => setActiveNav('My Boards')}
            className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition ${
              activeNav === 'My Boards'
                ? 'bg-indigo-500 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span aria-hidden="true">▦</span>
            My Boards
            <span className="ml-auto text-xs">{boards.length}</span>
          </button>

          <button
            onClick={() => setActiveNav('Favorites')}
            className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition ${
              activeNav === 'Favorites'
                ? 'bg-indigo-500 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span aria-hidden="true">☆</span>
            Favorites
          </button>

          <button
            onClick={() => setActiveNav('Recent')}
            className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition ${
              activeNav === 'Recent'
                ? 'bg-indigo-500 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span aria-hidden="true">◷</span>
            Recent
          </button>
        </nav>

        <div className="mt-8 border-t border-slate-800 pt-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Workspace status
          </p>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Your workspace
            </div>
            <p className="text-xs leading-5 text-slate-400">
              Keep projects, tasks, and ideas organized in one place.
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
        <header className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-indigo-600">
              YOUR WORKSPACE
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              {activeNav === 'My Boards' ? 'My Boards' : activeNav}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Organize your work and keep every project moving.
            </p>
          </div>

          <button
            onClick={createBoard}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <span className="text-lg" aria-hidden="true">+</span>
            Create board
          </button>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total boards</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {boards.length}
            </p>
            <p className="mt-1 text-xs text-slate-400">Your project spaces</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total tasks</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {boards.reduce((total, board) => total + board.tasks, 0)}
            </p>
            <p className="mt-1 text-xs text-slate-400">Across all demo boards</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total columns</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {boards.reduce((total, board) => total + board.columns, 0)}
            </p>
            <p className="mt-1 text-xs text-slate-400">Across all demo boards</p>
          </div>
        </section>

        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Your projects
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Select a board to see your project overview.
              </p>
            </div>

            <label className="relative block w-full sm:max-w-xs">
              <span className="sr-only">Search boards</span>
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                ⌕
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search boards..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          </div>

          {filteredBoards.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredBoards.map((board) => (
                <article
                  key={board.id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className={`h-2 ${board.color}`} />
                  <div className="p-5">
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${board.color} bg-opacity-10 text-xl`}>
                        <span className="text-slate-700" aria-hidden="true">▦</span>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                        Board
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-slate-900">
                      {board.name}
                    </h4>
                    <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">
                      {board.description}
                    </p>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                      <span>{board.columns} columns</span>
                      <span>{board.tasks} tasks</span>
                    </div>
                  </div>
                </article>
              ))}

              <button
                onClick={createBoard}
                className="flex min-h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-transparent p-6 text-slate-500 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
                  +
                </span>
                <span className="font-semibold">Create a new board</span>
                <span className="mt-2 text-sm">Start organizing a project</span>
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600">
                ▦
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                {search ? 'No boards found' : 'No boards yet'}
              </h4>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {search
                  ? 'Try another search term to find your project.'
                  : 'Create your first board to start organizing your work.'}
              </p>
              {search ? (
                <button
                  onClick={() => setSearch('')}
                  className="mt-5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Clear search
                </button>
              ) : (
                <button
                  onClick={createBoard}
                  className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Create your first board
                </button>
              )}
            </div>
          )}
        </section>

        <footer className="mt-12 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          TaskFlow · Make work flow better.
        </footer>
      </main>
    </div>
  )
}

export default App
