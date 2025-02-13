import { isInt } from "web3-validator";
import Stack from "@mui/material/Stack";
import React, { useEffect } from "react";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { SupportedProtocols } from "@soothe/vault";
import RecipientAutocomplete from "../../Transaction/RecipientAutocomplete";
import { AccountInfoFromAddress } from "../../components/AccountInfo";
import { isValidAddress } from "../../../utils/networkOperations";
import PoktFeeLabel from "../../Transaction/PoktFeeLabel";
import BalanceLabel from "../../Transaction/BalanceLabel";
import AmountInput from "../../Transaction/AmountInput";
import useGetAllParams from "../useGetAllParams";
import ServiceUrlInput from "./ServiceUrlInput";
import ChainsSelector from "../ChainsSelector";
import { themeColors } from "../../theme";
import useGetNode from "../useGetNode";
import MemoInput from "../MemoInput";

export default function StakeNodeForm() {
  const { watch, setValue, getValues, control } = useFormContext();
  const [chainId, nodePublicKey, fromAddress] = watch([
    "chainId",
    "nodePublicKey",
    "fromAddress",
  ]);
  const { allParams: params } = useGetAllParams(chainId);
  const { node, isSuccess } = useGetNode(nodePublicKey, chainId);

  useEffect(() => {
    if (node) {
      if (getValues("chains").length === 0) {
        setValue("chains", node.chains);
      }

      if (!getValues("serviceURL")) {
        setValue("serviceURL", node.service_url);
      }

      if (!getValues("amount")) {
        setValue("amount", (Number(node.tokens) / 1e6).toString());
      }

      if (node.reward_delegators && getValues("rewardDelegators").length <= 1) {
        const rewardDelegators = Object.entries(node.reward_delegators).map(
          ([key, value]) => ({
            address: key,
            amount: value.toString(),
            type: "added",
          })
        );

        rewardDelegators.unshift({ address: "", amount: "", type: "adding" });

        setValue("rewardDelegators", rewardDelegators);
      }
    }
  }, [node]);

  const nodeTokens = node?.tokens ? Number(node.tokens) / 1e6 : 0;
  const minStakeAmount =
    nodeTokens ||
    Number(
      params?.node_params?.find(
        (param) => param.param_key === "pos/StakeMinimum"
      )?.param_value || 0
    ) / 1e6;

  return (
    <>
      <RecipientAutocomplete
        marginTop={0}
        label={"Node Public Key"}
        canSelectContact={false}
        acceptPublicKey={true}
        canSelectFrom={true}
        fieldName={"nodePublicKey"}
        shouldBeDifferentFrom={false}
      />
      <AmountInput
        marginTop={1.4}
        label={"Stake Amount"}
        minAmount={minStakeAmount}
        amountToReduce={nodeTokens}
        amountToSumOnMax={nodeTokens}
        disableInput={!nodePublicKey || !isSuccess}
      />
      <BalanceLabel marginTop={0.4} />
      <PoktFeeLabel marginTop={0.4} />
      <ChainsSelector type={"node"} />
      <ServiceUrlInput marginTop={1.4} />
      <MemoInput />
      {node && node.output_address === fromAddress && (
        <>
          <Divider sx={{ marginTop: 1, marginBottom: 1.2 }} />

          <Controller
            control={control}
            name={"changeOutputAddress"}
            render={({ field }) => (
              <>
                <Stack
                  width={1}
                  height={21}
                  direction={"row"}
                  alignItems={"center"}
                  justifyContent={"space-between"}
                >
                  <Typography variant={"subtitle2"} fontSize={12}>
                    Change Output Address?
                  </Typography>
                  <Switch size={"small"} {...field} checked={field.value} />
                </Stack>

                {field.value && (
                  <>
                    <RecipientAutocomplete
                      label={"Output Address"}
                      fieldName={"outputAddress"}
                      marginTop={0.8}
                    />
                    <Typography
                      fontSize={10}
                      marginTop={0.5}
                      lineHeight={"16px"}
                    >
                      If you change the output address, you will lose control of
                      the node, its rewards and its staked tokens.
                    </Typography>
                  </>
                )}
              </>
            )}
          />
        </>
      )}
    </>
  );
}

interface RewardDelegatorItem {
  address: string;
  amount: string;
  type: "added" | "adding";
}

export function RewardDelegatorsForm() {
  const { control, watch, clearErrors, getFieldState, setError, getValues } =
    useFormContext<{
      rewardDelegators: Array<RewardDelegatorItem>;
    }>();

  const { fields, replace, remove } = useFieldArray({
    control,
    name: "rewardDelegators",
  });

  const itemToAdd = watch("rewardDelegators.0");

  useEffect(() => {
    const { error: errorAddress } = getFieldState("rewardDelegators.0.address");

    if (errorAddress) {
      clearErrors("rewardDelegators.0.address");
    }
  }, [itemToAdd?.address]);

  useEffect(() => {
    const { error: errorAmount } = getFieldState("rewardDelegators.0.amount");

    if (errorAmount) {
      clearErrors("rewardDelegators.0.amount");
    }
  }, [itemToAdd?.amount]);

  const submitAddDelegatorForm = async () => {
    const items = getValues("rewardDelegators");

    if (items.length) {
      const itemToAdd = items.at(0);
      let error = false;

      if (!itemToAdd.address) {
        setError("rewardDelegators.0.address", {
          message: "Required",
        });
        error = true;
      } else if (
        !isValidAddress(itemToAdd.address, SupportedProtocols.Pocket)
      ) {
        setError("rewardDelegators.0.address", {
          message: "Invalid address",
        });
        error = true;
      } else if (
        items.slice(1).some((item) => item.address === itemToAdd.address)
      ) {
        setError("rewardDelegators.0.address", {
          message: "Delegator already added",
        });
        error = true;
      }

      if (!itemToAdd.amount) {
        setError("rewardDelegators.0.amount", {
          message: "Required",
        });
        error = true;
      } else if (Number(itemToAdd.amount) < 1) {
        setError("rewardDelegators.0.amount", {
          message: "Min is 1",
        });
        error = true;
      } else if (Number(itemToAdd.amount) > 100) {
        setError("rewardDelegators.0.amount", {
          message: "Max is 100",
        });
        error = true;
      } else if (!isInt(Number(itemToAdd.amount))) {
        setError("rewardDelegators.0.amount", {
          message: "Only integers allowed",
        });
        error = true;
      }

      if (error) return;

      const newFields: Array<RewardDelegatorItem> = items.map((item) => ({
        address: item.address,
        amount: item.amount,
        type: "added",
      }));

      newFields.unshift({ address: "", amount: "", type: "adding" });

      replace(newFields);
    }
  };

  return (
    <>
      <Controller
        control={control}
        name={"rewardDelegators"}
        rules={{
          validate: (value) => {
            if (value?.length < 2) return true;

            const sum = value
              .slice(1)
              .reduce((acc, item) => acc + Number(item.amount), 0);

            if (sum > 100) return "Total amount should be less than 100%";

            return true;
          },
        }}
        render={({ fieldState: { error } }) => {
          return (
            <>
              <Typography variant={"subtitle2"}>Reward Delegators</Typography>
              {fields[0] && (
                <>
                  <Stack
                    key={fields[0].id}
                    width={1}
                    direction={"row"}
                    alignItems={"center"}
                    spacing={1.2}
                    sx={{
                      marginTop: 1,
                      "& .MuiAutocomplete-root": {
                        width: 1,
                      },
                      "& .MuiFormHelperText-root": {
                        fontSize: 10,
                        margin: 0,
                        marginLeft: 0.5,
                        whiteSpace: "nowrap",
                      },
                    }}
                  >
                    <RecipientAutocomplete
                      label={"Delegator Address"}
                      smallPasteButton={true}
                      required={false}
                      fieldName={`rewardDelegators.0.address`}
                      customValidation={(value) => {
                        const alreadyAdded = fields.find(
                          (item) => item.address === value
                        );

                        if (alreadyAdded) {
                          return "Delegator already added";
                        }

                        return true;
                      }}
                    />
                    <Controller
                      control={control}
                      name={`rewardDelegators.0.amount`}
                      rules={{
                        min: {
                          value: 1,
                          message: "Min is 1",
                        },
                        max: {
                          value: 100,
                          message: "Max is 100",
                        },
                      }}
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          {...field}
                          placeholder={"0"}
                          InputProps={{
                            endAdornment: <Typography>%</Typography>,
                          }}
                          type={"number"}
                          error={!!error}
                          autoComplete={"off"}
                          helperText={error?.message}
                          inputProps={{
                            step: 1,
                          }}
                          sx={{
                            maxWidth: 50,
                            "& .MuiInputBase-root": {
                              paddingRight: 0.5,
                            },
                            "& input": {
                              paddingLeft: 1,
                              paddingRight: 0.3,
                              "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button":
                                {
                                  WebkitAppearance: "none",
                                  margin: 0,
                                },
                              MozAppearance: "textfield",
                            },
                          }}
                        />
                      )}
                    />
                    <Button
                      onClick={submitAddDelegatorForm}
                      variant={"contained"}
                      sx={{
                        minWidth: 0,
                        borderRadius: "5px",
                      }}
                    >
                      Add
                    </Button>
                  </Stack>
                </>
              )}
              {fields.length > 1 && (
                <>
                  <Divider sx={{ marginY: 1.5 }} />
                  <Stack spacing={1} overflow={"auto"} maxHeight={272}>
                    {fields.slice(1).map((item, index) => (
                      <Stack
                        key={item.id}
                        spacing={1.2}
                        direction={"row"}
                        alignItems={"center"}
                        bgcolor={themeColors.bgLightGray}
                        borderRadius={"8px"}
                        padding={1}
                      >
                        <Stack flexGrow={1} minWidth={0}>
                          <AccountInfoFromAddress
                            address={item.address}
                            protocol={SupportedProtocols.Pocket}
                          />
                        </Stack>

                        <Typography textAlign={"right"} width={50}>
                          {item.amount}%
                        </Typography>
                        <Stack
                          width={48}
                          alignItems={"center"}
                          justifyContent={"center"}
                          marginRight={"-4px!important"}
                        >
                          <IconButton
                            onClick={() => {
                              remove(index + 1);
                            }}
                            sx={{
                              width: 20,
                              height: 20,
                              padding: 0,
                              marginLeft: 0.8,
                            }}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                </>
              )}
              {error?.root && (
                <Typography
                  fontSize={11}
                  marginTop={0.8}
                  lineHeight={"16px"}
                  color={themeColors.red}
                >
                  {error.root.message}
                </Typography>
              )}
            </>
          );
        }}
      />
    </>
  );
}
