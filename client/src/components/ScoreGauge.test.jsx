import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import ScoreGauge from "./ScoreGauge";

describe("ScoreGauge", () => {
  it("renders correctly with score and classification", () => {
    render(<ScoreGauge score={85} classification="Strong" />);
    const meter = screen.getByRole("meter");
    expect(meter).toBeDefined();
    expect(meter.getAttribute("aria-valuenow")).toBe("85");
    expect(screen.getByText("Strong")).toBeDefined();
  });

  it("handles edge scores 0 and 100", () => {
    const { unmount } = render(<ScoreGauge score={0} classification="Insufficient Evidence" />);
    expect(screen.getByRole("meter").getAttribute("aria-valuenow")).toBe("0");
    unmount();

    render(<ScoreGauge score={100} classification="Strong" />);
    expect(screen.getByRole("meter").getAttribute("aria-valuenow")).toBe("100");
  });
});
