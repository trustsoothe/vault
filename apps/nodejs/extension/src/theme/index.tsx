import { createTheme, ThemeProvider as ThemeProviderMui } from "@mui/material";
import React from "react";

const theme = createTheme({
  spacing: 10,
  components: {
    MuiAutocomplete: {
      styleOverrides: {
        input: {
          marginTop: "-7px",
        },
        endAdornment: {
          right: "2px!important",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          width: "calc(100% - 14px)",
          position: "absolute",
          left: 14,
          bottom: -16,
          margin: 0,
          fontSize: 11,
        },
      },
      defaultProps: {
        //@ts-ignore
        component: "div",
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          right: 2,
        },
        select: {
          paddingTop: "20px",
          paddingLeft: "10px",
          paddingRight: "10px",
          height: 35,
          fontSize: 14,
          "& input": {
            height: 35,
            fontSize: "14px",
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: 14,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
      styleOverrides: {
        root: {
          height: 35,
          "& legend": {
            fontSize: "0.645em",
          },
          "& .MuiFormLabel-root": {
            left: "-4px",
            fontSize: 14,
            "&.MuiInputLabel-shrink": {
              left: 0,
              top: 1,
            },
          },
          "& .MuiInputBase-root": {
            height: 35,
            "&.MuiInputBase-adornedEnd": {
              paddingRight: 0,
            },
            "& input": {
              height: 35,
              fontSize: "14px",
              paddingLeft: "10px",
              paddingRight: "10px",
            },
          },
          "& input[type=number]": {
            "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
              WebkitAppearance: "none",
              margin: 0,
            },
            MozAppearance: "textfield",
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
