"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { name: "Ceramics 101", path: "/ceramics101" },
    { name: "Clays", path: "/clays" },
    { name: "Glazes", path: "/glazes" },
    { name: "Market", path: "/market" },
    { name: "Resources", path: "/resources" },
    { name: "Gallery", path: "/gallery" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full bg-[#556B2F]/95 backdrop-blur-md text-[#F2E3C7] z-50">
      <div className="max-w-7xl mx-auto flex flex-nowrap justify-between items-center px-4 pt-3 pb-3 gap-3">
        <Link href="/" onClick={() => setOpen(false)}>
          <h1 className="text-xl md:text-2xl xl:text-3xl font-semibold tracking-wide whitespace-nowrap leading-none">
            The Clay Route Project
          </h1>
        </Link>

        {/* hamburger toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="xl:hidden px-5 py-3 rounded-xl border border-transparent outline-none focus:outline-none focus:ring-0 text-3xl leading-none"
        >
          {open ? "×" : "☰"}
        </button>

        {/* Desktop menu */}
        <ul className="hidden xl:flex xl:flex-row xl:gap-6 text-xl">
          {links.map((link) => (
            <li key={link.path}>
              <Link
                href={link.path}
                className={`block pb-1 border-b-2 transition-all duration-300 ${
                  pathname === link.path
                    ? "border-[#F2E6C8] text-[#F2E6C8]"
                    : "border-transparent hover:border-[#F2E6C8]"
                }`}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile dropdown menu */}
      {open && (
        <div className="xl:hidden bg-[#556B2F]/98 border-t border-[#F2E6C8]/20">
          <ul className="flex flex-col py-2 px-4 space-y-1 text-xl">
            {links.map((link) => (
              <li key={link.path}>
                <Link
                  href={link.path}
                  className={`block py-2 px-3 rounded-lg transition-all duration-300 ${
                    pathname === link.path
                      ? "bg-[#F2E6C8]/20 text-[#F2E6C8] font-semibold"
                      : "hover:bg-[#F2E6C8]/10"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
