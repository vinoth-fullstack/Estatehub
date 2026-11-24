"use client";

import { useState } from "react";
import type { PropertyImage } from "@/lib/types";

export function ImageGallery({ images, title }: { images: PropertyImage[]; title: string; }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="grid aspect-[16/9] place-items-center rounded-xl bg-gradient-to-br from-teal-50 to-slate-200 text-slate-400">
        <p className="text-sm">No photos have been added for this property yet.</p>
      </div>
    );
  }

  const active = images[activeIndex] ?? images[0];

  return (
    <>
      <div>
        <div className="group relative aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100">

          <img src={active.url} alt={`${title} - photo ${activeIndex + 1}`} className="h-full w-full object-cover" width={1280} height={720} onError={(event) => { event.currentTarget.style.display = "none"; }} />
          <button type="button" onClick={() => setFullScreen(true)} className="absolute bottom-3 right-3 rounded-lg bg-slate-950/75 px-3 py-2 text-xs font-semibold text-white opacity-90 transition hover:bg-slate-950" aria-label="Open full screen image gallery">View all photos <span className="ml-1">({images.length})</span></button>
          {images.length > 1 && <><button type="button" aria-label="Previous photo" onClick={() => setActiveIndex((activeIndex - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg shadow transition hover:bg-white">‹</button><button type="button" aria-label="Next photo" onClick={() => setActiveIndex((activeIndex + 1) % images.length)} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg shadow transition hover:bg-white">›</button></>}
        </div>
        {images.length > 1 && (
          <ul className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
            {images.map((image, index) => (
              <li key={image.id}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show photo ${index + 1}`}
                  aria-current={index === activeIndex}
                  className={`aspect-[4/3] w-full overflow-hidden rounded-lg border-2 ${index === activeIndex ? "border-teal-600" : "border-transparent opacity-70 hover:opacity-100"}`}
                >

                  <img src={image.url} alt="" loading="lazy" className="h-full w-full object-cover" width={160} height={120} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {fullScreen && <div role="dialog" aria-modal="true" aria-label={`${title} photo gallery`} className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/95 p-4" onClick={() => setFullScreen(false)}>
        <button type="button" autoFocus aria-label="Close gallery" onClick={() => setFullScreen(false)} className="absolute right-5 top-4 rounded-full px-3 py-2 text-2xl text-white hover:bg-white/10">×</button>
        <p className="absolute left-5 top-5 text-sm text-white/80">{activeIndex + 1} / {images.length} · {title}</p>
        {images.length > 1 && <button type="button" aria-label="Previous photo" onClick={(event) => { event.stopPropagation(); setActiveIndex((activeIndex - 1 + images.length) % images.length); }} className="absolute left-3 z-10 rounded-full bg-white/10 px-4 py-3 text-2xl text-white hover:bg-white/20 sm:left-8">‹</button>}
        <img src={active.url} alt={`${title} - photo ${activeIndex + 1}`} onClick={(event) => event.stopPropagation()} className="max-h-[85vh] max-w-[88vw] rounded-lg object-contain" />
        {images.length > 1 && <button type="button" aria-label="Next photo" onClick={(event) => { event.stopPropagation(); setActiveIndex((activeIndex + 1) % images.length); }} className="absolute right-3 z-10 rounded-full bg-white/10 px-4 py-3 text-2xl text-white hover:bg-white/20 sm:right-8">›</button>}
      </div>}
    </>
  );
}
