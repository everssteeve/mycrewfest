import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Chip } from "@/components/ui/chip";

describe("Chip", () => {
  it("renders with state inactive: has transparent background", () => {
    render(<Chip state="inactive">Filtre</Chip>);
    const btn = screen.getByRole("button", { name: /filtre/i });
    expect(btn).toBeInTheDocument();
    // inactive state adds bg-transparent class
    expect(btn.className).toContain("bg-transparent");
  });

  it("renders with state active: has solid accent background class", () => {
    render(
      <Chip state="active" color="neon">
        Active
      </Chip>,
    );
    const btn = screen.getByRole("button", { name: /active/i });
    // active state uses bg-[var(--primary-neon)]
    expect(btn.className).toContain("bg-[var(--primary-neon)]");
  });

  it("renders with state soft: has soft background class", () => {
    render(
      <Chip state="soft" color="neon">
        Soft
      </Chip>,
    );
    const btn = screen.getByRole("button", { name: /soft/i });
    expect(btn.className).toContain("bg-[var(--neon-soft)]");
  });

  it("calls click handler when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Chip onClick={handleClick}>Tag</Chip>);
    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders children text", () => {
    render(<Chip>Mon Chip</Chip>);
    expect(screen.getByText("Mon Chip")).toBeInTheDocument();
  });

  it("applies cyan color classes when color=cyan and state=active", () => {
    render(
      <Chip color="cyan" state="active">
        Cyan
      </Chip>,
    );
    const btn = screen.getByRole("button", { name: /cyan/i });
    expect(btn.className).toContain("bg-[var(--secondary-cyan)]");
  });
});
