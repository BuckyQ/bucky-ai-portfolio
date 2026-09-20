"use client";

import { Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import AskBucky from "@/components/AskBucky";

interface AskBuckyLauncherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const hintStorageKey = "ask-bucky-launcher-hint-seen";

export default function AskBuckyLauncher({
  open,
  onOpenChange,
}: AskBuckyLauncherProps) {
  const [showHint, setShowHint] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let showTimer: number | undefined;
    let hideTimer: number | undefined;

    try {
      if (!window.localStorage.getItem(hintStorageKey)) {
        window.localStorage.setItem(hintStorageKey, "true");
        showTimer = window.setTimeout(() => setShowHint(true), 0);
        hideTimer = window.setTimeout(() => setShowHint(false), 4800);
      }
    } catch {
      // The assistant remains discoverable through its persistent button.
    }

    return () => {
      if (showTimer !== undefined) window.clearTimeout(showTimer);
      if (hideTimer !== undefined) window.clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const focusToRestore =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    const backgroundRegions = [".site-header", "#main-content", "#contact"]
      .map((selector) => document.querySelector<HTMLElement>(selector))
      .filter((region): region is HTMLElement => region !== null);
    const previousInertStates = backgroundRegions.map((region) => region.inert);

    document.body.style.overflow = "hidden";
    backgroundRegions.forEach((region) => {
      region.inert = true;
    });
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => !element.hasAttribute("hidden"));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      backgroundRegions.forEach((region, index) => {
        region.inert = previousInertStates[index] ?? false;
      });
      window.requestAnimationFrame(() => {
        if (focusToRestore?.isConnected) focusToRestore.focus();
      });
    };
  }, [onOpenChange, open]);

  const openAssistant = () => {
    setShowHint(false);
    onOpenChange(true);
  };

  return (
    <>
      <div className="ask-bucky-launcher">
        {showHint && !open ? (
          <p className="ask-bucky-launcher-hint" role="status">
            You can ask AI about Bucky
          </p>
        ) : null}
        <button
          aria-label="Open Ask Bucky AI assistant"
          aria-controls="ask-bucky-drawer"
          aria-expanded={open}
          className="ask-bucky-launcher-button"
          disabled={open}
          onClick={openAssistant}
          tabIndex={open ? -1 : 0}
          type="button"
        >
          <Sparkles aria-hidden="true" />
          <span>Ask Bucky</span>
        </button>
      </div>

      <div className="ask-bucky-layer" hidden={!open}>
        <button
          aria-label="Dismiss Ask Bucky AI"
          className="ask-bucky-backdrop"
          onClick={() => onOpenChange(false)}
          tabIndex={-1}
          type="button"
        />
        <aside
          aria-labelledby="ask-bucky-title"
          aria-modal="true"
          className="ask-bucky-drawer"
          id="ask-bucky-drawer"
          ref={panelRef}
          role="dialog"
        >
          <div className="ask-bucky-drawer-bar">
            <span>Portfolio intelligence / 01</span>
            <button
              aria-label="Close Ask Bucky AI"
              onClick={() => onOpenChange(false)}
              ref={closeButtonRef}
              type="button"
            >
              <span>Close</span>
              <X aria-hidden="true" />
            </button>
          </div>
          <AskBucky />
        </aside>
      </div>
    </>
  );
}
