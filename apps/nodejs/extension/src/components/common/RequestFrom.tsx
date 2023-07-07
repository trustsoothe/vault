import React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface RequestFromProps {
  title: string;
  origin: string;
  faviconUrl: string;
}

const RequestFrom: React.FC<RequestFromProps> = ({
  title,
  origin,
  faviconUrl,
}) => {
  return (
    <Stack spacing={"10px"}>
      <Typography fontSize={20} textAlign={"center"}>
        {title}
      </Typography>
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"center"}
        spacing={"10px"}
        width={1}
      >
        <img width={24} height={24} alt={"favicon-ico"} src={faviconUrl} />
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
    </Stack>
  );
};

export default RequestFrom;
