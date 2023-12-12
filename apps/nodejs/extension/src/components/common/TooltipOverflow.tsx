import type {
  BoxProps,
  LinkProps,
  SxProps,
  TooltipProps,
  TypographyProps,
} from "@mui/material";
import type { Theme } from "@mui/material";
import React, {
  CSSProperties,
  type ReactNode,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import omit from "lodash/omit";
import { useTheme } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Tooltip from "@mui/material/Tooltip";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";

interface SkeletonRowProps {
  sxSkeleton?: SxProps;
}

export const SkeletonRow: React.FC<SkeletonRowProps> = ({ sxSkeleton }) => {
  return (
    <Box
      display={"flex"}
      paddingLeft={1}
      justifyContent={"center"}
      alignItems={"center"}
      width={"100%"}
      height={"40%"}
    >
      <Skeleton
        sx={{
          width: "100%",
          height: "100%",
          ...sxSkeleton,
        }}
      />
    </Box>
  );
};

export interface TextRowProps {
  lightColor?: string;
  showTextOverflowTooltip?: boolean;
  showSkeleton?: boolean;
  /* Parent node used by the popper in order to know the limits that cannot be overpassed. */
  boundaryRef?: ReactNode;
  enableTextCopy?: boolean;
  sxSkeleton?: SxProps;
  sxText?: SxProps;
  containerProps?: BoxProps;
  textProps?: TypographyProps;
  tooltipProps?: Omit<TooltipProps, "title" | "children">;
  linkProps?: LinkProps;
  preformattedText?: boolean;
  preformattedTextStyles?: CSSProperties;
  breakText?: boolean;
  tooltipOverModal?: boolean;
  tooltipText?: string;
  forceShowTooltip?: boolean;
  stopClickPropagation?: boolean;
  tooltipSxProps?: SxProps;
}

interface BaseTextRowProps extends TextRowProps {
  text: string;
  children?: React.ReactNode;
}

const TooltipOverflow: React.FC<BaseTextRowProps> = (props) => {
  const theme: Theme = useTheme();
  const {
    text,
    children,
    lightColor = theme.customColors.dark100,
    showTextOverflowTooltip = true,
    showSkeleton,
    sxSkeleton,
    boundaryRef,
    enableTextCopy = true,
    tooltipProps,
    textProps,
    containerProps,
    preformattedText,
    breakText = false,
    linkProps,
    tooltipOverModal = true,
    tooltipText,
    forceShowTooltip = false,
    stopClickPropagation = true,
    tooltipSxProps,
  } = props;
  const [openTooltip, setOpenTooltip] = useState<boolean>(false);
  const [isTextOverflowed, setIsTextOverflowed] = useState<boolean>(false);
  const [tooltipContent, setTooltipContent] = useState<string>("");

  const textRef = useCallback((node: HTMLParagraphElement) => {
    if (node) {
      setIsTextOverflowed(node.scrollWidth + 1 > node.clientWidth);
    }
  }, []);

  const toggleOpenTooltip = useCallback(
    (
      e: React.MouseEvent<HTMLSpanElement> | SyntheticEvent,
      content: string
    ) => {
      setTooltipContent(content);
      if (stopClickPropagation) {
        e.stopPropagation();
      }
      setOpenTooltip((value) => !value);
    },
    []
  );
  const handleCopyTooltip = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      toggleOpenTooltip(e, "Copied");
      navigator.clipboard.writeText(text);
      setTimeout(() => {
        setOpenTooltip(false);
      }, 600);
    },
    [text, toggleOpenTooltip]
  );
  const onMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      toggleOpenTooltip(e, tooltipText ?? text);
    },
    [tooltipText, text, toggleOpenTooltip]
  );
  const onMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      toggleOpenTooltip(e, "");
    },
    [toggleOpenTooltip]
  );
  const popperProps = useMemo(() => {
    return (showTextOverflowTooltip && isTextOverflowed) || forceShowTooltip
      ? ({
          sx: {
            "&[data-popper-reference-hidden]": {
              visibility: "hidden",
              pointerEvents: "none",
            },
            zIndex: !tooltipOverModal ? theme.zIndex.modal - 1 : "none",
          },
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, -10],
              },
            },
            {
              name: "flip",
              enabled: true,
              options: {
                rootBoundary: "viewport",
                padding: 2,
                boundary: boundaryRef ?? "clippingParents",
              },
            },
            {
              name: "preventOverflow",
              enabled: true,
              options: {
                altAxis: true,
                altBoundary: false,
                rootBoundary: "viewport",
                padding: 8,
              },
            },
          ],
        } as never)
      : {};
  }, [
    boundaryRef,
    theme,
    showTextOverflowTooltip,
    isTextOverflowed,
    tooltipOverModal,
    forceShowTooltip,
  ]);

  const skeletonRow = useMemo(
    () => <SkeletonRow sxSkeleton={sxSkeleton} />,
    [sxSkeleton]
  );

  const preformattedTextStyles: CSSProperties = useMemo(
    () => ({
      fontSize: theme.typography.h6.fontSize,
      fontFamily: theme.typography.fontFamily,
      fontWeight: 400,
      color: theme.customColors.dark100,
      ...props.preformattedTextStyles,
    }),
    [theme, props.preformattedTextStyles]
  );

  const disableTooltipListeners = useMemo(
    () => (!showTextOverflowTooltip || !isTextOverflowed) && !forceShowTooltip,
    [isTextOverflowed, forceShowTooltip, showTextOverflowTooltip]
  );

  const textRow = useMemo(
    () => (
      <Tooltip
        open={openTooltip}
        onOpen={onMouseEnter}
        onClose={onMouseLeave}
        disableFocusListener={disableTooltipListeners}
        disableTouchListener={disableTooltipListeners}
        disableHoverListener={disableTooltipListeners}
        enterDelay={500}
        enterNextDelay={500}
        title={
          preformattedText ? (
            <pre style={{ ...preformattedTextStyles }}>{tooltipContent}</pre>
          ) : (
            tooltipContent
          )
        }
        placement={"top"}
        componentsProps={{
          tooltip: {
            sx: {
              maxWidth: 350,
              whiteSpace: "normal",
              margin: 0,
              ...tooltipSxProps,
            },
          },
          popper: popperProps,
        }}
        {...tooltipProps}
      >
        <Box
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          {...containerProps}
        >
          <Typography
            ref={textRef}
            noWrap={!breakText}
            fontWeight={300}
            fontSize={{
              xs: theme.typography.h6.fontSize,
              sm: theme.typography.h5.fontSize,
            }}
            color={lightColor}
            onClick={
              enableTextCopy
                ? handleCopyTooltip
                : isTextOverflowed
                ? onMouseEnter
                : undefined
            }
            maxWidth={textProps?.maxWidth ?? "100%"}
            sx={{
              ...(breakText && {
                wordWrap: "break-word",
              }),
              ...textProps?.sx,
            }}
            {...omit(textProps, ["sx"])}
          >
            <Link
              color={"inherit"}
              underline={"none"}
              lineHeight={"12px"}
              {...linkProps}
            >
              {children || text}
            </Link>
          </Typography>
        </Box>
      </Tooltip>
    ),
    [
      text,
      children,
      openTooltip,
      showSkeleton,
      theme,
      tooltipContent,
      isTextOverflowed,
      preformattedText,
      handleCopyTooltip,
      enableTextCopy,
      onMouseEnter,
      onMouseLeave,
      breakText,
      containerProps,
      linkProps,
      popperProps,
      preformattedTextStyles,
      textProps,
      tooltipProps,
      disableTooltipListeners,
      tooltipSxProps,
    ]
  );

  return showSkeleton ? skeletonRow : textRow;
};

export default TooltipOverflow;
