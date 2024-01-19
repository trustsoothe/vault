import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import {
  SerializedAccountReference,
  SupportedProtocols,
} from "@poktscan/keyring";
import { nameRules } from "../Account/CreateModal";
import { enqueueSnackbar } from "../../utils/ui";
import { CONTACTS_PAGE } from "../../constants/routes";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import { saveContact } from "../../redux/slices/app/contact";
import useDidMountEffect from "../../hooks/useDidMountEffect";
import { labelByProtocolMap } from "../../constants/protocols";
import { isValidAddress } from "../../utils/networkOperations";
import { contactsSelector } from "../../redux/selectors/contact";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  ACCOUNT_ALREADY_EXISTS,
  CONTACT_ALREADY_EXISTS,
} from "../../errors/contact";

type FormValues = Omit<SerializedAccountReference, "id">;

const defaultFormValues: FormValues = {
  name: "",
  address: "",
  protocol: SupportedProtocols.Pocket,
};

const protocols: { protocol: SupportedProtocols; label: string }[] =
  Object.values(SupportedProtocols).map((protocol) => ({
    protocol,
    label: labelByProtocolMap[protocol],
  }));

const SaveContact: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [contactToUpdate, setContactToUpdate] =
    useState<SerializedAccountReference>(null);
  const [status, setStatus] = useState<
    | "normal"
    | "loading"
    | "error"
    | "account_already_exists"
    | "contact_already_exists"
  >("normal");
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    clearErrors,
    setFocus,
  } = useForm<FormValues>({
    defaultValues: { ...defaultFormValues },
  });

  const preventResetAddressRef = useRef(false);

  const selectedProtocol = watch("protocol");
  const contacts = useAppSelector(contactsSelector);

  useDidMountEffect(() => {
    if (preventResetAddressRef.current) {
      preventResetAddressRef.current = false;
      return;
    }
    setValue("address", "");
    clearErrors("address");
  }, [selectedProtocol]);

  const onCancel = useCallback(() => {
    navigate(CONTACTS_PAGE);
  }, [navigate]);

  useEffect(() => {
    const id = searchParams.get("id");
    const contactFromStore = contacts.find((item) => item.id === id);
    if (contactFromStore && contactToUpdate?.id !== id) {
      setContactToUpdate(contactFromStore);
      return;
    }

    if (!contactFromStore) {
      setContactToUpdate(null);
    }
  }, [searchParams, contacts]);

  useEffect(() => {
    if (contactToUpdate) {
      preventResetAddressRef.current = true;
      reset({
        protocol: contactToUpdate.protocol,
        address: contactToUpdate.address,
        name: contactToUpdate.name,
      });
    }
  }, [contactToUpdate]);

  const onSubmit = useCallback(
    async (data: FormValues) => {
      setStatus("loading");

      dispatch(
        saveContact({
          idToReplace: contactToUpdate?.id,
          contact: {
            name: data.name,
            address: data.address,
            protocol: data.protocol,
          },
        })
      )
        .unwrap()
        .then(() => {
          enqueueSnackbar({
            message: `Contact ${
              contactToUpdate ? "updated" : "added"
            } successfully.`,
            variant: "success",
          });

          navigate(CONTACTS_PAGE);
        })
        .catch((error) => {
          if (error.name === CONTACT_ALREADY_EXISTS.name) {
            setStatus("contact_already_exists");
          } else if (error.name === ACCOUNT_ALREADY_EXISTS.name) {
            setStatus("account_already_exists");
          } else {
            setStatus("error");
          }
        });
    },
    [contactToUpdate, navigate]
  );

  const onClickOk = useCallback(() => {
    setStatus("normal");
    setTimeout(() => setFocus("address"), 100);
  }, [setFocus]);

  const content = useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    if (status === "error") {
      return (
        <OperationFailed
          text={"There was an error saving the contact."}
          onCancel={onCancel}
        />
      );
    }

    if (
      status === "account_already_exists" ||
      status === "contact_already_exists"
    ) {
      const isAccount = status === "account_already_exists";
      return (
        <OperationFailed
          text={`${
            isAccount
              ? ACCOUNT_ALREADY_EXISTS.message
              : CONTACT_ALREADY_EXISTS.message
          } Please introduce another address.`}
          textProps={{
            fontSize: 14,
          }}
          onCancel={onCancel}
          retryBtnText={"Ok"}
          retryBtnProps={{
            type: "button",
          }}
          onRetry={onClickOk}
        />
      );
    }

    return (
      <Stack
        flexGrow={1}
        component={"form"}
        onSubmit={handleSubmit(onSubmit)}
        boxSizing={"border-box"}
        justifyContent={"space-between"}
        paddingTop={2}
      >
        <Stack spacing={1.5}>
          <Controller
            name={"name"}
            control={control}
            rules={nameRules}
            render={({ field, fieldState: { error } }) => (
              <TextField
                label={"Name"}
                size={"small"}
                fullWidth
                autoComplete={"off"}
                error={!!error}
                helperText={error?.message}
                InputLabelProps={{
                  shrink: !!field.value,
                }}
                {...field}
              />
            )}
          />
          <Controller
            name={"protocol"}
            control={control}
            rules={{ required: "Required" }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                size={"small"}
                autoComplete={"off"}
                label={"Protocol"}
                select
                {...field}
                error={!!error}
                helperText={error?.message}
                sx={{
                  "& .MuiSelect-icon": {
                    top: 5,
                  },
                }}
              >
                {protocols.map(({ protocol, label }) => (
                  <MenuItem key={protocol} value={protocol}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Controller
            name={"address"}
            control={control}
            rules={{
              required: "Required",
              validate: (value, formValues) => {
                if (!isValidAddress(value, formValues.protocol)) {
                  return "Invalid address";
                }
                return true;
              },
            }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                size={"small"}
                autoComplete={"off"}
                label={"Address"}
                error={!!error}
                helperText={error?.message}
                InputLabelProps={{
                  shrink: !!field.value,
                }}
                disabled={!selectedProtocol}
                {...field}
              />
            )}
          />
        </Stack>
        <Stack direction={"row"} spacing={2} width={1}>
          <Button
            onClick={onCancel}
            sx={{
              fontWeight: 700,
              color: theme.customColors.dark50,
              borderColor: theme.customColors.dark50,
              height: 36,
              borderWidth: 1.5,
              fontSize: 16,
            }}
            variant={"outlined"}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            sx={{
              fontWeight: 700,
              height: 36,
              fontSize: 16,
            }}
            variant={"contained"}
            fullWidth
            type={"submit"}
          >
            Save
          </Button>
        </Stack>
      </Stack>
    );
  }, [status, theme, register, handleSubmit, onSubmit, onCancel, control]);

  return (
    <Stack flexGrow={1} boxSizing={"border-box"}>
      {content}
    </Stack>
  );
};

export default SaveContact;
