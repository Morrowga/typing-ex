import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import ThemeToggle from "./ThemeToggle";
import { THEME_KEY, THEME_SCRIPT } from "@/lib/theme";

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});
afterEach(cleanup);

describe("ThemeToggle", () => {
  it("switches the theme on <html>, remembers it, and flips the label", () => {
    document.documentElement.dataset.theme = "dark";
    render(<ThemeToggle />);
    fireEvent.click(screen.getByLabelText("Switch to light theme"));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(THEME_KEY)).toBe("light");
    fireEvent.click(screen.getByLabelText("Switch to dark theme"));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
  });

  it("starts from the theme already set on <html>", () => {
    document.documentElement.dataset.theme = "light";
    render(<ThemeToggle />);
    expect(screen.getByLabelText("Switch to dark theme")).toBeTruthy();
  });

  it("releases focus after a click so Space keeps typing", () => {
    document.documentElement.dataset.theme = "dark";
    render(<ThemeToggle />);
    const btn = screen.getByLabelText("Switch to light theme");
    btn.focus();
    fireEvent.click(btn);
    expect(document.activeElement).not.toBe(btn);
  });
});

describe("startup script", () => {
  const run = () => new Function(THEME_SCRIPT)();

  it("uses the saved choice", () => {
    localStorage.setItem(THEME_KEY, "light");
    run();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("falls back to the system preference, then to dark", () => {
    const real = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes("light") })) as typeof window.matchMedia;
    run();
    expect(document.documentElement.dataset.theme).toBe("light");
    window.matchMedia = real;
    delete document.documentElement.dataset.theme;
    run();
    expect(document.documentElement.dataset.theme).toBe("dark"); // jsdom has no matchMedia
  });

  it("ignores a garbage saved value", () => {
    localStorage.setItem(THEME_KEY, "purple");
    run();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
