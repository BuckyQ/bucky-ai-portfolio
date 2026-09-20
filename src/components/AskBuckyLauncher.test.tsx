// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AskBuckyLauncher from "./AskBuckyLauncher";

vi.mock("@/components/AskBucky", () => ({
  default: function MockAskBucky() {
    return (
      <section aria-label="Ask Bucky content">
        <label htmlFor="mock-question">Question about Bucky</label>
        <input id="mock-question" />
        <button type="button">Send</button>
      </section>
    );
  },
}));

function LauncherHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="site-header">
        <button onClick={() => setOpen(true)} type="button">Hero Ask Bucky</button>
      </header>
      <main id="main-content">
        <a href="#work">Background page link</a>
      </main>
      <footer id="contact">Contact</footer>
      <AskBuckyLauncher open={open} onOpenChange={setOpen} />
    </>
  );
}

beforeEach(() => {
  window.localStorage.setItem("ask-bucky-launcher-hint-seen", "true");
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("AskBuckyLauncher accessibility", () => {
  it("moves focus into the drawer, closes on Escape, and restores the opener", async () => {
    const user = userEvent.setup();
    render(<LauncherHarness />);
    const opener = screen.getByRole("button", { name: "Hero Ask Bucky" });

    await user.click(opener);

    const closeButton = screen.getByRole("button", { name: "Close Ask Bucky AI" });
    await waitFor(() => expect(document.activeElement).toBe(closeButton));
    expect(document.querySelector<HTMLElement>(".site-header")?.inert).toBe(true);
    expect(document.querySelector<HTMLElement>("#main-content")?.inert).toBe(true);
    expect(document.querySelector<HTMLElement>("#contact")?.inert).toBe(true);

    await user.keyboard("{Escape}");

    await waitFor(() => expect(document.activeElement).toBe(opener));
    expect(document.querySelector<HTMLElement>(".site-header")?.inert).toBe(false);
    expect(document.querySelector<HTMLElement>("#main-content")?.inert).toBe(false);
    expect(document.querySelector<HTMLElement>("#contact")?.inert).toBe(false);
  });

  it("keeps Tab focus inside the open drawer", async () => {
    const user = userEvent.setup();
    render(<LauncherHarness />);

    await user.click(screen.getByRole("button", { name: "Hero Ask Bucky" }));
    const closeButton = screen.getByRole("button", { name: "Close Ask Bucky AI" });
    const sendButton = screen.getByRole("button", { name: "Send" });
    await waitFor(() => expect(document.activeElement).toBe(closeButton));

    await user.tab({ shift: true });
    expect(document.activeElement).toBe(sendButton);

    await user.tab();
    expect(document.activeElement).toBe(closeButton);
  });

  it("exposes a labelled persistent launcher", () => {
    render(<LauncherHarness />);

    const launcher = screen.getByRole("button", {
      name: "Open Ask Bucky AI assistant",
    });
    expect(launcher.getAttribute("aria-controls")).toBe("ask-bucky-drawer");
    expect(launcher.getAttribute("aria-expanded")).toBe("false");
  });
});
