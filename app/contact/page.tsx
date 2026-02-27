"use client";
import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [fallbackDestination, setFallbackDestination] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setStatus("sending...");
    setFallbackDestination("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as {
        error?: string;
        fallbackToMailto?: boolean;
        to?: string;
      };

      if (!response.ok) {
        if (data.fallbackToMailto && data.to) {
          setFallbackDestination(data.to);
          setStatus(`Server email is not configured yet. Please configure SMTP to send directly. Destination: ${data.to}`);
          return;
        }

        setStatus(data.error ?? "something went wrong ❌");
        return;
      }

      setStatus("message sent ✅");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("something went wrong ❌");
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyDestination = async () => {
    if (!fallbackDestination) return;

    try {
      await navigator.clipboard.writeText(fallbackDestination);
      setStatus(`Copied destination email: ${fallbackDestination} ✅`);
    } catch {
      setStatus("Could not copy email automatically. Please copy it manually from the message.");
    }
  };

  return (
    <main className="min-h-screen bg-[#8D9158] text-[#F2E6C8] flex flex-col items-center pt-28 pb-20 px-4">
      <h1 className="text-5xl font-bold mb-10">Contact</h1>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-[#3B2A1F]/80 rounded-xl shadow-lg border border-[#A44E32]/40 p-6 flex flex-col gap-6"
      >
        <input
          type="text"
          name="name"
          placeholder="Your name"
          value={form.name}
          onChange={handleChange}
          required
          className="p-3 rounded-md border border-[#F2E6C8]/60 focus:border-[#F2E6C8] focus:outline-none"
        />
        <input
          type="email"
          name="email"
          placeholder="Your email"
          value={form.email}
          onChange={handleChange}
          required
          className="p-3 rounded-md border border-[#F2E6C8]/60 focus:border-[#F2E6C8] focus:outline-none"
        />
        <textarea
          name="message"
          placeholder="Type your message..."
          rows={5}
          value={form.message}
          onChange={handleChange}
          required
          className="p-3 rounded-md border border-[#F2E6C8]/60 focus:border-[#F2E6C8] focus:outline-none"
        />
        <button
          type="submit"
          disabled={isSending}
          className="bg-[#A44E32] hover:bg-[#4A2F1C] hover:text-[#F2E3C7] text-[#F2E3C7] font-semibold py-2 rounded-md transition-all"
        >
          {isSending ? "Sending..." : "Send Message"}
        </button>
        {status && <p className="text-center mt-2 text-sm">{status}</p>}
        {fallbackDestination ? (
          <button
            type="button"
            onClick={() => void handleCopyDestination()}
            className="border border-[#F2E6C8]/35 bg-[#3B2A1F] text-[#F2E6C8] py-2 px-3 rounded-md"
          >
            Copy destination email
          </button>
        ) : null}
      </form>
    </main>
  );
}
