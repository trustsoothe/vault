import React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import GrayContainer from "../components/GrayContainer";
import ContactIcon from "../assets/img/contact_icon.svg";
import NewContactButton from "./NewContactButton";
import { themeColors } from "../theme";

interface NoContactsProps {
  showCreateModal: () => void;
}

export default function NoContacts({ showCreateModal }: NoContactsProps) {
  return (
    <>
      <GrayContainer>
        <ContactIcon />
        <Typography width={252} marginTop={1.4} textAlign={"center"}>
          You do not have any Contacts yet. Create a contact for faster
          transfers.
        </Typography>
        <Stack
          width={1}
          spacing={1.2}
          marginTop={5}
          paddingX={2.4}
          direction={"row"}
          alignItems={"center"}
          boxSizing={"border-box"}
        >
          <NewContactButton onClick={showCreateModal} />
        </Stack>
      </GrayContainer>
      <Stack flexGrow={1} bgcolor={themeColors.white} />
    </>
  );
}
