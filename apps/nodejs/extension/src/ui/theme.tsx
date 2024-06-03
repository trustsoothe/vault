import { createTheme, ThemeProvider as ThemeProviderMui } from "@mui/material";
import React from "react";

export const themeColors = Object.freeze({
  primary: "#3739b9",
  bgLightGray: "#f7f8f9",
  borderLightGray: "#eff1f4",
  white: "#ffffff",
  black: "#11161c",
  textSecondary: "#636a74",
  gray: "#a2a9b6",
  success: "#7db83d",
});

const theme = createTheme({
  customColors: null,
  spacing: 10,
  palette: {
    primary: {
      main: themeColors.primary,
    },
    text: {
      primary: themeColors.black,
      secondary: themeColors.textSecondary,
    },
    background: {
      paper: themeColors.bgLightGray,
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
      color: themeColors.textSecondary,
    },
    body2: {
      fontSize: 11,
    },
    subtitle2: {
      fontSize: 13,
    },
  },
  components: {
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: "0px",
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 37,
          height: 22,
          padding: 0,
        },
        track: {
          display: "block",
          width: 37,
          opacity: "1!important",
          height: 22,
          borderRadius: "16px",
          backgroundColor: "#dadfe5",
          boxShadow: "inset 0 0 3px 0 rgba(0, 0, 0, 0.08)",
        },
        switchBase: {
          padding: "0!important",
          left: 2,
          top: 3,
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
          borderRadius: "8px",
          "&.Mui-disabled": {
            color: "#a2a9b6",
            "&.MuiButton-contained": {
              backgroundColor: "#eff1f4",
            },
          },
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
            borderRadius: "6px",
            paddingRight: "15px",
            "&:hover": {
              "& fieldset": {
                borderColor: themeColors.primary,
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
