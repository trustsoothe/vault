import React from "react";
import Divider from "@mui/material/Divider";
import Stack, { StackProps } from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { themeColors } from "../theme";

interface RowItem {
  type: "row";
  label: React.ReactElement | React.ReactNode | string;
  value: React.ReactElement | React.ReactNode;
  containerProps?: StackProps;
}

interface DividerItem {
  type: "divider";
}

export type SummaryRowItem = RowItem | DividerItem;

export interface SummaryProps {
  rows: Array<SummaryRowItem>;
  containerProps?: StackProps;
}

export default function Summary({ rows, containerProps }: SummaryProps) {
  return (
    <Stack
      bgcolor={themeColors.bgLightGray}
      spacing={0.7}
      boxSizing={"border-box"}
      borderRadius={"8px"}
      width={1}
      paddingY={1.2}
      paddingX={1.4}
      {...containerProps}
    >
      {rows.map((row, index) => {
        if (row.type === "divider") {
          return (
            <Divider
              sx={{
                borderColor: themeColors.borderLightGray,
                marginBottom: index === rows.length - 1 ? 0 : "6px!important",
                marginTop: index === 0 ? 0 : "13px!important",
                marginLeft: "-14px!important",
                width: "calc(100% + 28px)",
              }}
              flexItem={true}
            />
          );
        }

        return (
          <Stack
            key={index}
            direction={"row"}
            alignItems={"center"}
            justifyContent={"space-between"}
            width={1}
            {...row.containerProps}
          >
            {typeof row.label === "string" ? (
              <Typography noWrap>{row.label}</Typography>
            ) : (
              row.label
            )}

            {typeof row.value === "string" ? (
              <Typography
                variant={"subtitle2"}
                fontWeight={500}
                noWrap={true}
                marginLeft={0.5}
              >
                {row.value}
              </Typography>
            ) : (
              row.value
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}
