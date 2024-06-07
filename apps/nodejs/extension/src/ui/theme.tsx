import { createTheme, ThemeProvider as ThemeProviderMui } from "@mui/material";
import React from "react";
import ExpandIcon from "./assets/img/expand_select_icon.svg";

export const themeColors = Object.freeze({
  primary: "#3739b9",
  bgLightGray: "#f7f8f9",
  borderLightGray: "#eff1f4",
  white: "#ffffff",
  black: "#11161c",
  textSecondary: "#636a74",
  gray: "#a2a9b6",
  light_gray: "#babdc1",
  dark_gray1: "#8b93a0",
  success: "#7db83d",
  successLight: "#ebf5de",
  red: "#a31c2a",
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
    error: {
      main: themeColors.red,
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
    h1: {
      fontSize: 30,
      fontWeight: 400,
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
    MuiMenuItem: {
      styleOverrides: {
        root: {
          height: 40,
          minHeight: 40,
          maxHeight: 40,
          padding: "12px 14px",
          boxSizing: "border-box",
          color: themeColors.black,
          "& a": {
            color: themeColors.black,
            textDecoration: "none",
          },
          "&.sensitive": {
            color: themeColors.red,
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: "8px",
          backgroundColor: themeColors.white,
          boxShadow: "0 4px 20px 0 rgba(0, 0, 0, 0.16)",
        },
        list: {
          padding: "6px",
        },
      },
    },
    MuiTooltip: {
      defaultProps: {
        arrow: true,
      },
      styleOverrides: {
        tooltip: {
          backgroundColor: themeColors.black,
          borderRadius: "4px",
          padding: "3px 7px",
          marginBottom: "10px!important",
        },
        arrow: {
          color: themeColors.black,
          fontSize: 8,
          marginBottom: "-6px!important",
        },
      },
    },
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
    MuiSelect: {
      defaultProps: {
        IconComponent: ExpandIcon,
      },
      styleOverrides: {
        icon: {
          top: "15px!important",
          right: 15,
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
