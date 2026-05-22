import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventTagChips } from "@/components/festevent/event-card";

describe("EventTagChips", () => {
  it("renders all tags when 3 or fewer", () => {
    render(<EventTagChips tags={["rap", "live", "danse"]} />);
    expect(screen.getByText("#rap")).toBeInTheDocument();
    expect(screen.getByText("#live")).toBeInTheDocument();
    expect(screen.getByText("#danse")).toBeInTheDocument();
    expect(screen.queryByText(/^\+/)).toBeNull();
  });

  it("shows only first 3 tags and overflow count when more than 3", () => {
    render(<EventTagChips tags={["rap", "live", "danse", "freestyle", "groove"]} />);
    expect(screen.getByText("#rap")).toBeInTheDocument();
    expect(screen.getByText("#live")).toBeInTheDocument();
    expect(screen.getByText("#danse")).toBeInTheDocument();
    expect(screen.queryByText("#freestyle")).toBeNull();
    expect(screen.queryByText("#groove")).toBeNull();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("shows +1 overflow when exactly 4 tags", () => {
    render(<EventTagChips tags={["a", "b", "c", "d"]} />);
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("renders nothing extra when given empty tags", () => {
    const { container } = render(<EventTagChips tags={[]} />);
    const chips = container.querySelectorAll("span");
    expect(chips.length).toBe(0);
  });

  it("has accessible aria-label container", () => {
    render(<EventTagChips tags={["hip-hop"]} />);
    expect(screen.getByRole("group", { name: /tags/i })).toBeInTheDocument();
  });

  it("prefixes each tag with #", () => {
    render(<EventTagChips tags={["jazz"]} />);
    expect(screen.getByText("#jazz")).toBeInTheDocument();
  });
});
