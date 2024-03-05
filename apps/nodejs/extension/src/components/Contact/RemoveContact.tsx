import type { SerializedAccountReference } from "@soothe/vault";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import { CONTACTS_PAGE } from "../../constants/routes";
import { enqueueSnackbar } from "../../utils/ui";
import { ContactItem } from "./List";
import {Contact, removeContact} from "../../redux/slices/app/contact";
import { contactsSelector } from "../../redux/selectors/contact";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";

const RemoveContact: React.FC = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact>(null);
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );
  const contacts = useAppSelector(contactsSelector);

  const onCancel = useCallback(() => {
    navigate(CONTACTS_PAGE);
  }, [navigate, location]);

  useEffect(() => {
    const id = searchParams.get("id");
    const contactFromStore = contacts.find((item) => item.id === id);
    if (contactFromStore && contact?.id !== id) {
      setContact(contactFromStore);
      return;
    }

    if (!contactFromStore) {
      onCancel();
    }
  }, [searchParams, contacts]);

  const onSubmitRemove = useCallback(() => {
    if (contact) {
      setStatus("loading");
      dispatch(removeContact(contact.id))
        .unwrap()
        .then(() => {
          enqueueSnackbar({
            message: `Contact removed successfully.`,
            variant: "success",
          });
          navigate(CONTACTS_PAGE);
        })
        .catch(() => {
          setStatus("error");
        });
    }
  }, [contact, dispatch]);

  return useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    if (status === "error") {
      return (
        <OperationFailed
          text={"There was an error removing the contact."}
          onCancel={onCancel}
          onRetry={onSubmitRemove}
        />
      );
    }

    return (
      <Stack flexGrow={1} marginTop={3.5} justifyContent={"space-between"}>
        <Stack flexGrow={1}>
          <Typography
            fontSize={18}
            width={1}
            marginBottom={"30px!important"}
            textAlign={"center"}
            fontWeight={700}
            lineHeight={"28px"}
            color={theme.customColors.primary999}
          >
            Are you sure you want to remove the following contact?
          </Typography>
          {contact && <ContactItem contact={contact} />}
        </Stack>
        <Stack direction={"row"} width={1} spacing={2}>
          <Button
            variant={"outlined"}
            sx={{
              fontWeight: 700,
              color: theme.customColors.dark50,
              borderColor: theme.customColors.dark50,
              height: 36,
              borderWidth: 1.5,
              fontSize: 16,
            }}
            fullWidth
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant={"contained"}
            sx={{
              fontWeight: 700,
              height: 36,
              fontSize: 16,
            }}
            onClick={onSubmitRemove}
            fullWidth
          >
            Yes
          </Button>
        </Stack>
      </Stack>
    );
  }, [status, onSubmitRemove, contact, onCancel]);
};

export default RemoveContact;
