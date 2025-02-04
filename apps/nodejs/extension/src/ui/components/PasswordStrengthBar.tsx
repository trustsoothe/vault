import Stack from "@mui/material/Stack";
import React, { useState } from "react";
import BasePasswordStrengthBar, {
  PasswordStrengthBarProps,
} from "react-password-strength-bar";
import { SxProps } from "@mui/material";

export default function PasswordStrengthBar(props: PasswordStrengthBarProps) {
  const [score, setScore] = useState(0);

  let styles: SxProps;

  switch (score) {
    case 0: {
      if (props.password?.length < 8) {
      } else {
        styles = {
          "& div:nth-of-type(1)": {
            backgroundColor: "#d8383c !important",
          },
        };
      }
      break;
    }
    case 1: {
      styles = {
        "& div:nth-of-type(1)": {
          backgroundColor: "#fd9819!important",
        },
        "& div:nth-of-type(3)": {
          backgroundColor: "#f78d05!important",
        },
      };
      break;
    }
    case 2: {
      styles = {
        "& div:nth-of-type(1)": {
          backgroundColor: "#75b02c!important",
        },
        "& div:nth-of-type(3)": {
          backgroundColor: "#6aa621!important",
        },
        "& div:nth-of-type(5)": {
          backgroundColor: "#639f19!important",
        },
      };
      break;
    }
    case 3:
    case 4: {
      styles = {
        "& div:nth-of-type(1)": {
          backgroundColor: "#75b02c!important",
        },
        "& div:nth-of-type(3)": {
          backgroundColor: "#6aa621!important",
        },
        "& div:nth-of-type(5)": {
          backgroundColor: "#639f19!important",
        },
        "& div:nth-of-type(7)": {
          backgroundColor: "#4f8907!important",
        },
      };
      break;
    }
  }

  return (
    <Stack
      width={1}
      marginTop={1.3}
      sx={{
        "& p": {
          marginRight: "8px!important",
        },
        "& .strength-bar": {
          width: 1,
          height: 14,
          display: "flex",
          borderRadius: "2.5px",
          flexDirection: "row-reverse",
          alignItems: "center",
          "& div:first-of-type": {
            "& div": {
              width: "8px!important",
              height: "8px!important",
              borderRadius: "1px",
              backgroundColor: "#bbc0ca!important",
              flexBasis: "unset!important",
              flexGrow: "unset!important",
            },
            [`& div[style="width: 4px;"]`]: {
              width: "2px!important",
              backgroundColor: "#fff!important",
              borderRadius: "0px",
            },
            "& div:first-of-type": {
              borderTopLeftRadius: "2.5px",
              borderBottomLeftRadius: "2.5px",
            },
            "& div:last-of-type": {
              borderTopRightRadius: "2.5px",
              borderBottomRightRadius: "2.5px",
            },
            ...((styles as any) || {}),
          },
        },
      }}
    >
      <BasePasswordStrengthBar
        className={"strength-bar"}
        shortScoreWord={props.password ? "Short" : ""}
        minLength={8}
        scoreWords={[
          "Weak",
          "Average",
          "Strong",
          "Super Strong",
          "Super Strong",
        ]}
        scoreWordStyle={{
          fontSize: 11,
          fontFamily: `Lexend, "san serif"`,
        }}
        onChangeScore={(score) => {
          setScore(score);
        }}
        {...props}
      />
    </Stack>
  );
}
