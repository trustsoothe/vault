import type { SerializedAccountReference } from "@poktscan/keyring";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { useForm } from "react-hook-form";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useCallback, useMemo, useState } from "react";
import CircularLoading from "../common/CircularLoading";
import AppToBackground from "../../controllers/communication/AppToBackground";
import OperationFailed from "../common/OperationFailed";

interface FormValues {
  account_name: string;
}

interface UpdateAccountProps {
  account: SerializedAccountReference;
  onClose: () => void;
}

const UpdateAccount: React.FC<UpdateAccountProps> = ({ account, onClose }) => {
  const { handleSubmit, register, formState } = useForm<FormValues>({
    defaultValues: {
      account_name: account.name,
    },
  });
  const [status, setStatus] = useState<
    "normal" | "loading" | "error" | "saved"
  >("normal");

  const onSubmit = useCallback(
    (data: FormValues) => {
      setStatus("loading");
      AppToBackground.updateAccount({
        id: account.id,
        name: data.account_name,
      }).then((result) => {
        const isError = !!result.error;
        setStatus(isError ? "error" : "saved");
      });
    },
    [account]
  );

  const content = useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    if (status === "error") {
      return (
        <OperationFailed
          text={"There was an error saving the account."}
          onCancel={onClose}
        />
      );
    }

    if (status === "saved") {
      return (
        <Stack
          flexGrow={1}
          alignItems={"center"}
          justifyContent={"center"}
          marginTop={"-40px"}
        >
          <Typography>Your account was saved successfully.</Typography>
          <Button sx={{ textTransform: "none" }} onClick={onClose}>
            Go to Account List
          </Button>
        </Stack>
      );
    }

    return (
      <>
        <Typography variant={"h6"}>Update Account</Typography>
        <TextField
          label={"Address"}
          value={account.address}
          size={"small"}
          fullWidth
        />
        <TextField
          autoFocus
          label={"Account Name"}
          size={"small"}
          fullWidth
          {...register("account_name", { required: "Required" })}
          error={!!formState?.errors?.account_name}
          helperText={formState?.errors?.account_name?.message}
        />
        <Stack direction={"row"} spacing={"20px"} width={1}>
          <Button
            variant={"outlined"}
            sx={{ textTransform: "none" }}
            fullWidth
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant={"contained"}
            sx={{ textTransform: "none", fontWeight: 600 }}
            fullWidth
            type={"submit"}
          >
            Save
          </Button>
        </Stack>
      </>
    );
  }, [onClose, register, account, formState]);

  return (
    <Stack
      component={"form"}
      flexGrow={1}
      alignItems={"center"}
      justifyContent={"center"}
      onSubmit={handleSubmit(onSubmit)}
      spacing={"15px"}
    >
      {content}
    </Stack>
  );
};

export default UpdateAccount;
