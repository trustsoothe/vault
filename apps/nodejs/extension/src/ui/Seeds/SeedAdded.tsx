import React from "react";
import Stack from "@mui/material/Stack";
import capitalize from "lodash/capitalize";
import { useNavigate } from "react-router-dom";
import { useFormContext } from "react-hook-form";
import Typography from "@mui/material/Typography";
import WarningActionBanner from "../components/WarningActionBanner";
import SuccessActionBanner from "../components/SuccessActionBanner";
import AvatarByString from "../components/AvatarByString";
import DialogButtons from "../components/DialogButtons";
import { SEEDS_PAGE } from "../../constants/routes";
import Summary from "../components/Summary";
import { themeColors } from "../theme";

interface SeedAddedProps {
  type: "created" | "imported" | "already_exists" | "renamed";
  onDone?: () => void;
  id?: string;
}

export default function SeedAdded({ type, onDone, id }: SeedAddedProps) {
  const navigate = useNavigate();
  const { watch } = useFormContext<{
    name: string;
    phraseSize: "12" | "15" | "18" | "21" | "24";
  }>();

  const [name, phraseSize] = watch(["name", "phraseSize"]);

  return (
    <Stack bgcolor={themeColors.white} height={1}>
      <Stack flexGrow={1} padding={2.4} spacing={1.6}>
        {type === "already_exists" ? (
          <WarningActionBanner label={"Seed Already Exists"} />
        ) : (
          <SuccessActionBanner label={`Seed ${capitalize(type)}`} />
        )}
        <Summary
          rows={[
            {
              type: "row",
              label: "Name",
              value: (
                <Stack
                  spacing={0.7}
                  direction={"row"}
                  alignItems={"center"}
                  justifyContent={"flex-end"}
                >
                  <AvatarByString string={id || name} type={"square"} />
                  <Typography variant={"subtitle2"}>{name}</Typography>
                </Stack>
              ),
            },
            {
              type: "row",
              label: "Seed Type",
              value: phraseSize,
            },
          ]}
        />
      </Stack>
      <DialogButtons
        containerProps={{
          sx: { height: 56 },
        }}
        primaryButtonProps={{
          children: type === "renamed" ? "Done" : "View Seeds",
          onClick: onDone || (() => navigate(SEEDS_PAGE)),
        }}
      />
    </Stack>
  );
}
