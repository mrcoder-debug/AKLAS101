import { getCertificateByShareToken } from "@/services/certificate.service";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PrintButton } from "./print-button";

interface Props {
  params: Promise<{ shareToken: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareToken } = await params;
  const cert = await getCertificateByShareToken(shareToken);
  if (!cert) return { title: "Certificate Not Found" };
  return {
    title: `Certificate — ${cert.courseName} | AKLAS`,
    description: `${cert.studentName} has completed ${cert.courseName}`,
  };
}

export default async function PublicCertificatePage({ params }: Props) {
  const { shareToken } = await params;
  const cert = await getCertificateByShareToken(shareToken);
  if (!cert) notFound();

  const issued = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(cert.issuedAt));

  return (
    <>
      {/* Google Fonts — Cormorant Garamond for certificate text */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap"
        rel="stylesheet"
      />

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .cert-page { min-height: 100vh; padding: 0 !important; }
          .cert-card {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>

      <div className="cert-page min-h-screen bg-gradient-to-br from-amber-50 via-stone-100 to-amber-50 dark:from-stone-950 dark:via-stone-900 dark:to-amber-950/30 flex flex-col items-center justify-center px-4 py-12">

        {/* Nav bar (hidden on print) */}
        <div className="no-print mb-8 flex w-full max-w-3xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 shadow-sm shrink-0">
              <span className="text-sm font-bold text-white leading-none">A</span>
            </div>
            <span className="text-base font-semibold tracking-tight text-stone-700 dark:text-stone-300">
              AKLAS Academy
            </span>
          </div>
          <PrintButton />
        </div>

        {/* Certificate card */}
        <div className="cert-card relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white dark:bg-stone-950 shadow-2xl shadow-amber-200/40 dark:shadow-amber-900/20">

          {/* Outer decorative border */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none" aria-hidden>
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              {/* Outer border */}
              <rect x="12" y="12" width="calc(100% - 24px)" height="calc(100% - 24px)"
                rx="12" ry="12" fill="none"
                stroke="#d97706" strokeWidth="2" strokeOpacity="0.5"
              />
              {/* Inner border */}
              <rect x="20" y="20" width="calc(100% - 40px)" height="calc(100% - 40px)"
                rx="8" ry="8" fill="none"
                stroke="#d97706" strokeWidth="0.75" strokeOpacity="0.3"
              />
            </svg>
          </div>

          {/* Subtle radial gradient wash */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(217,119,6,0.07) 0%, transparent 65%)",
            }}
          />

          {/* Main content */}
          <div className="relative px-10 py-14 text-center md:px-20 md:py-20">

            {/* Seal / emblem */}
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/20 ring-4 ring-amber-200/60 dark:ring-amber-700/30">
              <svg
                viewBox="0 0 48 48"
                className="h-10 w-10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <circle cx="24" cy="24" r="22" stroke="#d97706" strokeWidth="1.5" strokeOpacity="0.6" />
                <circle cx="24" cy="24" r="18" stroke="#d97706" strokeWidth="0.75" strokeOpacity="0.4" />
                <path
                  d="M24 10 L26.4 17.6 L34.4 17.6 L28 22.4 L30.4 30 L24 25.2 L17.6 30 L20 22.4 L13.6 17.6 L21.6 17.6 Z"
                  fill="#d97706"
                  fillOpacity="0.85"
                />
              </svg>
            </div>

            {/* Institution name */}
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-600 dark:text-amber-500"
            >
              AKLAS Academy
            </p>

            {/* "Certificate of Completion" */}
            <h1
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              className="mb-6 text-5xl font-normal italic text-stone-700 dark:text-stone-200 md:text-6xl"
            >
              Certificate of Completion
            </h1>

            {/* Divider */}
            <div className="mx-auto mb-8 flex items-center gap-3 w-64">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-400/50" />
              <div className="h-1 w-1 rounded-full bg-amber-500/60" />
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-400/50" />
            </div>

            {/* Body copy */}
            <p
              className="mb-3 text-sm uppercase tracking-widest text-stone-500 dark:text-stone-400"
            >
              This is to certify that
            </p>

            {/* Student name */}
            <p
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              className="mb-4 text-4xl font-semibold text-stone-900 dark:text-stone-100 md:text-5xl"
            >
              {cert.studentName}
            </p>

            <p
              className="mb-4 text-sm text-stone-500 dark:text-stone-400"
            >
              has successfully completed the course
            </p>

            {/* Course name */}
            <p
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              className="mb-10 text-2xl font-semibold text-amber-700 dark:text-amber-400 md:text-3xl"
            >
              {cert.courseName}
            </p>

            {/* Divider */}
            <div className="mx-auto mb-8 flex items-center gap-3 w-64">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-400/50" />
              <div className="h-1 w-1 rounded-full bg-amber-500/60" />
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-400/50" />
            </div>

            {/* Issue date */}
            <p className="text-xs text-stone-400 dark:text-stone-500 tracking-wide">
              Issued on{" "}
              <span className="font-medium text-stone-600 dark:text-stone-300">{issued}</span>
            </p>
          </div>
        </div>

        {/* Footer note (hidden on print) */}
        <p className="no-print mt-6 text-center text-xs text-stone-400 dark:text-stone-600">
          This certificate was issued by AKLAS Academy. Use the Share button to copy a link.
        </p>
      </div>
    </>
  );
}
