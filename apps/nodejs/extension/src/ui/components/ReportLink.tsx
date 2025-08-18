import React from "react";
import Link from "@mui/material/Link";
import { OpenInNew } from "@mui/icons-material";
import Typography from "@mui/material/Typography";
import { themeColors } from "../theme";

interface ReportLinkProps {
  href: string;
}

export default function ReportLink({ href }: ReportLinkProps) {
  return (
    <Typography lineHeight={"22px"} fontSize={12} color={themeColors.black}>
      Copy the error,{" "}
      <Link
        href={href}
        target={"_blank"}
        sx={{
          lineHeight: "20px",
          textDecoration: "none",
          "&:hover": {
            textDecoration: "underline",
          },
        }}
      >
        <span>Create a Bug Report on GitHub</span>
        <OpenInNew
          sx={{
            fontSize: 16,
            marginLeft: 0.4,
            marginBottom: -0.2,
          }}
        />
      </Link>{" "}
      and paste it into the issue.
    </Typography>
  );
}
