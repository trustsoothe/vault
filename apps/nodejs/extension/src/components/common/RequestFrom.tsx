import React from "react";
import Stack, { StackProps } from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface RequestFromProps {
  title?: string;
  description?: string;
  origin: string;
  faviconUrl: string;
  containerProps?: StackProps;
  containerMetaProps?: StackProps;
}

const RequestFrom: React.FC<RequestFromProps> = ({
  title,
  description,
  origin,
  faviconUrl,
  containerProps,
  containerMetaProps,
}) => {
  return (
    <Stack spacing={"5px"} {...containerProps}>
      {title && (
        <Typography fontSize={18} textAlign={"center"}>
          {title}
        </Typography>
      )}
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"center"}
        spacing={"10px"}
        width={1}
        {...containerMetaProps}
      >
        <img width={20} height={20} alt={"favicon-ico"} src={faviconUrl} />
        <Typography
          fontSize={16}
          fontWeight={500}
          textOverflow={"ellipsis"}
          whiteSpace={"nowrap"}
          overflow={"hidden"}
          maxWidth={300}
          sx={{ textDecoration: "underline" }}
        >
          {origin}
        </Typography>
      </Stack>
      {description && (
        <Typography fontSize={14} textAlign={"center"}>
          {description}
        </Typography>
      )}
    </Stack>
  );
};

export default RequestFrom;
