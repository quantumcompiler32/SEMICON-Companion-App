import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { App } from "../src/app/App";
import { useNavigator } from "../src/stores/useNavigator";
import { initialData } from "../src/data/conference";
vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}));
afterEach(cleanup);
describe("application UI", () => {
  it("shows an unknown group and changes breakouts without showing another group", async () => {
    const unknown = initialData();
    unknown.settings.group = null;
    useNavigator.setState({
      data: unknown,
      ready: true,
      hydrate: vi.fn(async () => {}),
    });
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /Your day, in focus/ }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Group B" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Schedule" })[0]);
    expect(
      await screen.findByText(
        "Breakout #2 · AT3: A National Community College Model for Semiconductor Technician Workforce Development",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Breakout #1 · Awareness to Action: Building the Next Generation Semiconductor Workforce",
      ),
    ).not.toBeInTheDocument();
  });
  it("reports offline state without preventing core access", () => {
    useNavigator.setState({
      data: initialData(),
      ready: true,
      hydrate: vi.fn(async () => {}),
    });
    const original = navigator.onLine;
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });
    render(<App />);
    expect(screen.getByText("Offline")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Navigate to Next Stop" }),
    ).toBeEnabled();
    Object.defineProperty(navigator, "onLine", {
      value: original,
      configurable: true,
    });
  });
});
