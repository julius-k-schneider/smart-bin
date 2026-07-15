import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider, createTheme } from "@mantine/core";
import "@mantine/core/styles.css";
import "leaflet/dist/leaflet.css";
import App from "./app/App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider theme={createTheme({
      primaryColor: "forest",
      defaultRadius: "md",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      headings: { fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontWeight: "700" },
      colors: {
        forest: ["#effaf3", "#daf2e2", "#b8e4c8", "#8fd3aa", "#62bd89", "#3aa56b", "#258a56", "#1c6e45", "#175838", "#103d28"],
      },
      components: {
        Card: { defaultProps: { radius: "lg", withBorder: true } },
        Button: { defaultProps: { radius: "md" } },
      },
    })} defaultColorScheme="light">
      <App />
    </MantineProvider>
  </React.StrictMode>,
);
