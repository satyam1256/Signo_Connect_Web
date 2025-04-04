import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import "./index.css";

// Delay hydration to prevent the initial flash
document.addEventListener('DOMContentLoaded', () => {
  // Wait a short time to ensure the DOM is fully ready
  setTimeout(() => {
    const rootElement = document.getElementById("root");
    if (rootElement) {
      const root = createRoot(rootElement);
      root.render(
        <StrictMode>
          <App />
        </StrictMode>
      );
      console.log("React app successfully mounted");
    }
  }, 0);
});
