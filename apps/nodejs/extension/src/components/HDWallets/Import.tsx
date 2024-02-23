import React, { useEffect, useState } from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import MenuItem from "@mui/material/MenuItem";
import { useNavigate } from "react-router-dom";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import FormControlLabel from "@mui/material/FormControlLabel";
import { SupportedProtocols } from "@poktscan/keyring";
import { nameRules } from "../Account/CreateModal";
import { useAppSelector } from "../../hooks/redux";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import { HD_WALLETS_PAGE } from "../../constants/routes";
import ProtocolSelector from "../common/ProtocolSelector";
import { selectedProtocolSelector } from "../../redux/selectors/network";

interface FormValues {
  hdWalletName: string;
  protocol: SupportedProtocols;
  wordList: Array<{ word: string }>;
  phraseSize: "12" | "15" | "18" | "21" | "24";
  sendNodesDerivation: boolean;
  password: string;
}

type Status = "form" | "error" | "loading" | "success";

const FormStep: React.FC = () => {
  const theme = useTheme();
  const { control, register, watch, setValue } = useFormContext<FormValues>();
  const [phraseSize, protocol] = watch(["phraseSize", "protocol"]);

  const pastePhrase = (
    event: React.ClipboardEvent<HTMLDivElement>,
    index: number
  ) => {
    const phrase: string = event.clipboardData.getData("Text");
    const words = phrase.split(" ");

    if ([12, 15, 18, 21, 24].includes(words.length)) {
      event.preventDefault();
      setValue("phraseSize", words.length.toString() as "12");

      // setTimeout is required here to update the state after the phraseSize has been updated
      setTimeout(() => {
        for (let i = 0; i < words.length; i++) {
          setValue(`wordList.${i}.word`, words[i]);
        }
      }, 0);
    } else {
      if (words.length > 1) {
        event.preventDefault();
        const phraseSizeNum = Number(phraseSize);

        for (let i = index; i < phraseSizeNum; i++) {
          const wordsIndex = i - index;
          const word = words[wordsIndex];

          if (word) setValue(`wordList.${i}.word`, word);
        }
      }
    }
  };

  return (
    <>
      <Stack
        direction={"row"}
        alignItems={"center"}
        spacing={1}
        marginBottom={1.5}
      >
        <Controller
          control={control}
          name={"hdWalletName"}
          rules={nameRules}
          render={({ field, fieldState: { error } }) => (
            <TextField
              label={"HD Wallet Name"}
              required
              autoComplete={"off"}
              fullWidth
              autoFocus
              {...field}
              error={!!error?.message}
              helperText={error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name={"phraseSize"}
          render={({ field }) => (
            <TextField
              label={"Phrase Size"}
              select
              sx={{
                minWidth: 100,
                "& .MuiSelect-icon": { top: 4 },
              }}
              {...field}
              InputLabelProps={{
                shrink: !!field.value,
              }}
            >
              <MenuItem value={"12"}>12</MenuItem>
              <MenuItem value={"15"}>15</MenuItem>
              <MenuItem value={"18"}>18</MenuItem>
              <MenuItem value={"21"}>21</MenuItem>
              <MenuItem value={"24"}>24</MenuItem>
            </TextField>
          )}
        />
      </Stack>
      <Controller
        control={control}
        name={"protocol"}
        render={({ field }) => {
          return (
            <ProtocolSelector
              {...field}
              fullWidth
              sx={{
                "& .MuiFormHelperText-root": {
                  left: 5,
                  bottom: -18,
                },
              }}
              helperText={`You'll be able to use this wallet for every network of the protocol selected`}
              InputLabelProps={{ shrink: !!field.value }}
            />
          );
        }}
      />
      <Typography marginTop={2}>Recovery Phrase</Typography>

      <Controller
        control={control}
        name={"wordList"}
        rules={{
          validate: (value) => {
            if (!value.every((value) => !!value.word)) return true;

            // todo: call validatePhrase
            return true || "Invalid recovery phrase";
          },
        }}
        render={({ field: { value: fields } }) => {
          return (
            <>
              <Stack
                border={`1px solid ${theme.customColors.dark25}`}
                borderRadius={"4px"}
                display={"grid"}
                paddingY={0.7}
                paddingRight={0.7}
                paddingLeft={0.5}
                rowGap={0.6}
                columnGap={0.6}
                marginTop={0.5}
                marginBottom={["24", "21"].includes(phraseSize) ? 0.1 : 0.5}
                gridTemplateColumns={"repeat(4, 1fr)"}
                gridTemplateRows={`repeat(${Math.ceil(
                  Number(phraseSize) / 4
                )}, 28px)`}
              >
                {fields.map((field, index) => {
                  return (
                    <Stack key={index} direction={"row"} alignItems={"center"}>
                      <Typography
                        fontSize={11}
                        width={13}
                        minWidth={13}
                        textAlign={"right"}
                        paddingRight={0.3}
                      >
                        {index + 1}.
                      </Typography>
                      <Controller
                        control={control}
                        rules={{
                          required: "Required",
                        }}
                        //@ts-ignore
                        name={`wordList.${index}.word`}
                        render={({ field, fieldState: { error } }) => (
                          <Stack
                            sx={{
                              height: 22,
                              border: `1px solid ${theme.customColors.dark25}`,
                              borderRadius: "3px",
                            }}
                          >
                            <TextField
                              variant={"standard"}
                              required={true}
                              autoComplete={"off"}
                              sx={{
                                height: 22,
                                minWidth: 0,
                                flexGrow: 1,
                                "& .MuiInputBase-root": {
                                  height: 22,
                                },
                                "& input": {
                                  marginX: "-5px!important",
                                  fontSize: "11px!important",
                                },
                              }}
                              autoFocus={index === 0}
                              error={!!error?.message}
                              onPaste={(event) => pastePhrase(event, index)}
                              {...field}
                            />
                          </Stack>
                        )}
                      />
                    </Stack>
                  );
                })}
              </Stack>
              <Typography
                fontSize={10}
                color={theme.customColors.dark75}
                marginBottom={1.3}
              >
                You can paste your phrase in any field.
              </Typography>
            </>
          );
        }}
      />
      <TextField
        label={"Optional Password"}
        fullWidth
        type={"password"}
        {...register("password")}
      />
      {protocol === SupportedProtocols.Pocket && (
        <Controller
          control={control}
          name={"sendNodesDerivation"}
          render={({ field, fieldState: { error } }) => (
            <FormControlLabel
              control={<Checkbox {...field} checked={field.value} />}
              label="Use Send Nodes Derivation"
              sx={{
                marginLeft: 0,
                marginTop: 0.7,
                "& .MuiButtonBase-root": {
                  padding: 0,
                  transform: "scale(0.9)",
                },

                "& .MuiTypography-root": {
                  marginLeft: 0.7,
                  fontSize: 12,
                  color: !!error?.message
                    ? theme.customColors.red100
                    : undefined,
                },
              }}
            />
          )}
        />
      )}
    </>
  );
};

const SuccessStep = () => {
  return (
    <Stack
      alignItems={"center"}
      justifyContent={"center"}
      flexGrow={1}
      paddingBottom={5}
    >
      <CheckBoxIcon sx={{ color: "#019587", fontSize: 150 }} />
      <Typography fontSize={14}>
        Your HD wallet have been imported successfully!
      </Typography>
    </Stack>
  );
};

const ImportHdWallet: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("form");
  const [accountId, setAccountId] = useState("");
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const methods = useForm<FormValues>({
    defaultValues: {
      hdWalletName: "",
      password: "",
      phraseSize: "12",
      wordList: new Array(12).fill(null).map(() => ({ word: "" })),
      protocol: selectedProtocol,
      sendNodesDerivation: false,
    },
  });
  const { watch, setValue, handleSubmit } = methods;
  const [phraseSize] = watch(["phraseSize"]);

  useEffect(() => {
    setValue(
      "wordList",
      new Array(Number(phraseSize)).fill(null).map(() => ({ word: "" }))
    );
  }, [phraseSize]);

  const onSubmit = (data: FormValues) => {
    setStatus("loading");
    setTimeout(() => {
      setStatus(data.phraseSize === "18" ? "error" : "success");
      setAccountId("HD Wallet 1");
    }, 500);
  };

  const goToMyWallet = () => {
    if (accountId) {
      navigate(`${HD_WALLETS_PAGE}?account=${accountId}`);
    }
  };

  const onCancel = () => {
    navigate(HD_WALLETS_PAGE);
  };

  const getContent = () => {
    let content: React.ReactNode;

    switch (status) {
      case "form":
        content = <FormStep />;
        break;
      case "loading":
        content = <CircularLoading />;
        break;
      case "error":
        content = (
          <OperationFailed
            text={"There was an error importing your HD wallet"}
            onCancel={onCancel}
          />
        );
        break;

      case "success":
        content = <SuccessStep />;
        break;
    }

    return content;
  };

  return (
    <Stack
      height={1}
      paddingTop={1.5}
      justifyContent={"space-between"}
      component={"form"}
      onSubmit={handleSubmit(onSubmit)}
    >
      <Stack flexGrow={1}>
        <FormProvider {...methods}>{getContent()}</FormProvider>
      </Stack>
      {!(["error", "loading"] as Array<Status>).includes(status) && (
        <Stack direction={"row"} spacing={2} width={1}>
          {status === "form" && (
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
          )}
          <Button
            sx={{
              fontWeight: 700,
              height: 36,
              fontSize: 16,
            }}
            variant={"contained"}
            fullWidth
            onClick={status === "success" ? goToMyWallet : undefined}
            type={status === "success" ? "button" : "submit"}
          >
            {status === "form" ? "Import" : "Go to my wallet"}
          </Button>
        </Stack>
      )}
    </Stack>
  );
};

export default ImportHdWallet;
