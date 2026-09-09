import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HomeLandingPage() {
  return (
    <>
      <Head>
        <title>Elíseos Box & Fitness | Portal de Miembros</title>
        <meta
          name="description"
          content="Accede al portal de Elíseos Box & Fitness para revisar tus actividades, notas clínicas, paquetes y estado de cuenta."
        />
      </Head>

      <main className="relative min-h-dvh overflow-hidden bg-[#122b2b] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-10 h-80 w-80 rounded-full bg-[#1c4040]/80 blur-3xl" />
          <div className="absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-[#c2ef03]/15 blur-3xl" />
          <div className="absolute -bottom-30 left-1/2 h-80 w-xl -translate-x-1/2 rounded-full bg-[#1c4040]/90 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-6 py-10 sm:px-10 lg:px-12">
          <header className="flex items-center justify-between">
            <img
              src="/img/logo_dark.png"
              alt="Elíseos Box & Fitness"
              className="h-14 w-auto sm:h-18 object-contain"
            />
            <span className="hidden rounded-full border border-[#c2ef03]/30 bg-[#c2ef03]/10 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-[#c2ef03] sm:block">
              Portal de Miembros
            </span>
          </header>

          <section className="mx-auto my-auto w-full max-w-4xl">
            <div className="rounded-3xl border border-white/10 bg-[#1c4040]/40 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-10 lg:p-14">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#c2ef03]/40 bg-[#c2ef03]/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#c2ef03]">
                <Sparkles size={14} />
                Box & Fitness Elite
              </div>

              <h1 className="text-balance text-3xl font-black leading-tight text-white sm:text-5xl lg:text-6xl font-serif">
                Tu disciplina,
                <span className="block bg-gradient-to-r from-white via-gray-100 to-[#c2ef03] bg-clip-text text-transparent italic font-light">
                  concentrada en el Portal
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base text-gray-200/90 sm:text-lg">
                Consulta tus clases de boxeo, entrenamiento funcional, paquetes, notas clínicas y estado de cuenta desde una sola plataforma.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/portal"
                  className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-[#c2ef03] px-8 py-4 text-sm font-extrabold uppercase tracking-[0.18em] text-[#1c4040] shadow-[0_18px_35px_rgba(194,239,3,0.25)] transition-all duration-300 hover:scale-[1.02] hover:bg-[#d6ff17] hover:shadow-[0_22px_45px_rgba(194,239,3,0.35)]"
                >
                  Entrar al portal
                  <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                <p className="text-sm text-gray-300">
                  Acceso exclusivo para miembros de Elíseos Box & Fitness.
                </p>
              </div>
            </div>
          </section>

          <footer className="mt-8 flex justify-center pb-2">
            <Link
              href="/login"
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 transition-colors hover:text-[#c2ef03]"
            >
              Soy Staff / Coach
            </Link>
          </footer>
        </div>
      </main>
    </>
  );
}
