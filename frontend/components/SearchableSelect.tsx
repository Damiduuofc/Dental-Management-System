"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
  // Extra text that should match the search (e.g. email, phone)
  keywords?: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
}

export default function SearchableSelect({ options, value, onChange, placeholder, emptyText = "No results found" }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const q = query.toLowerCase().trim();
  const filtered = options.filter(
    (o) => !q || `${o.label} ${o.sublabel || ""} ${o.keywords || ""}`.toLowerCase().includes(q)
  );

  // Close when clicking anywhere outside the control
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const choose = (option: SearchableOption) => {
    onChange(option.value);
    setQuery("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      // Never submit the surrounding form from the search box
      e.preventDefault();
      if (isOpen && filtered[highlight]) choose(filtered[highlight]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          // While closed show the chosen option; while open show what the user is typing
          value={isOpen ? query : selected ? selected.label : ""}
          onFocus={() => {
            setIsOpen(true);
            setHighlight(0);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full p-3 pr-16 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
          {value && !isOpen && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-1 rounded-full hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              title="Clear selection"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} className={`transition ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Rendered in normal flow so a scrolling modal never clips the list */}
      {isOpen && (
        <div className="mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto modal-scroll">
          {filtered.length === 0 ? (
            <div className="p-3 text-slate-400 text-sm text-center">{emptyText}</div>
          ) : (
            filtered.map((option, idx) => (
              <button
                key={option.value}
                type="button"
                // mousedown fires before the input loses focus, so the pick is never lost
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(option);
                }}
                onMouseEnter={() => setHighlight(idx)}
                className={`w-full text-left p-3 text-sm border-b last:border-b-0 border-slate-100 cursor-pointer ${
                  idx === highlight ? "bg-blue-50 text-blue-800" : "text-slate-800 hover:bg-slate-50"
                } ${option.value === value ? "font-bold" : "font-medium"}`}
              >
                {option.label}
                {option.sublabel && <span className="text-slate-400 font-normal"> ({option.sublabel})</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
