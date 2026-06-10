export function PageHero({
  eyebrow,
  title,
  subtitle,
  image,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  image?: string;
}) {
  return (
    <section className="relative bg-hero text-white overflow-hidden">
      {image && (
        <div className="absolute inset-0">
          <img
            src={image}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/92 via-charcoal/82 to-charcoal/56" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/88 via-charcoal/24 to-transparent" />
        </div>
      )}
      <div className="absolute inset-0 grid-pattern opacity-50" />
      <div className="absolute -top-40 -left-20 size-[500px] rounded-full bg-lime-gradient opacity-20 blur-3xl" />
      <div className="absolute bottom-0 right-0 size-[400px] rounded-full bg-lime opacity-10 blur-3xl" />
      <div className="relative max-w-7xl mx-auto px-6 pt-28 pb-12 md:pt-28 md:pb-16 lg:pt-32 lg:pb-20 xl:pt-48 xl:pb-28">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-dark text-xs uppercase tracking-[0.2em] text-lime mb-6 animate-fade-in">
            {eyebrow}
          </div>
        )}
        <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-bold leading-[1.1] md:leading-[1.05] max-w-4xl animate-fade-up">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 sm:mt-6 text-base sm:text-lg xl:text-xl text-white/75 max-w-2xl animate-fade-up [animation-delay:120ms]">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
