import React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { themeColors } from "../theme";

interface SummaryProps {
  rows: Array<{
    label: string;
    value: React.ReactElement | React.ReactNode;
  }>;
}

export default function Summary({ rows }: SummaryProps) {
  return (
    <Stack
      bgcolor={themeColors.bgLightGray}
      spacing={0.7}
      boxSizing={"border-box"}
      borderRadius={"8px"}
      width={1}
      paddingY={1.2}
      paddingX={1.4}
    >
      {rows.map((row) => (
        <Stack
          key={row.label}
          direction={"row"}
          alignItems={"center"}
          justifyContent={"space-between"}
          width={1}
        >
          <Typography>{row.label}</Typography>

          {typeof row.value === "string" ? (
            <Typography variant={"subtitle2"}>{row.value}</Typography>
          ) : (
            row.value
          )}
        </Stack>
      ))}
    </Stack>
  );
}
