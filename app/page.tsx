"use client";
import { useEffect, useState } from "react";

type PotteryItem = {
  id: number;
  name: string;
  price?: number;
};

export default function Home() {
  const [items, setItems] = useState<PotteryItem[]>([]);

  useEffect(() => {
    fetch("https://clay-work-project-backend-production.up.railway.app/pottery")

      .then((res) => res.json())
      .then((data: PotteryItem[]) => setItems(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <main className="min-h-screen bg-[#8D9158] text-[#F2E6C8] flex flex-col items-center p-10">
      <h1 className="text-4xl font-bold text-[#F2E3C7] mb-6">
        The Clay Route Project
      </h1>
      <h2 className="text-lg text-[#F2E3C7] mb-10">
        Ceramics created by Karen – Captured by Steven
      </h2>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-[#F2E3C7] text-[#3B2A1F] p-6 rounded-xl shadow-lg"
          >
            <h3 className="text-2xl font-semibold mb-2">{item.name}</h3>
            <p className="text-lg text-[#A44E32]">${item.price}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
