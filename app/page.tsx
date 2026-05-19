import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">

      {/* HEADER */}
      <header className="flex w-full items-center justify-between border-b border-zinc-200 px-6 py-5 dark:border-zinc-800 md:px-10">
        <div className="flex items-center gap-3">
        {/*
  <Image
    src="/next.svg"
    alt="InCart Logo"
    width={120}
    height={30}
    className="dark:invert"
  />
*/}
          <span className="text-lg font-semibold text-black dark:text-white">
            InCart Billing
          </span>
        </div>

        <nav className="hidden gap-6 text-sm text-zinc-600 dark:text-zinc-300 md:flex">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#contact">Contact</a>
        </nav>

        <button className="rounded-full bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black">
          Get Started
        </button>
      </header>

      {/* HERO */}
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="max-w-4xl space-y-8 text-center">

          <h1 className="text-4xl font-bold leading-tight text-black dark:text-white md:text-6xl">
            Smart Healthcare Billing for Modern Clinics
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            InCart Health Care Billing simplifies hospital, clinic, and pharmacy
            operations with fast invoicing, insurance processing, and patient
            management — all in one platform.
          </p>

          {/* CTA */}
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="#"
              className="rounded-full bg-black px-6 py-3 font-medium text-white dark:bg-white dark:text-black"
            >
              Start Free Trial
            </a>

            <a
              href="#features"
              className="rounded-full border border-zinc-300 px-6 py-3 text-black dark:border-zinc-700 dark:text-white"
            >
              Explore Features
            </a>
          </div>

          {/* HERO IMAGE PLACEHOLDER */}
          <div className="mt-12 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Dashboard Preview Coming Soon 🚀
            </p>
          </div>
        </div>
      </main>

      {/* FEATURES */}
      <section id="features" className="px-6 py-20 md:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-3xl font-bold text-black dark:text-white">
            Powerful Features
          </h2>

          <div className="grid gap-6 md:grid-cols-3">

            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-900">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Fast Billing System
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Generate invoices instantly with automated calculations and GST support.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-900">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Insurance Management
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Simplify claims, approvals, and reimbursement tracking.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-900">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Patient Records
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Secure digital storage for complete patient medical history.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-6 py-20 md:px-10">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-bold text-black dark:text-white">
            Simple Pricing
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">

            <div className="rounded-xl border p-6 dark:border-zinc-800">
              <h3 className="font-semibold">Starter</h3>
              <p className="mt-2 text-2xl font-bold">$9/mo</p>
              <p className="mt-2 text-sm text-zinc-500">Basic billing tools</p>
            </div>

            <div className="rounded-xl border p-6 dark:border-zinc-800">
              <h3 className="font-semibold">Professional</h3>
              <p className="mt-2 text-2xl font-bold">$29/mo</p>
              <p className="mt-2 text-sm text-zinc-500">For clinics & labs</p>
            </div>

            <div className="rounded-xl border p-6 dark:border-zinc-800">
              <h3 className="font-semibold">Enterprise</h3>
              <p className="mt-2 text-2xl font-bold">Custom</p>
              <p className="mt-2 text-sm text-zinc-500">Hospitals & networks</p>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
        © {new Date().getFullYear()} InCart Health Care Billing. All rights reserved.
      </footer>
    </div>
  );
}