import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders with variant primary and has the correct class", () => {
    render(<Button variant="primary">Click me</Button>);
    const btn = screen.getByRole("button", { name: /click me/i });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain("btn-primary");
  });

  it("renders with variant ghost and has the correct class", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole("button", { name: /ghost/i });
    expect(btn.className).toContain("btn-ghost");
  });

  it("calls the click handler when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("loading state: button is disabled and spinner is visible", () => {
    render(<Button loading>Loading...</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    // The spinner SVG is rendered (aria-hidden)
    const svg = btn.querySelector("svg.animate-spin");
    expect(svg).not.toBeNull();
  });

  it("disabled state: button is disabled", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("does not call handler when disabled", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>,
    );
    await user.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
