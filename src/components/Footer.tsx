import { EVENT } from '../data/event';

export function Footer() {
  return (
    <footer className="relative bg-[#070f1a] text-ivory/60">
      <div className="mx-auto flex max-w-[84rem] flex-col gap-4 border-t border-ivory/10 px-5 py-10 text-xs sm:px-8 md:flex-row md:items-center md:justify-between">
        <p>
          <span className="font-display tracking-[0.2em] text-ivory/85">{EVENT.name}</span>
          <span className="mx-3 text-ivory/25">·</span>
          {EVENT.organizer.name}, {EVENT.organizer.chapter}, {EVENT.organizer.institute}
        </p>
        <p className="tracking-[0.2em] uppercase">Powered by TATA STRIVE</p>
      </div>
    </footer>
  );
}
