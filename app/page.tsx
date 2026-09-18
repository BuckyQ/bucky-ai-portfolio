export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-4xl">
          <p className="mb-4 text-sm text-zinc-400">
            SOFTWARE ENGINEER → APPLIED AI ENGINEER
          </p>

          <h1 className="text-6xl font-bold tracking-tight">
            Bucky Qian
          </h1>

          <h2 className="mt-4 text-3xl text-zinc-300">
            Applied AI Engineer
          </h2>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            Building AI agents, RAG systems, LLM applications, and
            production software with TypeScript.
          </p>

          <div className="mt-8 flex gap-4">
            <a
              href="#projects"
              className="rounded-lg bg-white px-5 py-3 font-medium text-black"
            >
              View Projects
            </a>

            <a
              href="https://github.com/BuckyQ"
              target="_blank"
              className="rounded-lg border border-zinc-700 px-5 py-3"
            >
              GitHub
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}