export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8 animate-pulse">
      <header className="mb-10 space-y-3">
        <div className="h-10 bg-gray-200 rounded-lg w-1/3"></div>
        <div className="h-5 bg-gray-100 rounded-lg w-1/4"></div>
      </header>

      <section className="space-y-5">
        <div className="h-7 bg-gray-200 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 h-40"></div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 h-40"></div>
        </div>
      </section>

      <section className="space-y-5 mt-8">
        <div className="h-7 bg-gray-200 rounded-lg w-1/4"></div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 h-32"></div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
        <div className="bg-white border border-gray-100 rounded-[2rem] p-6 h-48"></div>
        <div className="bg-white border border-gray-100 rounded-[2rem] p-6 h-48"></div>
      </div>
    </div>
  )
}
