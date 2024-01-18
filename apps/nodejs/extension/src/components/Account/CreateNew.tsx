import type { ExternalNewAccountRequest } from "../../types/communication";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import Requester from "../common/Requester";
import { enqueueSnackbar } from "../../utils/ui";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { ACCOUNTS_PAGE, EXPORT_VAULT_PAGE } from "../../constants/routes";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { changeSelectedAccountOfNetwork } from "../../redux/slices/app";
import { selectedProtocolSelector } from "../../redux/selectors/network";

interface FormValues {
  account_name: string;
  vault_password: string;
  account_password: string;
  confirm_account_password: string;
}

export const nameRules = {
  required: "Required",
  maxLength: {
    value: 50,
    message: "The max amount of characters is 50.",
  },
  validate: (value) => {
    if (!value.trim()) {
      return "Required";
    }

    return true;
  },
};

type FormStatus = "normal" | "loading" | "error";

const CreateNewAccount: React.FC = () => {
  const theme = useTheme();
  const protocol = useAppSelector(selectedProtocolSelector);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const currentRequest: ExternalNewAccountRequest = location?.state;

  const methods = useForm<FormValues>({
    defaultValues: {
      account_name: "",
      vault_password: "",
      account_password: "",
      confirm_account_password: "",
    },
  });

  const { register, formState, handleSubmit, getValues, watch } = methods;
  const [vaultPassword] = watch(["vault_password"]);

  const [status, setStatus] = useState<FormStatus>("normal");
  const [wrongPassword, setWrongPassword] = useState(false);

  useEffect(() => {
    if (wrongPassword) {
      setWrongPassword(false);
    }
  }, [vaultPassword]);

  const onClickCancel = useCallback(async () => {
    if (currentRequest) {
      await AppToBackground.answerNewAccount({
        rejected: true,
        accountData: null,
        request: currentRequest || null,
      });
    } else {
      if (location.key !== "default") {
        navigate(-1);
      } else {
        navigate("/");
      }
    }
  }, [currentRequest, navigate, location, dispatch]);

  const onClickCreate = useCallback(
    async (data: FormValues) => {
      setStatus("loading");
      const result = await AppToBackground.answerNewAccount({
        rejected: false,
        accountData: {
          name: data.account_name,
          protocol,
        },
        request: currentRequest || null,
      });

      if (result.error) {
        setStatus("error");
      } else {
        if (result?.data?.isPasswordWrong) {
          setWrongPassword(true);
          setStatus("normal");
        } else {
          dispatch(
            changeSelectedAccountOfNetwork({
              protocol: protocol,
              address: result.data.address,
            })
          ).then(() => {
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
            navigate(ACCOUNTS_PAGE);
          });
        }
      }
    },
    [currentRequest, dispatch, navigate, protocol]
  );

  const content = useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    if (status === "error") {
      return (
        <OperationFailed
          text={"There was an error creating the account."}
          onCancel={onClickCancel}
        />
      );
    }

    const { errors } = formState;

    return (
      <Stack height={1} width={1} justifyContent={"space-between"}>
        <Stack spacing={2} flexGrow={1}>
          {currentRequest && (
            <>
              <Typography
                color={theme.customColors.primary999}
                fontWeight={700}
                lineHeight={"30px"}
                textAlign={"center"}
                sx={{ userSelect: "none" }}
              >
                New Account request from:
              </Typography>
              <Requester
                request={currentRequest}
                containerProps={{
                  marginTop: "10px!important",
                  paddingX: 1.5,
                  paddingY: 0.5,
                  height: 40,
                  boxSizing: "border-box",
                }}
              />
            </>
          )}
          <TextField
            label={"Account Name"}
            size={"small"}
            fullWidth
            autoComplete={"off"}
            error={!!errors?.account_name}
            helperText={errors?.account_name?.message}
            {...register("account_name", nameRules)}
          />
        </Stack>
        <Stack direction={"row"} spacing={2} width={1}>
          <Button
            onClick={onClickCancel}
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
            Create
          </Button>
        </Stack>
      </Stack>
    );
  }, [status, onClickCancel, register, formState, getValues, methods]);

  return (
    <Stack
      component={"form"}
      onSubmit={handleSubmit(onClickCreate)}
      alignItems={"center"}
      justifyContent={"center"}
      height={1}
      paddingX={currentRequest ? 2 : 0}
      spacing={"20px"}
      width={1}
      boxSizing={"border-box"}
      marginTop={2.5}
    >
      {content}
    </Stack>
  );
};

export default CreateNewAccount;
