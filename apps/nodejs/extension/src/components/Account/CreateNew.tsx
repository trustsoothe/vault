import React, { useCallback, useMemo, useState } from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { useForm } from "react-hook-form";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useNavigate, useLocation } from "react-router-dom";
import CircularLoading from "../common/CircularLoading";
import AutocompleteAsset from "./AutocompleteAsset";
import { SerializedAsset } from "@poktscan/keyring";
import RequestFrom from "../common/RequestFrom";
import { NewAccountRequest } from "../../redux/slices/app";
import { useAppDispatch } from "../../hooks/redux";
import AppToBackground from "../../controllers/communication/AppToBackground";

interface CreateNewAccountProps {
  currentRequest?: NewAccountRequest;
}

interface FormValues {
  account_name: string;
  password: string;
  asset: SerializedAsset | null;
}

type FormStatus = "normal" | "loading" | "error" | "submitted";

const CreateNewAccount: React.FC<CreateNewAccountProps> = ({
  currentRequest,
}) => {
  const dispatch = useAppDispatch();
  const navigate = currentRequest ? null : useNavigate();
  const location = currentRequest ? null : useLocation();

  const { register, formState, handleSubmit, getValues, control } =
    useForm<FormValues>({
      defaultValues: {
        account_name: "",
        password: "",
        asset: null,
      },
    });

  const [status, setStatus] = useState<FormStatus>("normal");

  const onClickCancel = useCallback(async () => {
    if (currentRequest) {
      await AppToBackground.sendRequestToAnswerNewAccount({
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
      try {
        await AppToBackground.sendRequestToAnswerNewAccount({
          rejected: false,
          accountData: {
            name: data.account_name,
            asset: data.asset,
            password: data.password,
          },
          request: currentRequest || null,
        });
        if (!currentRequest) {
          setStatus("submitted");
        }
      } catch (e) {
        if (!currentRequest) {
          setStatus("error");
        }
      }
    },
    [currentRequest, dispatch]
  );

  const content = useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    if (status === "error") {
      return (
        <>
          <Typography>There was an error creating the account.</Typography>
          <Stack direction={"row"} spacing={"20px"}>
            <Button
              variant={"outlined"}
              sx={{ textTransform: "none", height: 30, fontWeight: 500 }}
              fullWidth
              onClick={onClickCancel}
            >
              Cancel
            </Button>
            <Button
              variant={"contained"}
              sx={{ textTransform: "none", height: 30, fontWeight: 600 }}
              fullWidth
              type={"submit"}
            >
              Retry
            </Button>
          </Stack>
        </>
      );
    }

    if (status === "submitted") {
      const accountName = getValues("account_name");

      return (
        <>
          <Typography textAlign={"center"}>
            The account "{accountName}" was created successfully!
          </Typography>
          <Button sx={{ textTransform: "none" }} onClick={() => navigate("/")}>
            Accept
          </Button>
        </>
      );
    }

    const { errors, isValid } = formState;

    return (
      <>
        {currentRequest ? (
          <RequestFrom
            title={"New Account Request from:"}
            {...currentRequest}
          />
        ) : (
          <Typography textAlign={"center"} variant={"h6"}>
            Create Account
          </Typography>
        )}
        <AutocompleteAsset control={control} />
        <TextField
          label={"Account Name"}
          size={"small"}
          fullWidth
          autoFocus
          autoComplete={"off"}
          error={!!errors?.account_name}
          helperText={errors?.account_name?.message}
          {...register("account_name", {
            required: "Required",
            validate: (value) => {
              if (!value.trim()) {
                return "Required";
              }

              return true;
            },
          })}
        />
        <TextField
          label={"Account Password"}
          size={"small"}
          fullWidth
          type={"password"}
          error={!!errors?.password}
          helperText={errors?.password?.message}
          {...register("password", {
            required: "Required",
          })}
        />
        <Stack direction={"row"} spacing={"20px"} width={1} marginTop={"20px"}>
          <Button
            onClick={onClickCancel}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "gray",
              borderColor: "gray",
            }}
            variant={"outlined"}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            sx={{ textTransform: "none", fontWeight: 600 }}
            variant={"contained"}
            fullWidth
            type={"submit"}
            disabled={!isValid}
          >
            Create
          </Button>
        </Stack>
      </>
    );
  }, [status, onClickCancel, register, formState, getValues, navigate]);

  return (
    <Stack
      component={"form"}
      onSubmit={handleSubmit(onClickCreate)}
      alignItems={"center"}
      justifyContent={"center"}
      height={"calc(100% - 50px)"}
      paddingX={"20px"}
      spacing={"20px"}
      width={1}
      boxSizing={"border-box"}
    >
      {content}
    </Stack>
  );
};

export default CreateNewAccount;
