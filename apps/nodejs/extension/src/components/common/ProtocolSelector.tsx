import type { TextFieldProps } from "@mui/material";
import React from "react";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { SupportedProtocols } from "@soothe/vault";
import PocketIcon from "../../assets/img/networks/pocket.svg";
import { labelByProtocolMap } from "../../constants/protocols";
import EthereumIcon from "../../assets/img/networks/ethereum.svg";

const ProtocolSelector: React.ForwardRefRenderFunction<
  HTMLInputElement,
  Partial<TextFieldProps>
> = (props, ref) => {
  return (
    <TextField
      select
      label={"Protocol"}
      {...props}
      ref={ref}
      sx={{
        "& .MuiSelect-select": {
          display: "flex",
          columnGap: 0.3,
          marginLeft: -0.3,
          "& svg": {
            transform: "scale(0.9)",
          },
        },
        "& .MuiSelect-icon": { top: 4 },
        ...props.sx,
      }}
    >
      {Object.values(SupportedProtocols).map((protocol) => (
        <MenuItem
          key={protocol}
          value={protocol}
          sx={{
            display: "flex",
            alignItems: "center",
            columnGap: 0.3,
            "& svg": {
              transform: "scale(0.9)",
            },
          }}
        >
          {protocol === SupportedProtocols.Ethereum ? (
            <EthereumIcon />
          ) : (
            <PocketIcon />
          )}
          {labelByProtocolMap[protocol]}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default React.forwardRef(ProtocolSelector);
