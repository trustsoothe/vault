import Menu from "@mui/material/Menu";
import Stack from "@mui/material/Stack";
import React, { useState } from "react";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { useSearchParams } from "react-router-dom";
import { Contact, removeContact } from "../../redux/slices/app/contact";
import { enqueueErrorSnackbar, enqueueSnackbar } from "../../utils/ui";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import SmallGrayContainer from "../components/SmallGrayContainer";
import { contactsSelector } from "../../redux/selectors/contact";
import { labelByProtocolMap } from "../../constants/protocols";
import ContactIcon from "../assets/img/contact_small_icon.svg";
import MenuDivider from "../components/MenuDivider";
import MoreIcon from "../assets/img/more_icon.svg";
import NewContactButton from "./NewContactButton";
import RenameContactModal from "./RenameModal";
import CreateModal from "./CreateModal";
import { themeColors } from "../theme";
import NoContacts from "./NoContacts";

interface CustomItemProps {
  contact: Contact;
  openRenameModal: (contact: Contact) => void;
}

function ContactItem({ contact, openRenameModal }: CustomItemProps) {
  const dispatch = useAppDispatch();
  const [anchorEl, setAnchorEl] = useState<null | HTMLButtonElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const copyAddress = () => {
    navigator.clipboard
      .writeText(contact.address)
      .then(() => {
        enqueueSnackbar({
          message: `Contact's Address Copied`,
          variant: "success",
        });
      })
      .catch(() => {
        enqueueErrorSnackbar({
          message: `Error Copying Contact's Address`,
          variant: "error",
          onRetry: copyAddress,
        });
      });
  };

  const removeThisContact = () => {
    dispatch(removeContact(contact.id))
      .unwrap()
      .then(() => {
        enqueueSnackbar({
          message: `Contact removed successfully`,
          variant: "success",
        });
      })
      .catch(() => {
        enqueueErrorSnackbar({
          message: `An error occur removing the contact`,
          variant: "error",
          onRetry: removeThisContact,
        });
      });
  };

  return (
    <>
      <SmallGrayContainer>
        <ContactIcon style={{ minWidth: 16 }} />
        <Stack spacing={0.4} flexGrow={1}>
          <Typography variant={"subtitle2"} lineHeight={"16px"}>
            {contact.name}
          </Typography>
          <Typography
            variant={"body2"}
            lineHeight={"14px"}
            color={themeColors.textSecondary}
          >
            {labelByProtocolMap[contact.protocol]}
          </Typography>
        </Stack>
        <IconButton
          sx={{ height: 25, width: 27, borderRadius: "8px" }}
          onClick={handleClick}
        >
          <MoreIcon />
        </IconButton>
      </SmallGrayContainer>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              width: 190,
              marginTop: 0.8,
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            openRenameModal(contact);
            handleClose();
          }}
        >
          Rename
        </MenuItem>
        <MenuItem
          onClick={() => {
            copyAddress();
            handleClose();
          }}
        >
          Copy Address
        </MenuItem>
        <MenuDivider />
        <MenuItem
          className={"sensitive"}
          onClick={() => {
            removeThisContact();
            handleClose();
          }}
        >
          Remove Contact
        </MenuItem>
      </Menu>
    </>
  );
}

export default function ContactList() {
  const contacts = useAppSelector(contactsSelector);
  const [searchParams] = useSearchParams();
  const [contactToRename, setContactToRename] = useState<Contact>(null);
  const [showCreateModal, setShowCreateModal] = useState(
    !!searchParams.get("address") && !!searchParams.get("protocol")
  );

  const toggleShowCreateModal = () => setShowCreateModal((prev) => !prev);
  const closeRenameModal = () => setContactToRename(null);
  const openRenameModal = (contact: Contact) => setContactToRename(contact);

  return (
    <>
      <RenameContactModal
        contact={contactToRename}
        onClose={closeRenameModal}
      />
      <CreateModal open={showCreateModal} onClose={toggleShowCreateModal} />
      {contacts.length > 0 ? (
        <>
          <Stack
            flexGrow={1}
            spacing={1.2}
            padding={2.4}
            minHeight={0}
            flexBasis={"1px"}
            overflow={"auto"}
            bgcolor={themeColors.white}
          >
            {contacts.map((contact) => (
              <ContactItem
                key={contact.id}
                contact={contact}
                openRenameModal={openRenameModal}
              />
            ))}
          </Stack>
          <Stack
            padding={2.4}
            alignItems={"center"}
            justifyContent={"center"}
            bgcolor={themeColors.bgLightGray}
            borderTop={`1px solid ${themeColors.borderLightGray}`}
          >
            <NewContactButton onClick={toggleShowCreateModal} />
          </Stack>
        </>
      ) : (
        <NoContacts showCreateModal={toggleShowCreateModal} />
      )}
    </>
  );
}
