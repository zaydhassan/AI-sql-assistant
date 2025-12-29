"use client";

import { Vortex } from "@/components/ui/vortex";
import FaqSection from "@/components/FaqSection";
import AnimatedTestimonials from "@/components/AnimatedTestimonials";
export default function HomePage() {
  return (
    <>
     <section className="relative min-h-[80vh] w-full overflow-hidden px-6">
  
  <div className="absolute inset-0 bg-linear-to-br from-violet-50 via-indigo-100 to-slate-100" />


  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.08),transparent_70%)]" />

  <Vortex
    className="absolute inset-0"
    backgroundColor="transparent"
    particleCount={500}
    rangeY={500}
    baseHue={215} 
  />

  <div className="relative z-10 mx-auto max-w-5xl h-[67vh] flex flex-col items-center justify-center text-center">
   
    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-1 text-sm font-medium text-white shadow">
      ⚡ AI-Powered Analytics
    </div>

    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900">
      AI SQL{" "}
      <span className="bg-linear-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
        Analytics
      </span>
      <br />
      Assistant
    </h1>

    <p className="mt-6 max-w-2xl text-lg md:text-xl text-slate-700">
      Upload a CSV and ask questions in plain English.
      <br />
      <span className="font-semibold text-slate-900">
        No SQL. No dashboards. Just answers.
      </span>
    </p>

    <div className="mt-8 flex gap-6 text-sm text-slate-600">
      <span>✔ Schema detected</span>
      <span>✔ Read-only SQL</span>
      <span>✔ Secure processing</span>
    </div>

    <div className="mt-10 flex gap-4">
      <a
        href="/"
        className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white shadow-lg hover:bg-slate-800 transition"
      >
        Upload Dataset
      </a>

      <a
  href="/ask"
  className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-black-900
             hover:bg-slate-900 hover:text-black transition"
>
  Try a Demo
</a>
    </div>
  </div>
</section>

      <main className="container">
        <section className="how-it-works fade-in">
          <div className="how-step">
            <span>1</span>
            <h4>Upload CSV</h4>
            <p>Any structured dataset</p>
          </div>
          <div className="how-step">
            <span>2</span>
            <h4>AI Understands</h4>
            <p>Schema & relationships</p>
          </div>
          <div className="how-step">
            <span>3</span>
            <h4>Ask in English</h4>
            <p>No SQL required</p>
          </div>
          <div className="how-step">
            <span>4</span>
            <h4>Get Insights</h4>
            <p>Charts & KPIs</p>
          </div>
        </section>

        <section className="capabilities fade-in">
          <h3>What you can ask</h3>
          <div className="cap-grid">
            <div className="cap-card">📈 Sales trends over time</div>
            <div className="cap-card">🏆 Top products by revenue</div>
            <div className="cap-card">📊 Month-over-month growth</div>
            <div className="cap-card">💰 Average order value</div>
          </div>
        </section>
<AnimatedTestimonials />

      <FaqSection />
      </main>
    </>
  );
}