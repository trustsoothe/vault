import type { TextFieldProps } from "@mui/material";
import React from "react";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { SupportedProtocols } from "@poktscan/vault";
import { networksSelector } from "../../redux/selectors/network";
import { labelByProtocolMap } from "../../constants/protocols";
import SelectedIcon from "../assets/img/check_icon.svg";
import { useAppSelector } from "../../hooks/redux";
import { themeColors } from "../theme";

const ProtocolSelector: React.ForwardRefRenderFunction<
  HTMLInputElement,
  Partial<TextFieldProps>
> = (props, ref) => {
  const networks = useAppSelector(networksSelector);

  return (
    <TextField
      select
      placeholder={"Protocol"}
      {...props}
      ref={ref}
      sx={{
        "& .MuiSelect-select": {
          display: "flex",
          columnGap: 0.8,
          marginLeft: -0.3,
          "& img": {
            marginTop: 0.2,
          },
          "& svg": { display: "none" },
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

        const isSelected = props.value === protocol;

        return (
          <MenuItem
            key={protocol}
            value={protocol}
            sx={{
              display: "flex",
              alignItems: "center",
              columnGap: 0.8,
              "& img": {
                marginTop: 0.2,
              },
              "& svg": {
                position: "absolute",
                right: 15,
              },
              paddingRight: 3,
              position: "relative",
              backgroundColor: isSelected
                ? themeColors.bgLightGray
                : themeColors.white,
            }}
          >
            <img
              src={iconUrl}
              alt={`${protocol}-icon`}
              width={15}
              height={15}
            />
            {labelByProtocolMap[protocol]}
            {isSelected && <SelectedIcon />}
          </MenuItem>
        );
      })}
    </TextField>
  );
};

export default React.forwardRef(ProtocolSelector);
