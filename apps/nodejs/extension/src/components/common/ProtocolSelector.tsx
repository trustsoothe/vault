import type { TextFieldProps } from "@mui/material";
import React from "react";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { SupportedProtocols } from "@poktscan/vault";
import { useAppSelector } from "../../hooks/redux";
import { labelByProtocolMap } from "../../constants/protocols";
import { networksSelector } from "../../redux/selectors/network";

const ProtocolSelector: React.ForwardRefRenderFunction<
  HTMLInputElement,
  Partial<TextFieldProps>
> = (props, ref) => {
  const networks = useAppSelector(networksSelector);

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
      {Object.values(SupportedProtocols).map((protocol) => {
        const iconUrl = networks.find(
          (network) =>
            network.protocol === protocol &&
            network.chainId ===
              (protocol === SupportedProtocols.Ethereum ? "1" : "mainnet")
        )?.iconUrl;

        return (
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
            <img
              src={iconUrl}
              alt={`${protocol}-icon`}
              width={22}
              height={22}
            />
            {labelByProtocolMap[protocol]}
          </MenuItem>
        );
      })}
    </TextField>
  );
};

export default React.forwardRef(ProtocolSelector);
