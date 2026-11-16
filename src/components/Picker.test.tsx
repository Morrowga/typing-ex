import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import Picker from "./Picker";
import type { Lesson } from "@/lib/types";

const STACKS = ["Git", "JS / TS", "Kotlin", "Linux", "PHP", "Python", "SQL", "Swift"];
const lessons: Lesson[] = STACKS.map((category) => ({
  id: `${category}-1`, category, topic: "t", level: 1, tags: [], chunks: [{ code: "x", explain: "y" }],
}));

beforeAll(() => {
  // jsdom has no matchMedia; the animated heading asks for it
  window.matchMedia = ((q: string) => ({
    matches: false, media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })) as typeof window.matchMedia;
});
afterEach(cleanup);

const setup = () => {
  const onStart = vi.fn();
  render(<Picker lessons={lessons} stacks={STACKS} onStart={onStart} />);
  return { onStart };
};
const chip = (name: string) => screen.getByRole("button", { name: new RegExp(`^${name.replace("/", "\\/")}$`) });
const pressed = (name: string) => chip(name).getAttribute("aria-pressed") === "true";
const randomBox = () => screen.getByLabelText("Random order") as HTMLInputElement;
const moreBtn = () => screen.getByRole("button", { name: /more/i });

describe("Picker stacks", () => {
  it("shows 4 stack chips and a '+4 more' button; the rest are in the popup", () => {
    setup();
    for (const s of ["Python", "JS / TS", "SQL", "Linux"]) expect(chip(s)).toBeTruthy();
    for (const s of ["Git", "PHP", "Swift", "Kotlin"]) expect(screen.queryByRole("button", { name: s })).toBeNull();
    expect(moreBtn().textContent).toBe("+4 more");
  });

  it("the more button opens a popup with every stack", () => {
    setup();
    fireEvent.click(moreBtn());
    const dialog = screen.getByRole("dialog");
    for (const s of STACKS) expect(within(dialog).getByRole("button", { name: s })).toBeTruthy();
  });

  it("picking a stack in the popup is reflected on the more button and in Start", () => {
    const { onStart } = setup();
    fireEvent.click(chip("Python"));
    fireEvent.click(moreBtn());
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Swift" }));
    fireEvent.click(screen.getByText("Done"));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(moreBtn().textContent).toBe("+4 more · 1 selected");
    fireEvent.click(screen.getByText("Start"));
    expect(onStart).toHaveBeenCalledWith(["Python", "Swift"], 1, false); // in the order picked
  });

  it("the popup closes with Esc, the X and a click outside", () => {
    const { } = setup();
    for (const close of [
      () => fireEvent.keyDown(document, { key: "Escape" }),
      () => fireEvent.click(screen.getByLabelText("Close")),
      () => fireEvent.click(document.querySelector(".modal-backdrop")!),
    ]) {
      fireEvent.click(moreBtn());
      expect(screen.getByRole("dialog")).toBeTruthy();
      close();
      expect(screen.queryByRole("dialog")).toBeNull();
    }
  });
});

describe("Random order", () => {
  it("selects every stack, including the hidden ones", () => {
    setup();
    fireEvent.click(randomBox());
    for (const s of ["Python", "JS / TS", "SQL", "Linux"]) expect(pressed(s)).toBe(true);
    expect(moreBtn().textContent).toBe("+4 more · 4 selected");
  });

  it("unchecking it puts every chip back to its default look", () => {
    setup();
    fireEvent.click(randomBox());
    fireEvent.click(randomBox());
    for (const s of ["Python", "JS / TS", "SQL", "Linux"]) expect(pressed(s)).toBe(false);
    expect(moreBtn().textContent).toBe("+4 more"); // no 'selected' either
    expect(randomBox().checked).toBe(false);
    expect((screen.getByText("Start") as HTMLButtonElement).disabled).toBe(true);
  });

  it("unchecking restores the selection you had before checking it", () => {
    setup();
    fireEvent.click(chip("SQL"));
    fireEvent.click(randomBox());
    fireEvent.click(chip("Linux")); // change things while random is on
    fireEvent.click(randomBox());
    expect(pressed("SQL")).toBe(true);
    expect(pressed("Linux")).toBe(false);
    expect(pressed("Python")).toBe(false);
  });
});
