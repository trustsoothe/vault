import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import GlobalStyles from "@mui/material/GlobalStyles";
import { HEIGHT, WIDTH } from "../constants/ui";
import useIsPopup from "./hooks/useIsPopup";
import ThemeProvider from "./theme";
import InitializeVault from "./InitializeVault/InitializeVault";

export default function App() {
  const isPopup = useIsPopup();

  return (
    <ThemeProvider>
      <GlobalStyles
        styles={{
          body: {
            width: isPopup ? WIDTH : undefined,
            height: isPopup ? HEIGHT : undefined,
            margin: "0!important",
          },
        }}
      />
      <Box
        sx={{
          width: "100vw",
          maxWidth: isPopup ? WIDTH : undefined,
          height: "calc(100vh)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          maxHeight: isPopup ? HEIGHT : undefined,
        }}
      >
        <Paper
          sx={{
            height: HEIGHT,
            width: WIDTH,
            paddingBottom: "20px",
            boxSizing: "border-box",
            position: "relative",
            display: "flex",
          }}
          elevation={2}
        >
          <InitializeVault />
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
