import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function LandingCTA() {
  return (
    <section className="py-24 lg:py-32">
      <div className="container">
        <div className="relative mx-auto max-w-3xl rounded-3xl overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 gradient-primary" />
          {/* Atmospheric inner glow */}
          <div className="absolute -top-1/2 -right-1/4 h-[400px] w-[400px] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 h-[300px] w-[300px] rounded-full bg-white/10 blur-3xl" />

          <div className="relative px-8 py-16 text-center sm:px-16">
            <p className="text-sm font-medium text-white/70 uppercase tracking-widest mb-4">Get started</p>
            <h2 className="font-serif text-4xl font-normal leading-tight text-white lg:text-5xl">
              Ready to transform how your
              <br className="hidden sm:block" />
              <span className="font-bold italic"> organisation learns?</span>
            </h2>
            <p className="mt-5 text-base text-white/75 leading-relaxed max-w-lg mx-auto">
              AKLAS is invitation-only. Contact us to discuss your institution&apos;s needs and we&apos;ll get you set up with a tailored onboarding plan.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-white text-primary hover:bg-white/90 border-0 shadow-lg h-12 px-7 font-semibold gap-2"
              >
                <a href="mailto:admin@aklas.example.com">
                  Request Access
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="text-white hover:text-white hover:bg-white/10 border border-white/20 h-12 px-7"
              >
                <Link href="/login">Sign In →</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
