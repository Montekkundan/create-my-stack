export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Welcome to your custom stack!</h1>
        
        <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-3 lg:text-left">
          <div className="group rounded-lg border border-transparent px-5 py-4">
            <h2 className="mb-3 text-2xl font-semibold">
              Next.js App Router
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Built with the latest Next.js features and App Router.
            </p>
          </div>

          <div className="group rounded-lg border border-transparent px-5 py-4">
            <h2 className="mb-3 text-2xl font-semibold">
              TypeScript
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Full type safety across your entire project.
            </p>
          </div>

          <div className="group rounded-lg border border-transparent px-5 py-4">
            <h2 className="mb-3 text-2xl font-semibold">
              Customized Stack
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Built with your preferred tools and configurations.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
