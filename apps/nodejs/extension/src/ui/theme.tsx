import { createTheme, ThemeProvider as ThemeProviderMui } from "@mui/material";
import React from "react";

const colors = {
  primary: "#3739b9",
};

const theme = createTheme({
  customColors: null,
  spacing: 10,
  palette: {
    primary: {
      main: colors.primary,
    },
    text: {
      primary: "#11161c",
      secondary: "#636a74",
    },
    background: {
      paper: "#f7f8f9",
    },
  },
  typography: {
    fontFamily: [`Lexend`, "sans-serif"].join(","),
    allVariants: {
      letterSpacing: "normal",
    },
    button: {
      fontSize: 13,
    },
    h3: {
      fontSize: 17,
    },
    body1: {
      fontSize: 13,
      color: "#636a74",
    },
    body2: {
      fontSize: 11,
    },
    subtitle2: {
      fontSize: 13,
    },
  },
  components: {
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 37,
          height: 21,
          padding: 0,
          boxShadow: "inset 0 0 3px 0 rgba(0, 0, 0, 0.08)",
        },
        track: {
          display: "block",
          width: 37,
          opacity: "1!important",
          height: 21,
          borderRadius: "10px",
          backgroundColor: "#dadfe5",
        },
        switchBase: {
          padding: "0!important",
          left: 2,
          top: 2,
        },
        thumb: {
          color: "#fff",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.24)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
        contained: {
          borderRadius: "8px",
          height: 37,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        fullWidth: true,
      },
      styleOverrides: {
        root: {
          height: 37,
          backgroundColor: "#fff",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
          "& fieldset": {
            borderColor: "#d5d8dc",
            borderWidth: "1px!important",
          },
          input: {
            paddingLeft: 15,
            paddingTop: 9,
            paddingBottom: 9,
          },
          "& .MuiInputBase-root": {
            height: 37,
            paddingRight: "15px",
            "&:hover": {
              "& fieldset": {
                borderColor: colors.primary,
              },
            },
            "&.Mui-focused": {
              boxShadow: "0 0 0 2px #ceceff",
            },
          },
        },
      },
    },
  },
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return <ThemeProviderMui theme={theme}>{children}</ThemeProviderMui>;
};

export default ThemeProvider;
