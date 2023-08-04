import type { SerializedAsset } from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import type { ExternalNewAccountRequest } from "../../types/communication";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { useForm } from "react-hook-form";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useNavigate, useLocation } from "react-router-dom";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import AutocompleteAsset from "./AutocompleteAsset";
import RequestFrom from "../common/RequestFrom";
import { getAssetByProtocol } from "../../utils";
import { useAppDispatch } from "../../hooks/redux";
import AppToBackground from "../../controllers/communication/AppToBackground";

interface FormValues {
  account_name: string;
  password: string;
  asset: SerializedAsset | null;
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

type FormStatus = "normal" | "loading" | "error" | "submitted";

interface CreateNewAccountProps {
  assets: RootState["vault"]["entities"]["assets"]["list"];
}

const CreateNewAccount: React.FC<CreateNewAccountProps> = ({ assets }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const currentRequest: ExternalNewAccountRequest = location?.state;

  const {
    register,
    formState,
    handleSubmit,
    getValues,
    control,
    setValue,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      account_name: "",
      password: "",
      asset: null,
    },
  });

  const asset = watch("asset");

  useEffect(() => {
    if (currentRequest?.protocol) {
      const asset = getAssetByProtocol(assets, currentRequest.protocol);

      if (asset) {
        setValue("asset", asset);
      }
    }
  }, [currentRequest]);

  const [status, setStatus] = useState<FormStatus>("normal");

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
          asset: data.asset,
          password: data.password,
        },
        request: currentRequest || null,
      });

      const isError = !!result.error;
      setStatus(isError ? "error" : "submitted");
    },
    [currentRequest, dispatch]
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
        <AutocompleteAsset
          control={control}
          disabled={!!currentRequest?.protocol && !!asset}
        />
        <TextField
          label={"Account Name"}
          size={"small"}
          fullWidth
          autoComplete={"off"}
          error={!!errors?.account_name}
          helperText={errors?.account_name?.message}
          {...register("account_name", nameRules)}
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

const mapStateToProps = (state: RootState) => ({
  assets: state.vault.entities.assets.list,
});

export default connect(mapStateToProps)(CreateNewAccount);
