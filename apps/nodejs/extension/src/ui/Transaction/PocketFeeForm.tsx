import React, {ChangeEvent, useCallback, useEffect, useMemo, useState} from 'react';
import Stack from "@mui/material/Stack";
import {ButtonGroup, Collapse, ToggleButton, ToggleButtonGroup} from "@mui/material";
import Typography from "@mui/material/Typography";
import Switch from "@mui/material/Switch";
import {useFormContext} from "react-hook-form";
import type {TransactionFormValues} from "./BaseTransaction";
import ControlledNumberInput from "./ControlledNumberInput";
import {useAppSelector} from "../hooks/redux";
import {selectNetworkByProtocolAndChain} from "../../redux/selectors/network";
import PocketFeeLabel, {PocketFeeLabelProps} from "./PocketFeeLabel";
import PocketGasLabel from "./PocketGasLabel";
import {PocketFeePreset} from "../../redux/slices/app";

export interface PocketFeeFormProps {
  feeLabelProps?: PocketFeeLabelProps;
}

function RowStack ({children}: {children: React.ReactNode}) {
  return (
    <Stack
      spacing={1}
      direction={"row"}
      alignItems={"center"}
      justifyContent={"space-between"}
    >
      {children}
    </Stack>
  );
}

export default function PocketFeeForm({ feeLabelProps }: Readonly<PocketFeeFormProps>) {
  const CUSTOM_FEE_PRESET = 'custom';
  const { watch, setValue, control } = useFormContext<TransactionFormValues>();

  const [gasAuto, protocol, chainId, pocketFeePreset] = watch([
    "pocketGasAuto",
    "protocol",
    "chainId",
    "pocketFeePreset",
  ]);

  const network = useAppSelector(selectNetworkByProtocolAndChain(protocol, chainId));

  const presets = useMemo(() => {
    return network.pocketFeePresets ?? [];
  }, [network]);

  const [feePreset, setFeePreset] = useState(pocketFeePreset ?? presets[0].id);

  const handleGasAutoChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setValue("pocketGasAuto", event.target.checked);
  }, [setValue]);

  useEffect(() => {
    if (gasAuto) {
      setValue('pocketGasInput', null);
      setValue('pocketGasAdjustment', null);
    } else {
      setValue('pocketGasAdjustment', 1);
    }
  }, [gasAuto]);

  useEffect(() => {
    setValue('pocketFeePreset', feePreset);
  }, [feePreset]);

  useEffect(() => {
    if (feePreset === CUSTOM_FEE_PRESET) {
      // TODO: Determine what to do here. Probably nothing.
      return;
    }

    const preset = presets.find((preset) => preset.id === feePreset);

    if (!preset) {
      console.warn(`Preset ${feePreset} not found`);
      return;
    }

    setValue("pocketGasAuto", preset.gasUsed === 'auto');
    setValue('pocketGasPrice', preset.gasPrice);
    setValue('pocketGasAdjustment', preset.gasAdjustment);
  }, [feePreset]);

  return (
    <Stack direction="column" spacing={1} marginTop={1}>
      <PocketFeeLabel {...feeLabelProps} />
      <PocketGasLabel />
      <ToggleButtonGroup
        value={feePreset}
        fullWidth={true}
        exclusive
        onChange={(event, newValue) => setFeePreset(newValue)}
        size={'small'}
        >
        {presets.map((preset) => (
          <ToggleButton key={preset.id} value={preset.id}>
            {preset.name}
          </ToggleButton>
        ))}
        <ToggleButton key={'preset-custom'} value={CUSTOM_FEE_PRESET}>
          Custom
        </ToggleButton>
      </ToggleButtonGroup>
      <Collapse in={feePreset === CUSTOM_FEE_PRESET} timeout="auto" unmountOnExit>
        <Stack direction="column" spacing={1}>
          <RowStack>
            <Typography
              fontSize={10}
              >
              Estimate Gas Automatically
            </Typography>
            <Switch
              checked={gasAuto}
              size={"small"}
              onChange={handleGasAutoChange}
            />
          </RowStack>
          <RowStack>
            {gasAuto && (
              <Typography fontSize={10}>
                Fee = Gas Price × (Gas Estimate × Adjustment)
              </Typography>
            )}
            {!gasAuto && (
              <Typography fontSize={10}>
                Fee = Gas Price × Gas
              </Typography>
            )}

          </RowStack>
          <RowStack>
            <ControlledNumberInput
              name="pocketGasPrice"
              control={control}
              minValue={0.001}
              size={"small"}
              placeholder={`${network.defaultGasPrice}uPOKT`}
              rules={{
                min: {
                  value: 0.001,
                  message: "The minimum gas price 0.001"
                }
              }}
            />
            {!gasAuto && (
              <ControlledNumberInput
                name="pocketGasInput"
                control={control}
                minValue={1}
                size={"small"}
                placeholder={`Gas (${network.defaultGasEstimation})`}
                rules={{
                  min: {
                    value: 1,
                    message: "The minimum gas estimate is 1 unit"
                  }
                }}
              />
            )}
            {gasAuto && (
              <ControlledNumberInput
                name="pocketGasAdjustment"
                control={control}
                size={"small"}
                minValue={1}
                step={0.1}
                placeholder={`Adj. (${network?.defaultGasAdjustment})`}
                rules={{
                  min: {
                    value: 1,
                    message: "The minimum gas adjustment is 1"
                  }
                }}
              />
            )}
          </RowStack>
        </Stack>
      </Collapse>
    </Stack>
  );
}
