import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import api from "../services/api";

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

function TestConsumer() {
  const { user, loading, login, logout } = useAuth();
  if (loading) return <div>Loading auth...</div>;
  return (
    <div>
      <div data-testid="user-name">{user ? user.name : "Anonymous"}</div>
      <button onClick={() => login("test@example.com", "password123")}>Log In</button>
      <button onClick={logout}>Log Out</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("initializes without user when localStorage is empty", async () => {
    api.get.mockResolvedValue({ data: { data: null } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-name").textContent).toBe("Anonymous");
    });
  });

  it("verifies and loads user if token exists in localStorage", async () => {
    const mockUser = { id: "1", name: "Dr. Alice", email: "alice@demo.com", role: "admin" };
    localStorage.setItem("claimassist_token", "fake-token");
    api.get.mockResolvedValue({ data: { data: mockUser } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-name").textContent).toBe("Dr. Alice");
    });
  });

  it("stores token and updates state on login", async () => {
    api.get.mockResolvedValue({ data: { data: null } });
    const mockUser = { id: "2", name: "Reviewer Bob", email: "bob@demo.com", role: "reviewer" };
    api.post.mockResolvedValue({
      data: {
        data: {
          token: "new-jwt-token",
          user: mockUser,
        },
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-name").textContent).toBe("Anonymous");
    });

    await act(async () => {
      screen.getByText("Log In").click();
    });

    expect(localStorage.getItem("claimassist_token")).toBe("new-jwt-token");
    expect(screen.getByTestId("user-name").textContent).toBe("Reviewer Bob");
  });

  it("clears storage and user state on logout", async () => {
    const mockUser = { id: "1", name: "Dr. Alice" };
    localStorage.setItem("claimassist_token", "test-token");
    localStorage.setItem("claimassist_user", JSON.stringify(mockUser));
    api.get.mockResolvedValue({ data: { data: mockUser } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-name").textContent).toBe("Dr. Alice");
    });

    await act(async () => {
      screen.getByText("Log Out").click();
    });

    expect(localStorage.getItem("claimassist_token")).toBeNull();
    expect(screen.getByTestId("user-name").textContent).toBe("Anonymous");
  });
});
