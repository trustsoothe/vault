import FormControlLabel from "@mui/material/FormControlLabel";
import Stack, { type StackProps } from "@mui/material/Stack";
import Checkbox from "@mui/material/Checkbox";
import React from "react";

interface RememberPasswordCheckboxProps {
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => void;
  checked: boolean;
  containerProps?: StackProps;
}

const RememberPasswordCheckbox: React.FC<RememberPasswordCheckboxProps> = ({
  onChange,
  checked,
  containerProps,
}) => {
  return (
    <Stack
      alignSelf={"flex-start"}
      height={20}
      marginLeft={2}
      {...containerProps}
    >
      <FormControlLabel
        sx={{
          height: 20,
          marginLeft: "-2px",
          marginTop: 1,
          userSelect: "none",
          "& .MuiButtonBase-root": {
            padding: 0,
            transform: "scale(0.85)",
          },
          "& svg": {
            fontSize: "18px!important",
          },
          "& .MuiTypography-root": {
            marginLeft: 0.7,
            fontSize: "10px!important",
          },
        }}
        control={<Checkbox onChange={onChange} checked={checked} />}
        label={"Remember password for session."}
      />
    </Stack>
  );
};

export default RememberPasswordCheckbox;
