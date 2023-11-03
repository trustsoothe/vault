import { createTheme, ThemeProvider as ThemeProviderMui } from "@mui/material";
import React from "react";
import DropDownIcon from "../assets/img/drop_down_icon.svg";
import CheckIcon from "../assets/img/check_icon.svg";
import CheckedIcon from "../assets/img/checked_icon.svg";

interface CustomColors {
  white: string;
  dark2: string;
  dark5: string;
  dark15: string;
  dark25: string;
  dark50: string;
  dark75: string;
  dark90: string;
  dark100: string;
  primary100: string;
  primary250: string;
  primary500: string;
  primary999: string;
  red100: string;
  green5: string;
  dark_green: string;
}

declare module "@mui/material" {
  interface Theme {
    customColors: CustomColors;
  }

  interface ThemeOptions {
    customColors: CustomColors;
  }
}

const customColors: CustomColors = {
  white: "#FFFFFF",
  dark2: "#FBFBFB",
  dark5: "#F4F4F4",
  dark15: "#DFDFDF",
  dark25: "#C9C9C9",
  dark50: "#939393",
  dark75: "#5D5D5D",
  dark90: "#333333",
  dark100: "#272727",
  primary100: "#F0F6FF",
  primary250: "#5CA3E5",
  primary500: "#1E70EB",
  primary999: "#152A48",
  red100: "#FF2835",
  green5: "#F4FDF8",
  dark_green: "#2ACE3A",
};

const theme = createTheme({
  customColors,
  spacing: 10,
  typography: {
    fontFamily: [`DM Sans`, "sans-serif"].join(","),
  },
  palette: {
    text: {
      primary: customColors.dark100,
      disabled: customColors.dark25,
    },
    error: {
      main: customColors.red100,
    },
  },
  components: {
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },
    MuiAutocomplete: {
      defaultProps: {
        popupIcon: <DropDownIcon />,
      },
      styleOverrides: {
        root: {
          "& input::placeholder": {
            color: `${customColors.dark75}!important`,
            opacity: 1,
          },
          "& .MuiInputBase-root": {
            paddingLeft: "0!important",
            paddingRight: "23px!important",
          },
          "& .Mui-disabled": {
            "& path": {
              stroke: customColors.dark25,
            },
            "& button": {
              opacity: 0.5,
            },
          },
        },

        input: {
          marginTop: "-7px",
        },
        endAdornment: {
          right: "2px!important",
          top: "calc(50% - 17px)",
        },
        noOptions: {
          fontSize: 14,
          color: customColors.dark75,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
        contained: {
          backgroundColor: customColors.primary500,
          boxShadow: "none",
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
          fontSize: 10,
        },
      },
      defaultProps: {
        //@ts-ignore
        component: "div",
      },
    },
    MuiSelect: {
      defaultProps: {
        IconComponent: DropDownIcon,
      },
      styleOverrides: {
        icon: {
          right: 2,
          top: 0,
          "&.Mui-disabled": {
            opacity: 0.5,
          },
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
    MuiCheckbox: {
      defaultProps: {
        checkedIcon: <CheckedIcon />,
        icon: <CheckIcon />,
      },
      styleOverrides: {
        root: {
          width: 18,
          height: 19,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
      styleOverrides: {
        root: {
          height: 40,
          "& legend": {
            marginLeft: -3,
            fontSize: "0.7em",
          },
          "& fieldset": {
            borderRadius: "3px",
            borderColor: customColors.dark25,
          },
          "& .MuiFormLabel-root": {
            left: "-4px",
            fontSize: 14,
            color: customColors.dark50,
            "&.Mui-error": {
              color: customColors.red100,
            },
            "&.MuiInputLabel-shrink": {
              left: 0,
              top: 1,
              transform: "translate(14px, -9px) scale(0.714)",
            },
            "&.Mui-disabled": {
              color: `${customColors.dark15}!important`,
            },
          },
          "& .MuiInputBase-root": {
            height: 40,
            "&.Mui-disabled": {
              "& fieldset": {
                borderColor: `${customColors.dark15}!important`,
              },
            },
            "&.MuiInputBase-adornedEnd": {
              paddingRight: 0,
            },
            "& input": {
              height: 40,
              fontSize: "14px",
              letterSpacing: "0.5px",
              paddingLeft: "10px!important",
              paddingRight: "10px!important",
              "&::placeholder": {
                color: customColors.dark75,
                opacity: 1,
              },
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
