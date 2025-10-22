import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import HomePage from "@/app/page";

describe("HomePage Accessibility", () => {
  it("has proper heading hierarchy", () => {
    const { container } = render(<HomePage />);
    
    const h1 = container.querySelector("h1");
    expect(h1).toBeInTheDocument();
    expect(h1?.textContent).toContain("Build with");
  });

  it("has accessible navigation", () => {
    const { container } = render(<HomePage />);
    
    const header = container.querySelector("header");
    expect(header).toBeInTheDocument();
  });

  it("has call-to-action button", () => {
    const { getByText } = render(<HomePage />);
    
    const cta = getByText(/get started/i);
    expect(cta).toBeInTheDocument();
  });
});

