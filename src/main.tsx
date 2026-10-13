import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App, ErrorBoundary } from "./app/App";
import "./styles/index.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
