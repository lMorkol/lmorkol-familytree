"use client";

import { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";

interface AutocompleteInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  suggestions: string[];
  placeholder?: string;
}

export default function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
}: AutocompleteInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = suggestions.filter((s) =>
    s.toLowerCase().includes(inputValue.toLowerCase())
  );

  useEffect(() => {
    setHighlightIndex(-1);
  }, [inputValue]);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, []);

  const toggleItem = (e: React.SyntheticEvent, item: string) => {
    e.stopPropagation();
    if (value.includes(item)) {
      onChange(value.filter((v) => v !== item));
    } else {
      onChange([...value, item]);
    }
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowDropdown(false);
      inputRef.current?.blur();
      return;
    }
    if (!showDropdown || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i < filtered.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i > 0 ? i - 1 : filtered.length - 1));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      toggleItem(e, filtered[highlightIndex]);
    }
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown((s) => !s);
    if (!showDropdown) {
      inputRef.current?.focus();
    }
  };

  const selectedCount = value.length;

  return (
    <div ref={containerRef} className="relative">
      <div
        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus-within:border-caramel focus-within:ring-1 focus-within:ring-caramel transition-colors cursor-text min-h-[38px] flex items-center"
        onClick={() => inputRef.current?.focus()}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleInputKeyDown}
          placeholder={selectedCount > 0 ? `Выбрано: ${selectedCount}` : placeholder}
          className="flex-1 min-w-[80px] outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <button
        type="button"
        onClick={toggleDropdown}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
      >
        <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
      </button>
      {showDropdown && (
        <div
          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-400">Нет вариантов</div>
          ) : (
            filtered.map((item, idx) => {
              const checked = value.includes(item);
              return (
                <div
                  key={item}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => toggleItem(e, item)}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors cursor-pointer select-none ${
                    idx === highlightIndex
                      ? "bg-caramel/10 text-caramel"
                      : checked
                        ? "bg-caramel/5 text-caramel"
                        : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
                      checked
                        ? "bg-caramel border-caramel"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {checked && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {item}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
