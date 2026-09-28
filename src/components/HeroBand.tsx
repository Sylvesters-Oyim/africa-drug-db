import Image from "next/image";
import { AtomIcon, DnaIcon, MoleculeIcon } from "./ScienceIcons";

/**
 * Full-width peach hero card: copy on the left, the reference illustration
 * anchored bottom-right, plus a few floating SVG decorations.
 */
export function HeroBand({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-cream shadow-soft">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-blush motion-safe:animate-drift"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-blush/70 motion-safe:animate-float-slow"
      />

      <div className="relative grid items-end lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="relative z-10 px-6 pb-10 pt-10 sm:px-10 sm:pt-14 lg:py-20 lg:pl-14 lg:pr-4 xl:pl-16">
          {children}
        </div>

        <div className="relative lg:self-stretch">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
            <MoleculeIcon className="absolute left-[6%] top-[12%] h-12 w-12 opacity-80 motion-safe:animate-float" />
            <DnaIcon className="absolute left-[38%] top-[6%] h-14 w-9 opacity-70 motion-safe:animate-float-slow" />
            <AtomIcon className="absolute right-[10%] top-[10%] h-14 w-14 opacity-70 motion-safe:animate-spin-slow" />
          </div>
          <div className="hero-fade relative h-full lg:flex lg:items-end">
            <Image
              src="/hero-science.webp"
              alt="Illustration of lab equipment, molecules and DNA helices"
              width={740}
              height={493}
              priority
              quality={90}
              sizes="(min-width: 1024px) 740px, 100vw"
              className="block h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
