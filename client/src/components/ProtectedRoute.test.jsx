import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import * as AuthContextModule from "../context/AuthContext";

describe("ProtectedRoute", () => {
  it("renders null while authentication is loading", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: null,
      loading: true,
    });

    const { container } = render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Secret Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText("Secret Protected Content")).toBeNull();
  });

  it("redirects unauthenticated users to /login", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: null,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Secret Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Login Page")).toBeDefined();
    expect(screen.queryByText("Secret Protected Content")).toBeNull();
  });

  it("renders children when user is authenticated", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: { id: "1", name: "Dr. Demo", role: "admin" },
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Secret Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Secret Protected Content")).toBeDefined();
  });
});
