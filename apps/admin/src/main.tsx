import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import Providers from "./components/providers.tsx";
import { ReactQueryDevtools } from "./../node_modules/@tanstack/react-query-devtools/src/index";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </Providers>
  </StrictMode>
);
