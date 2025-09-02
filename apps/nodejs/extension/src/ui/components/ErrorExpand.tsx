import React from "react";
import Stack from "@mui/material/Stack";
import Accordion from "@mui/material/Accordion";
import Typography from "@mui/material/Typography";
import { AccordionDetails, SxProps } from "@mui/material";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandIcon from "../assets/img/expand_select_icon.svg";
import { themeColors } from "../theme";
import CopyButton from "./CopyButton";

interface ErrorExpandProps {
  errorString: string;
  detailSxProps?: SxProps;
}

export default function ErrorExpand({
  errorString,
  detailSxProps,
}: ErrorExpandProps) {
  return (
    <Accordion
      sx={{
        borderRadius: "8px",
        border: `1px solid ${themeColors.light_gray1}`,
        marginBottom: "6px!important",
        marginTop: "10px!important",
        "&::before": {
          display: "none",
        },
      }}
      elevation={0}
    >
      <AccordionSummary
        expandIcon={<ExpandIcon />}
        sx={{
          minHeight: "36px!important",
          height: "36px!important",
          paddingX: 1.2,
          "& .MuiAccordionSummary-content": {
            marginY: "0px!important",
          },
        }}
      >
        <Stack
          width={1}
          gap={1.2}
          paddingRight={1}
          direction={"row"}
          alignItems={"center"}
          justifyContent={"space-between"}
        >
          <Typography
            color={themeColors.black}
            whiteSpace={"nowrap"}
            fontSize={12}
          >
            Error Info
          </Typography>
          <CopyButton
            label={"Copy"}
            textToCopy={`\`\`\`json
${errorString}
\`\`\``}
            sxProps={{
              width: 100,
              height: 26,
            }}
          />
        </Stack>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          maxHeight: 135,
          padding: 1.2,
          overflowY: "auto",
          ...detailSxProps,
        }}
      >
        <Typography
          sx={{
            whiteSpace: "pre-wrap",
            whiteSpaceCollapse: "break-spaces",
            wordBreak: "break-word",
            fontFamily: "monospace",
            fontSize: 10,
            color: themeColors.black,
            letterSpacing: "0px",
          }}
        >
          {errorString}
        </Typography>
      </AccordionDetails>
    </Accordion>
  );
}
