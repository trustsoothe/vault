import React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AccountInfo from "../components/AccountInfo";
import { roundAndSeparate } from "../../utils/ui";
import Summary from "../components/Summary";
import { themeColors } from "../theme";

export default function SendSummary() {
  return (
    <>
      <Summary
        rows={[
          {
            type: "row",
            label: "From",
            value: (
              <AccountInfo
                address={"35bec7540d553e3c34680b717e2e71c478ad6d8a"}
                name={"Sec POKT"}
              />
            ),
          },
          {
            type: "divider",
          },
          {
            type: "row",
            label: "To",
            value: (
              <AccountInfo
                address={"35bec7540d553e3c34680b717e2e71c478ad6d8a"}
              />
            ),
          },
        ]}
      />
      <Summary
        rows={[
          {
            type: "row",
            label: "Amount",
            value: (
              // todo: create component
              <Stack direction={"row"} alignItems={"center"} spacing={0.5}>
                <Typography noWrap={true} variant={"subtitle2"}>
                  {roundAndSeparate(50, 6, "0")}
                </Typography>
                <Typography variant={"subtitle2"}>POKT</Typography>
                <Typography color={themeColors.gray}>
                  ($ {roundAndSeparate(7.65, 2, "0.00")})
                </Typography>
              </Stack>
            ),
          },
          {
            type: "row",
            label: "Fee",
            value: "0.01 POKT",
          },
          {
            type: "row",
            label: "Total",
            value: (
              // todo: create component
              <Stack direction={"row"} alignItems={"center"} spacing={0.5}>
                <Typography noWrap={true} variant={"subtitle2"}>
                  {roundAndSeparate(50.01, 6, "0")}
                </Typography>
                <Typography variant={"subtitle2"}>POKT</Typography>
                <Typography color={themeColors.gray}>
                  ($ {roundAndSeparate(7.65, 2, "0.00")})
                </Typography>
              </Stack>
            ),
          },
          {
            type: "row",
            label: "Network",
            value: "Pocket Mainnet",
          },
        ]}
      />
    </>
  );
}
