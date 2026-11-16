import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SessionView from "./SessionView";
import type { Lesson } from "@/lib/types";

afterEach(cleanup);

const mk = (id: string, code1: string, code2: string): Lesson => ({
  id, category: "Linux", topic: "t", level: 1, tags: ["x"],
  chunks: [{ code: code1, explain: `${id} first` }, { code: code2, explain: `${id} second` }],
});
const queue = [mk("a", "ls -la", "pwd"), mk("b", "cd /tmp", "cat f")];

const press = (key: string) => fireEvent.keyDown(document, { key });
const type = (text: string) => { for (const ch of text) press(ch); };
const setup = () => {
  const onExit = vi.fn();
  const onSectorStart = vi.fn();
  const onStart = vi.fn();
  const utils = render(
    <SessionView
      queue={queue}
      onSectorStart={onSectorStart}
      onExit={onExit}
      stacks={["Linux"]}
      level={1}
      random={false}
      allStacks={["Linux"]}
      lessons={queue}
      onStart={onStart}
    />,
  );
  return { ...utils, onExit, onSectorStart, onStart };
};
const lines = (c: HTMLElement, sector: number) =>
  c.querySelectorAll(`#sector-${sector} .line`);

describe("SessionView", () => {
  it("shows a lesson's explanation only once its line is reached", () => {
    const { container } = setup();
    expect(lines(container, 0)[0].classList.contains("reached")).toBe(true);
    expect(lines(container, 0)[1].classList.contains("reached")).toBe(false);
    type("ls -la");
    press("Enter");
    expect(lines(container, 0)[1].classList.contains("reached")).toBe(true);
  });

  it("does not finish a sector by itself; Enter shows its info under the card, Enter again opens the next sector", () => {
    const { container, onSectorStart } = setup();
    type("ls -la");
    press("Enter");
    type("pwd");
    expect(container.querySelector(".info")).toBeNull(); // all typed, still waiting for the user
    expect(screen.getByText(/to finish this sector/i)).toBeTruthy();

    press("Enter");
    expect(container.querySelector("#sector-0 .info")).not.toBeNull();
    expect(container.querySelector("#sector-1")).toBeNull(); // next sector not opened yet

    press("Enter");
    expect(container.querySelector("#sector-1")).not.toBeNull();
    expect(container.querySelector("#sector-0")).not.toBeNull(); // first sector stays on the page
    expect(container.querySelector("#sector-0 .info")).not.toBeNull(); // with its info
    expect(onSectorStart).toHaveBeenCalledWith(queue[1]);
  });

  it("keeps typing in the newest sector only", () => {
    const { container } = setup();
    type("ls -la"); press("Enter"); type("pwd"); press("Enter"); press("Enter");
    type("cd /tmp");
    const done = (n: number) => container.querySelectorAll(`#sector-${n} .ch.done`).length;
    expect(done(1)).toBeGreaterThan(0);
    expect(done(0)).toBe("ls -la\npwd".length); // sector 0 unchanged
  });

  it("Stop & report opens a dialog over the session without ending it", () => {
    const { container } = setup();
    type("ls -la"); press("Enter"); type("pwd"); press("Enter"); press("Enter"); // sector 2 opened, nothing typed
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getAllByText(/stop & report/i)[0]);
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toMatch(/report so far/i);
    expect(dialog.textContent).toMatch(/1 sector done/i);
    expect(container.querySelector("#sector-1")).not.toBeNull(); // session still there behind it
  });

  it("closing the dialog (button, X, Esc or backdrop) returns to typing where you left off", () => {
    const { container } = setup();
    type("ls"); // half of the first line
    const open = () => fireEvent.click(screen.getByText(/stop & report/i));

    open();
    fireEvent.click(screen.getByText("Back to typing"));
    expect(screen.queryByRole("dialog")).toBeNull();

    open();
    fireEvent.click(screen.getByLabelText("Close report"));
    expect(screen.queryByRole("dialog")).toBeNull();

    open();
    press("Escape");
    expect(screen.queryByRole("dialog")).toBeNull();

    open();
    fireEvent.click(container.querySelector(".modal-backdrop")!);
    expect(screen.queryByRole("dialog")).toBeNull();

    type(" -la"); // typing continues from "ls"
    expect(container.querySelectorAll("#sector-0 .ch.done").length).toBe("ls -la".length);
  });

  it("ignores typing and Enter while the dialog is open", () => {
    const { container } = setup();
    type("ls -la"); press("Enter"); type("pwd"); // all typed, waiting for Enter
    fireEvent.click(screen.getByText(/stop & report/i));
    press("Enter"); // must not confirm the sector
    type("zzz");
    expect(container.querySelector(".info")).toBeNull();
    press("Escape");
    press("Enter"); // now it does
    expect(container.querySelector("#sector-0 .info")).not.toBeNull();
  });

  it("includes a half-typed sector as stopped here", () => {
    setup();
    type("ls");
    press("Escape"); // Esc opens the report when something was typed
    expect(screen.getByRole("dialog").textContent).toMatch(/stopped here/i);
  });

  it("Esc goes back to the menu when nothing was typed", () => {
    const { onExit } = setup();
    press("Escape");
    expect(onExit).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("confirming the last sector and pressing Enter opens a completed report", () => {
    setup();
    type("ls -la"); press("Enter"); type("pwd"); press("Enter"); press("Enter");
    type("cd /tmp"); press("Enter"); type("cat f"); press("Enter"); // last sector confirmed
    expect(screen.queryByRole("dialog")).toBeNull(); // info shown first
    press("Enter");
    expect(screen.getByRole("dialog").textContent).toMatch(/run complete/i);
    expect(screen.queryByText("Back to typing")).toBeNull(); // nothing left to go back to
  });

  it("the dialog's New set button starts a new run", () => {
    const { onStart } = setup();
    type("ls");
    press("Escape");
    fireEvent.click(screen.getByText("New set"));
    expect(onStart).toHaveBeenCalledWith(["Linux"], 1, false);
  });
});
