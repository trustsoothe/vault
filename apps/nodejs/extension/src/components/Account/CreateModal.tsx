import React, { useCallback, useEffect, useState } from "react";
import Fade from "@mui/material/Fade";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Controller, useForm } from "react-hook-form";
import { ClickAwayListener } from "@mui/base/ClickAwayListener";
import { SupportedProtocols } from "@poktscan/keyring";
import { enqueueSnackbar } from "../../utils/ui";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import ProtocolSelector from "../common/ProtocolSelector";
import useDidMountEffect from "../../hooks/useDidMountEffect";
import { ACCOUNTS_PAGE, EXPORT_VAULT_PAGE } from "../../constants/routes";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  changeSelectedAccountOfNetwork,
  changeSelectedNetwork,
} from "../../redux/slices/app";
import {
  selectedChainByProtocolSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import AppToBackground from "../../controllers/communication/AppToBackground";

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormValues {
  account_name: string;
  protocol: SupportedProtocols;
}

type FormStatus = "normal" | "loading" | "error";

export const nameRules = {
  required: "Required",
  maxLength: {
    value: 25,
    message: "The max amount of characters is 25.",
  },
  validate: (value: string) => {
    if (!value.trim()) {
      return "Required";
    }

    return true;
  },
};

const CreateModal: React.FC<CreateModalProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const protocol = useAppSelector(selectedProtocolSelector);
  const selectedChainByProtocol = useAppSelector(
    selectedChainByProtocolSelector
  );
  const [status, setStatus] = useState<FormStatus>("normal");
  const [stillShowModal, setStillShowModal] = useState(false);

  const { reset, control, handleSubmit, setValue } = useForm<FormValues>({
    defaultValues: {
      account_name: "",
      protocol,
    },
  });

  useDidMountEffect(() => {
    setValue("protocol", protocol);
  }, [protocol]);

  useEffect(() => {
    if (open) {
      setTimeout(() => setStillShowModal(true), 100);

      reset({
        account_name: "",
        protocol,
      });
    } else {
      setTimeout(() => {
        reset({
          account_name: "",
          protocol,
        });
        setStillShowModal(false);
      }, 225);
    }
  }, [open]);

  const onSubmit = useCallback(
    async (data: FormValues) => {
      setStatus("loading");
      const result = await AppToBackground.answerNewAccount({
        rejected: false,
        accountData: {
          name: data.account_name,
          protocol: data.protocol,
        },
      });

      if (result.error) {
        setStatus("error");
      } else {
        Promise.all([
          ...(protocol !== data.protocol
            ? [
                dispatch(
                  changeSelectedNetwork({
                    network: data.protocol,
                    chainId: selectedChainByProtocol[data.protocol],
                  })
                ),
              ]
            : []),
          dispatch(
            changeSelectedAccountOfNetwork({
              protocol: data.protocol,
              address: result.data.address,
            })
          ),
        ]).then(() => {
          enqueueSnackbar({
            message: (onClickClose) => (
              <Stack>
                <span>Account created successfully.</span>
                <span>
                  The vault content changed.{" "}
                  <Button
                    onClick={() => {
                      navigate(EXPORT_VAULT_PAGE);
                      onClickClose();
                    }}
                    sx={{ padding: 0, minWidth: 0 }}
                  >
                    Backup now?
                  </Button>
                </span>
              </Stack>
            ),
            variant: "success",
          });
          setStatus("normal");
          navigate(ACCOUNTS_PAGE);
          onClose();
        });
      }
    },
    [onClose, dispatch, navigate, protocol, selectedChainByProtocol]
  );

  const onClickAway = useCallback(() => {
    if (open && stillShowModal) {
      if (status === "loading") return;

      onClose();
    }
  }, [status, onClose, open, stillShowModal]);

  let content: React.ReactNode;

  const title = (
    <Typography
      fontSize={16}
      fontWeight={700}
      lineHeight={"30px"}
      textAlign={"center"}
      color={theme.customColors.primary999}
    >
      Create Account
    </Typography>
  );

  if (status === "loading") {
    content = (
      <Stack flexGrow={1}>
        {title}
        <CircularLoading containerProps={{ marginTop: -1 }} />
      </Stack>
    );
  } else if (status === "error") {
    content = (
      <Stack flexGrow={1}>
        {title}
        <OperationFailed
          text={"There was an error creating the account."}
          onCancel={onClose}
          retryBtnProps={{ sx: { height: 30, fontSize: 14 } }}
          cancelBtnProps={{ sx: { height: 30, fontSize: 14 } }}
        />
      </Stack>
    );
  } else if (open || stillShowModal) {
    content = (
      <>
        <Stack spacing={1.5}>
          {title}
          <Controller
            control={control}
            name={"protocol"}
            render={({ field }) => {
              return (
                <ProtocolSelector
                  {...field}
                  fullWidth
                  SelectProps={{
                    MenuProps: {
                      disablePortal: true,
                    },
                  }}
                  sx={{
                    "& .MuiFormHelperText-root": {
                      left: 5,
                      bottom: -27,
                      lineHeight: "13px",
                    },
                  }}
                  helperText={`You'll be able to use this account for every network of the protocol selected`}
                  InputLabelProps={{ shrink: !!field.value }}
                />
              );
            }}
          />
          <Controller
            name={"account_name"}
            control={control}
            rules={nameRules}
            render={({ field, fieldState: { error } }) => (
              <TextField
                label={"Account Name"}
                autoFocus
                required
                autoComplete={"off"}
                size={"small"}
                fullWidth
                sx={{
                  marginTop: "37px!important",
                }}
                {...field}
                InputLabelProps={{
                  shrink: !!field.value,
                }}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
        </Stack>
        <Stack direction={"row"} spacing={2} width={1}>
          <Button
            onClick={onClose}
            sx={{
              fontWeight: 700,
              color: theme.customColors.dark50,
              borderColor: theme.customColors.dark50,
              height: 30,
              borderWidth: 1.5,
              fontSize: 14,
            }}
            variant={"outlined"}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            sx={{
              fontWeight: 700,
              height: 30,
              fontSize: 14,
            }}
            variant={"contained"}
            fullWidth
            type={"submit"}
          >
            Save
          </Button>
        </Stack>
      </>
    );
  }

  content = (
    <ClickAwayListener onClickAway={onClickAway}>
      <Stack
        width={1}
        height={250}
        paddingX={2.5}
        paddingTop={1.5}
        paddingBottom={2}
        component={"form"}
        borderRadius={"8px"}
        boxSizing={"border-box"}
        justifyContent={"space-between"}
        bgcolor={theme.customColors.white}
        boxShadow={"2px 2px 14px 0px #1C2D4A33"}
        border={`1px solid ${theme.customColors.dark25}`}
        onSubmit={status === "loading" ? undefined : handleSubmit(onSubmit)}
      >
        {content}
      </Stack>
    </ClickAwayListener>
  );

  return (
    <Fade in={!!open}>
      <Stack
        width={1}
        height={540}
        padding={1.5}
        position={"absolute"}
        boxSizing={"border-box"}
        zIndex={9}
        top={60}
        left={0}
        bgcolor={"rgba(255,255,255,0.5)"}
      >
        {content}
      </Stack>
    </Fade>
  );
};

export default CreateModal;
