import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";

describe("StatusBadge Component", () => {
  it("should render correct status text with underscores replaced", () => {
    render(<StatusBadge status="READY_FOR_APPEAL" />);
    expect(screen.getByText("READY FOR APPEAL")).toBeDefined();
  });

  it("should show pulsing animation if active status", () => {
    const { container } = render(<StatusBadge status="PARSING" />);
    expect(container.querySelector(".animate-ping")).not.toBeNull();
  });

  it("should not show pulsing animation for inactive status", () => {
    const { container } = render(<StatusBadge status="APPROVED" />);
    expect(container.querySelector(".animate-ping")).toBeNull();
  });
});
