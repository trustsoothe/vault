import type { Contact } from "../../redux/slices/app/contact";
import React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SuccessActionBanner from "../components/SuccessActionBanner";
import WarningActionBanner from "../components/WarningActionBanner";
import ContactIcon from "../assets/img/contact_small_icon.svg";
import { labelByProtocolMap } from "../../constants/protocols";
import CopyAddressButton from "../Home/CopyAddressButton";
import Summary from "../components/Summary";
import { themeColors } from "../theme";

interface ContactFeedbackProps {
  contact: Contact;
  type: "created" | "renamed" | "already_exists";
}

export default function ContactFeedback({
  contact,
  type,
}: ContactFeedbackProps) {
  return (
    <Stack
      padding={2.4}
      spacing={1.6}
      sx={{
        svg: {
          width: 17,
          minWidth: 17,
          height: 17,
          minHeight: 17,
        },
      }}
    >
      {type === "created" || type === "renamed" ? (
        <SuccessActionBanner
          label={type === "renamed" ? "Contact Renamed" : "Contact Created"}
        />
      ) : (
        <WarningActionBanner label={"Contact Already Exists"} />
      )}
      <Summary
        rows={[
          {
            type: "row",
            label: "Name",
            value: (
              <Stack
                spacing={0.7}
                direction={"row"}
                alignItems={"center"}
                justifyContent={"flex-end"}
              >
                <ContactIcon />
                <Typography variant={"subtitle2"}>{contact.name}</Typography>
              </Stack>
            ),
          },
          {
            type: "row",
            label: "Address",
            value: (
              <CopyAddressButton
                address={contact.address}
                sxProps={{
                  boxShadow: "none",
                  marginRight: -0.8,
                  color: themeColors.black,
                  backgroundColor: "transparent",
                }}
              />
            ),
          },
          {
            type: "row",
            label: "Protocol",
            value: labelByProtocolMap[contact.protocol],
          },
        ]}
      />
    </Stack>
  );
}
