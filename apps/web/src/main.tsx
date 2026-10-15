import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/700.css";
import "@fontsource/source-sans-3/400.css";
import "@fontsource/source-sans-3/600.css";
import "@fontsource/source-sans-3/700.css";
import { App } from "./App";
import "./index.css";
const rootElement = document.getElementById("root");
if (!rootElement) {
    throw new Error("Root element #root not found");
}
createRoot(rootElement).render(<StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>);
