import { Box, Typography } from "@mui/material";
import bgImage from "assets/background.jpg";

export const PrettyHeader = (props) => {
  const { text, image, height } = props;
  return (
    <div
      style={{
        backgroundImage: `url(${image || bgImage})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <Box
        className={"pretty-header"}
        sx={{
          display: "flex",
          flexDirection: "column",
          mt: -2,
          justifyContent: "center",
          alignItems: "center",
        }}
        style={{ height: height, width: "100%", background: "rgba(0,0,0,0.5)" }}
      >
        {!!text && (
          <Typography variant="h2" align="center" sx={{ mb: 2 }}>
            <span className="pretty-header-header">{text}</span>
          </Typography>
        )}
      </Box>
    </div>
  );
};
