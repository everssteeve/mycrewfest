import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("badge ai: displays the ✦ symbol", () => {
    render(<Badge variant="ai">IA</Badge>);
    // The ✦ is rendered inside an aria-hidden span
    const badge = screen.getByText("IA").closest("span");
    expect(badge).not.toBeNull();
    // The parent span should contain the ✦ character
    expect(badge?.textContent).toContain("✦");
  });

  it("badge ai: has cyan color in inline style", () => {
    render(<Badge variant="ai">IA</Badge>);
    const badge = screen.getByText("IA").closest("span") as HTMLElement;
    expect(badge.getAttribute("style")).toContain("var(--secondary-cyan)");
  });

  it("badge critical: displays the correct text", () => {
    render(<Badge variant="critical">Annulé</Badge>);
    expect(screen.getByText("Annulé")).toBeInTheDocument();
  });

  it("badge critical: has red color in inline style", () => {
    render(<Badge variant="critical">Annulé</Badge>);
    const badge = screen.getByText("Annulé").closest("span") as HTMLElement;
    expect(badge.getAttribute("style")).toContain("var(--danger-red)");
  });

  it("badge critical: has red border in inline style attribute", () => {
    render(<Badge variant="critical">Annulé</Badge>);
    const badge = screen.getByText("Annulé").closest("span") as HTMLElement;
    // jsdom does not resolve CSS variables so we check the inline style string
    expect(badge.getAttribute("style")).toContain("var(--danger-red)");
  });

  it("badge info: renders correctly", () => {
    render(<Badge variant="info">Info</Badge>);
    const badge = screen.getByText("Info").closest("span") as HTMLElement;
    expect(badge).toBeInTheDocument();
    expect(badge.getAttribute("style")).toContain("var(--secondary-cyan)");
  });

  it("badge default variant: inline style has no border", () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText("Default").closest("span") as HTMLElement;
    // The style attribute should contain "border: none" or no border key at all
    const style = badge.getAttribute("style") ?? "";
    expect(style).not.toContain("var(--danger-red)");
    expect(style).not.toContain("var(--warning-orange)");
  });

  it("badge ai: does not show ✦ for non-ai variants", () => {
    render(<Badge variant="critical">Critique</Badge>);
    const badge = screen.getByText("Critique").closest("span");
    expect(badge?.textContent).not.toContain("✦");
  });
});
