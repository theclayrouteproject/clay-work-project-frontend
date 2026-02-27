"use client";
import { useState } from "react";

export default function Gallery() {
  const images = [
    { id: 1, title: "Moss Glazed Mug", src: "https://picsum.photos/id/1011/800/600" },
    { id: 2, title: "Stoneware Bowl", src: "https://picsum.photos/id/1025/800/600" },
    { id: 3, title: "Porcelain Vase", src: "https://picsum.photos/id/1032/800/600" },
    { id: 4, title: "Textured Plate", src: "https://picsum.photos/id/1043/800/600" },
    { id: 5, title: "Satin Glaze Cup", src: "https://picsum.photos/id/1060/800/600" },
    { id: 6, title: "Studio Jar", src: "https://picsum.photos/id/1067/800/600" },
  ];

  const [selected, setSelected] = useState<number | null>(null);

  return (
    <main className="min-h-screen bg-[#8D9158] text-[#F2E6C8] flex flex-col items-center pt-28 pb-20">
      <h1 className="text-5xl font-bold mb-10">Gallery</h1>

      <section className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 max-w-7xl w-full px-4">
        {images.map((img, index) => (
          <div
            key={img.id}
            className="relative group cursor-pointer overflow-hidden rounded-xl shadow-lg border border-[#A44E32]/40"
            onClick={() => setSelected(index)}
          >
            <img
              src={img.src}
              alt={img.title}
              className="w-full h-48 sm:h-60 md:h-72 object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-[#3B2A1F]/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
              <span className="text-[#F2E3C7] text-base sm:text-lg font-medium text-center px-2">
                {img.title}
              </span>
            </div>
          </div>
        ))}
      </section>

      {selected !== null && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelected(null)}
        >
          <div className="relative max-w-4xl w-[90%]">
            <img
              src={images[selected].src}
              alt={images[selected].title}
              className="rounded-lg w-full object-contain max-h-[80vh]"
            />
            <p className="text-center text-[#F2E3C7] text-xl mt-4">
              {images[selected].title}
            </p>
            <button
              className="absolute top-2 right-3 text-3xl text-[#F2E3C7]"
              onClick={() => setSelected(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
