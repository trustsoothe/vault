import type { SerializedAccountReference } from "@poktscan/keyring";
import React, { useCallback, useState } from "react";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import { useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAppSelector } from "../../hooks/redux";
import TooltipOverflow from "../common/TooltipOverflow";
import CopyIcon from "../../assets/img/thin_copy_icon.svg";
import { labelByProtocolMap } from "../../constants/protocols";
import { contactsSelector } from "../../redux/selectors/contact";
import { REMOVE_CONTACT_PAGE, SAVE_CONTACT_PAGE } from "../../constants/routes";
import {Contact} from "../../redux/slices/app/contact";

interface ContactItemProps {
  contact: Contact;
}

export const ContactItem: React.FC<ContactItemProps> = ({ contact }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);

  const handleCopyAddress = useCallback(() => {
    if (contact) {
      navigator.clipboard.writeText(contact.address).then(() => {
        setShowCopyTooltip(true);
        setTimeout(() => setShowCopyTooltip(false), 500);
      });
    }
  }, [contact]);

  const onClickEdit = useCallback(() => {
    navigate(`${SAVE_CONTACT_PAGE}?operation=updating&id=${contact.id}`);
  }, [navigate, contact]);

  const onClickRemove = useCallback(() => {
    navigate(`${REMOVE_CONTACT_PAGE}?id=${contact.id}`);
  }, [navigate, contact]);

  return (
    <Stack
      height={91}
      paddingX={1}
      paddingTop={0.5}
      paddingBottom={1}
      borderRadius={"4px"}
      boxSizing={"border-box"}
      bgcolor={theme.customColors.dark2}
      border={`1px solid ${theme.customColors.dark15}`}
    >
      <Stack
        direction={"row"}
        alignItems={"center"}
        spacing={0.5}
        height={30}
        width={338}
      >
        <TooltipOverflow
          text={contact.name}
          textProps={{
            marginTop: 0.3,
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: "0.5px",
            lineHeight: "30px",
          }}
        />
        <Stack direction={"row"} alignItems={"center"} spacing={0.5}>
          <IconButton onClick={onClickEdit}>
            <EditIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton onClick={onClickRemove}>
            <DeleteIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
      </Stack>
      <Stack direction={"row"} alignItems={"center"} spacing={0.2}>
        <Typography fontSize={12} lineHeight={"26px"} letterSpacing={"0.5px"}>
          {contact.address}
        </Typography>
        <Tooltip title={"Copied"} open={showCopyTooltip}>
          <IconButton
            onClick={handleCopyAddress}
            sx={{ marginTop: "-3px!important" }}
          >
            <CopyIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      <Typography fontSize={12} lineHeight={"20px"} letterSpacing={"0.5px"}>
        {labelByProtocolMap[contact.protocol] || contact.protocol}
      </Typography>
    </Stack>
  );
};

const ContactList: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const contacts = useAppSelector(contactsSelector);

  const onClickAdd = useCallback(() => {
    navigate(`${SAVE_CONTACT_PAGE}?operation=adding`);
  }, [navigate]);

  return (
    <Stack
      height={1}
      width={1}
      marginTop={1.5}
      justifyContent={"space-between"}
      spacing={1.5}
    >
      <Stack flexGrow={1} overflow={"auto"} spacing={1.5}>
        {contacts.length ? (
          contacts.map((contact) => (
            <ContactItem contact={contact} key={contact.id} />
          ))
        ) : (
          <Stack justifyContent={"center"} alignItems={"center"} flexGrow={1}>
            <Typography mt={-2.5} fontSize={13}>
              You don't have any custom contact yet.
            </Typography>
          </Stack>
        )}
      </Stack>

      <Button
        variant={"contained"}
        fullWidth
        sx={{
          backgroundColor: theme.customColors.primary500,
          height: 35,
          fontWeight: 700,
          fontSize: 16,
        }}
        onClick={onClickAdd}
      >
        Add Contact
      </Button>
    </Stack>
  );
};

export default ContactList;
