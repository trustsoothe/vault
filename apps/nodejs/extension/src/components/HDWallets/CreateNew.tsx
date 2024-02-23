import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import React, { useEffect, useState } from "react";
import {
  Controller,
  useForm,
  useFormContext,
  FormProvider,
  useFieldArray,
} from "react-hook-form";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Checkbox from "@mui/material/Checkbox";
import { useNavigate } from "react-router-dom";
import Typography from "@mui/material/Typography";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import FormControlLabel from "@mui/material/FormControlLabel";
import { SupportedProtocols } from "@poktscan/keyring";
import { nameRules } from "../Account/CreateModal";
import { useAppSelector } from "../../hooks/redux";
import CopyIcon from "../../assets/img/copy_icon.svg";
import OperationFailed from "../common/OperationFailed";
import CircularLoading from "../common/CircularLoading";
import { HD_WALLETS_PAGE } from "../../constants/routes";
import ProtocolSelector from "../common/ProtocolSelector";
import { selectedProtocolSelector } from "../../redux/selectors/network";

interface FormValues {
  hdWalletName: string;
  protocol: SupportedProtocols;
  password?: string;
  phrase: string;
  phraseSize: "12" | "15" | "18" | "21" | "24";
  requiredWords: Array<number>;
  wordsConfirmation: Array<{ word: string }>;
  understandPhraseWarning: boolean;
}

const words =
  "spare catalog squeeze evoke rice jungle demise chat solve garage basic donor biology release salmon nature empty note lift equip cricket bullet logic fragile".split(
    " "
  );

const FormStep: React.FC = () => {
  const theme = useTheme();
  const { register, control, watch, handleSubmit, setValue } =
    useFormContext<FormValues>();

  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const [phraseSize, phrase] = watch(["phraseSize", "phrase"]);

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
      <Stack
        direction={"row"}
        alignItems={"center"}
        marginTop={3}
        spacing={0.6}
        marginBottom={0.8}
      >
        <Typography>Recovery Phrase</Typography>
        <Tooltip
          title={"Copied"}
          open={showCopyTooltip}
          placement={"top"}
          arrow
        >
          <Button
            variant={"text"}
            sx={{
              height: 24,
              paddingLeft: 0,
              paddingRight: 0.4,
              fontSize: 12,
              "& svg": {
                transform: "scale(0.8)",
                marginRight: 0.2,
              },
            }}
            onClick={() => {
              navigator.clipboard.writeText(phrase).then(() => {
                setShowCopyTooltip(true);
                setTimeout(() => setShowCopyTooltip(false), 1000);
              });
            }}
          >
            <CopyIcon />
            <span>Copy to clipboard</span>
          </Button>
        </Tooltip>
      </Stack>

      <Stack
        border={`1px solid ${theme.customColors.dark25}`}
        borderRadius={"4px"}
        display={"grid"}
        padding={0.7}
        rowGap={0.6}
        columnGap={0.6}
        marginBottom={1.5}
        gridTemplateColumns={"repeat(4, 1fr)"}
        gridTemplateRows={`repeat(${Math.ceil(Number(phraseSize) / 4)}, 28px)`}
      >
        {phrase.split(" ").map((word, index) => {
          return (
            <Stack
              key={index}
              direction={"row"}
              alignItems={"center"}
              height={22}
            >
              <Typography
                fontSize={11}
                width={14}
                textAlign={"right"}
                paddingRight={0.3}
              >
                {index + 1}.
              </Typography>
              <Typography
                fontSize={11}
                flexGrow={1}
                lineHeight={"20px"}
                minWidth={0}
                sx={{
                  height: 20,
                  paddingLeft: 0.7,
                  border: `1px solid ${theme.customColors.dark15}`,
                  borderRadius: "3px",
                }}
              >
                {word}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
      <TextField
        label={"Optional Password"}
        fullWidth
        type={"password"}
        {...register("password")}
      />
    </>
  );
};

const ConfirmationStep: React.FC = () => {
  const theme = useTheme();
  const {
    watch,
    control,
    formState: { errors },
  } = useFormContext<FormValues>();
  const [requiredWords, wordsConfirmation, phraseSize] = watch([
    "requiredWords",
    "wordsConfirmation",
    "phraseSize",
  ]);

  const firstInputIndex = Math.min(...requiredWords);
  const wordsConfirmationError = errors?.wordsConfirmation?.message;

  return (
    <>
      <Typography fontSize={16}>Complete the Recovery Phrase</Typography>
      <Stack
        border={`1px solid ${theme.customColors.dark25}`}
        borderRadius={"4px"}
        display={"grid"}
        padding={0.7}
        rowGap={0.7}
        columnGap={0.7}
        marginY={0.5}
        gridTemplateColumns={"repeat(3, 1fr)"}
        gridTemplateRows={`repeat(${Number(phraseSize) / 3}, 30px)`}
      >
        <Controller
          control={control}
          name={"wordsConfirmation"}
          rules={{
            validate: (value, formValues) => {
              if (!formValues.requiredWords.every((i) => !!value[i].word))
                return true;

              return (
                value.map(({ word }) => word).join(" ") === formValues.phrase ||
                "Some of the words are wrong, please verify"
              );
            },
          }}
          render={({ field: { value: fields } }) => {
            return (
              <>
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
                        {" "}
                        {index + 1}.
                      </Typography>
                      {requiredWords.includes(index) ? (
                        <Controller
                          control={control}
                          rules={{
                            required: "Required",
                          }}
                          //@ts-ignore
                          name={`wordsConfirmation.${index}.word`}
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
                                autoFocus={index === firstInputIndex}
                                error={!!error?.message}
                                {...field}
                              />
                            </Stack>
                          )}
                        />
                      ) : (
                        <Typography
                          fontSize={12}
                          flexGrow={1}
                          lineHeight={"24px"}
                          minWidth={0}
                          sx={{
                            height: 24,
                            paddingLeft: 0.7,
                            border: `1px solid ${theme.customColors.dark25}`,
                            borderRadius: "3px",
                          }}
                        >
                          {field.word}
                        </Typography>
                      )}
                    </Stack>
                  );
                })}
              </>
            );
          }}
        />
      </Stack>
      <Typography
        fontSize={10}
        color={
          wordsConfirmationError
            ? theme.customColors.red100
            : theme.customColors.dark75
        }
        textAlign={wordsConfirmationError ? "left" : "center"}
        marginLeft={wordsConfirmation ? 0.5 : 0}
        fontWeight={wordsConfirmation ? 500 : 400}
      >
        {wordsConfirmationError
          ? wordsConfirmationError
          : "To validate that you have saved your recovery phrase, please enter the missing words"}
      </Typography>
      <Controller
        control={control}
        name={"understandPhraseWarning"}
        rules={{
          validate: (value) => {
            return value ? value : "Must be checked";
          },
        }}
        render={({ field, fieldState: { error } }) => (
          <FormControlLabel
            control={<Checkbox {...field} checked={field.value} />}
            required={!!error?.message}
            label="I understand Soothe can not recover this phrase for me."
            sx={{
              marginLeft: 0,
              marginTop: 1,
              "& .MuiButtonBase-root": {
                padding: 0,
                transform: "scale(0.9)",
              },

              "& .MuiTypography-root": {
                marginLeft: 0.7,
                fontSize: 12,
                color: !!error?.message ? theme.customColors.red100 : undefined,
              },
            }}
          />
        )}
      />
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
        Your HD wallet have been created successfully!
      </Typography>
    </Stack>
  );
};

type Status = "form" | "confirmation" | "error" | "loading" | "success";

const CreateNewHdWallet: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const methods = useForm<FormValues>({
    defaultValues: {
      hdWalletName: "",
      phraseSize: "12",
      password: "",
      phrase: words.slice(0, 12).join(" "),
      wordsConfirmation: [],
      requiredWords: [],
      understandPhraseWarning: false,
      protocol: selectedProtocol,
    },
  });
  const [accountId, setAccountId] = useState("");
  const { handleSubmit, setValue, watch } = methods;
  const [phraseSize] = watch(["phraseSize", "phrase"]);
  const [status, setStatus] = useState<Status>("form");

  useEffect(() => {
    const phraseSizeNum = Number(phraseSize);
    const newPhrase = words.slice(0, Number(phraseSizeNum)).join(" ");

    setValue("phrase", newPhrase);

    const amountOfRequiredWords = Math.ceil(phraseSizeNum * 0.25);

    const requiredWords = new Array(amountOfRequiredWords).fill(null);

    for (let i = 0; i < requiredWords.length; i++) {
      let indexRequired =
        Math.floor(Math.random() * (phraseSizeNum - 1) + 1) - 1;

      while (requiredWords.includes(indexRequired)) {
        indexRequired = Math.floor(Math.random() * (phraseSizeNum - 1) + 1) - 1;
      }

      requiredWords[i] = indexRequired;
    }

    const wordsToComplete = newPhrase
      .split(" ")
      .map((word, i) => ({ word: requiredWords.includes(i) ? "" : word }));

    console.log(wordsToComplete, requiredWords);

    setValue("wordsConfirmation", wordsToComplete);
    setValue("requiredWords", requiredWords);
  }, [phraseSize]);

  const onSubmit = (data: FormValues) => {
    if (status !== "form" && status !== "confirmation") return;

    if (status === "form") {
      setStatus("confirmation");
    } else if (status === "confirmation") {
      setStatus("success");
    }
    console.log(data);
  };

  const onCancel = () => {
    if (status === "confirmation") {
      setStatus("form");
    } else if (status === "form" || status === "error") {
      return navigate(HD_WALLETS_PAGE);
    }
  };

  const goToMyWallet = () => {
    if (accountId) {
      navigate(`${HD_WALLETS_PAGE}?account=${accountId}`);
    }
  };

  const getContent = () => {
    let component: React.ReactNode;

    switch (status) {
      case "form":
        component = <FormStep />;
        break;
      case "confirmation":
        component = <ConfirmationStep />;
        break;
      case "error":
        component = (
          <OperationFailed
            text={"The creation of the HD wallet failed"}
            onCancel={onCancel}
          />
        );
        break;
      case "loading":
        component = <CircularLoading />;
        break;
      case "success":
        component = <SuccessStep />;
        break;
    }

    return component;
  };

  return (
    <Stack
      height={1}
      paddingTop={2}
      justifyContent={"space-between"}
      component={"form"}
      onSubmit={handleSubmit(onSubmit)}
    >
      <Stack flexGrow={1}>
        <FormProvider {...methods}>{getContent()}</FormProvider>
      </Stack>
      {!(["error", "loading"] as Array<Status>).includes(status) && (
        <Stack direction={"row"} spacing={2} width={1}>
          {(["form", "confirmation"] as Array<Status>).includes(status) && (
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
              {status === "form" ? "Cancel" : "Back"}
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
            {status === "form"
              ? "Next"
              : status === "confirmation"
              ? "Create"
              : "Go to my wallet"}
          </Button>
        </Stack>
      )}
    </Stack>
  );
};

export default CreateNewHdWallet;
