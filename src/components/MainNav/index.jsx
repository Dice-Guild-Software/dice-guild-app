import { ExpandLess, ExpandMore, Map } from "@mui/icons-material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import ConstructionIcon from "@mui/icons-material/Construction";
import FeaturedPlayListIcon from "@mui/icons-material/FeaturedPlayList";
import MenuIcon from "@mui/icons-material/Menu";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Collapse,
  Drawer,
  ListItemButton,
  Menu,
  MenuItem,
} from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { alpha, styled, useTheme } from "@mui/material/styles";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import IGR from "assets/Dice_Guild_left.png";
import { Dropdown } from "components/dropdown";
import { DataContext, useModal } from "hooks";
import { get } from "lodash";
import Discord from "mdi-material-ui/Discord";
import Github from "mdi-material-ui/Github";
import CoffeeIcon from "mdi-material-ui/CoffeeOutline";
import React from "react";
import { useNavigate } from "react-router";
import { UserPreferences } from "routes/modals";
import { CHAPTERS } from "routes/Rules";
import { sortBy, uniq, groupBy } from "lodash";
import { DataAPI } from "utils/data";

const drawerWidth = 250;

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: "100%",
  // marginLeft: theme.spacing(3),
  // width: 'auto',
  // [theme.breakpoints.up('sm')]: {

  // },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: "20ch",
    },
  },
}));

export const MainNav = (props) => {
  const [searchMode, setSearchMode] = React.useState(false);
  const [{ data: nope, userPrefs, setUserPrefs, appState, setAppState }] =
    React.useContext(DataContext);
  const game = get(nope, `gameData`, {});
  const data = DataAPI(game, {});
  const showBeta = userPrefs.showBeta;
  const { contextActions } = appState;
  const navigate = useNavigate();
  const factions = data
    .getFactions()
    .filter((game) =>
      showBeta ? true : game.version && Number(game.version) >= 1
    );
  const alliances = data.getRawAlliances();
  const unitCategories = groupBy(factions, "alliance");
  const categoryOrder = uniq(
    Object.keys(alliances).filter(
      (cat) => unitCategories[cat] && unitCategories[cat].length
    )
  );
  const navItems = [
    {
      id: "rules",
      name: "Core Rules",
      icon: <MenuBookIcon />,
      to: "/rules",
      children: [
        ...Object.keys(CHAPTERS).map((key, index) => ({
          id: key,
          name: `${index + 1}. ${CHAPTERS[key].name}`,
          icon: <BookmarkIcon />,
          to: `/rules/${key}`,
        })),
      ],
    },
    {
      id: "tools",
      name: "Game Tools",
      icon: <ConstructionIcon />,
      children: [
        {
          id: "lists",
          name: "Rosters",
          icon: <FeaturedPlayListIcon />,
          to: "/lists",
        },
        {
          id: "mission_generator",
          name: "Scenarios",
          icon: <Map />,
          to: "/scenarios",
        },
      ],
    },
    {
      id: "divider",
    },
    ...categoryOrder.map((allianceKey) => {
      const theFactions = sortBy(
        get(unitCategories, `[${allianceKey}]`, []),
        "name"
      );
      const allianceData = data.getAlliance(allianceKey);
      return {
        id: allianceKey,
        name: `${allianceData?.name}`,
        icon: <BookmarkIcon />,
        to: "/factions",
        children: [
          ...Object.keys(theFactions).map((orgKey) => {
            const org = theFactions[orgKey];
            return {
              id: orgKey,
              name: org.name,
              icon: <BookmarkIcon />,
              to: `/factions/${org.id}`,
            };
          }),
        ],
      };
    }),
    {
      id: "divider",
    },
    {
      id: "github",
      name: "Github",
      icon: <Github />,
      toAbs: "https://github.com/dice-guild",
    },
    {
      id: "discord",
      name: "Discord",
      icon: <Discord />,
      toAbs: "https://discord.com/invite/M9sets4",
    },
    {
      id: "donate",
      name: "Donate",
      icon: <CoffeeIcon />,
      toAbs: "https://ko-fi.com/diceguild",
    },
    {
      id: "divider",
    },
    {
      id: "settings",
      name: "Settings",
      icon: <SettingsIcon />,
      onClick: () => {
        showUserPreferences();
      },
    },
  ];
  const [showUserPreferences, hideUserPreferences] = useModal(
    ({ extraProps }) => (
      <UserPreferences
        {...props}
        hideModal={hideUserPreferences}
        setUserPrefs={setUserPrefs}
        userPrefs={userPrefs}
        {...extraProps}
      />
    ),
    [userPrefs]
  );
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const fullScreen = useMediaQuery(theme.breakpoints.up("md"));
  const numActionsToShow = fullScreen
    ? contextActions?.length
    : 3 - (appState.enableSearch ? 1 : 0);
  const renderMenuItem = (item, index) => {
    if (item.id === "divider") {
      return <Divider key={index} />;
    }
    if (item.children) {
      return (
        <Dropdown key={index}>
          {({ handleClose, open, handleOpen, anchorElement }) => (
            <>
              <ListItemButton
                onClick={() => (open ? handleClose() : handleOpen())}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={<Typography>{item.name}</Typography>} />
                {open ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              <Collapse in={open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ pl: 2 }}>
                  {item.children?.map(renderMenuItem)}
                </List>
              </Collapse>
            </>
          )}
        </Dropdown>
      );
    }
    return (
      <ListItem
        button
        key={item.id}
        onClick={() => {
          if (item.toAbs) {
            window.open(item.toAbs, "_blank");
          } else if (item.to) {
            navigate(item.to);
          } else if (item.onClick) {
            item.onClick();
          }
          setOpen(false);
        }}
      >
        <ListItemIcon>{item.icon}</ListItemIcon>
        <ListItemText primary={<Typography>{item.name}</Typography>} />
      </ListItem>
    );
  };
  return (
    <>
      <AppBar
        position="sticky"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        {!searchMode && (
          <Toolbar style={{ padding: "0 12px" }}>
            {/* <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={() => (open ? handleDrawerClose() : handleDrawerOpen())}
              edge="start"
              sx={{ mr: 0, pl: "15px" }}
            >
              <MenuIcon />
            </IconButton> */}

            <Button
              onClick={() => navigate("/")}
              sx={{ color: "inherit", p: 0, backgroundColor: "transparent" }}
              disableRipple
            >
              <img
                src={IGR}
                alt="igr"
                style={{
                  height: fullScreen ? "40px" : "35px",
                  marginRight: "5px",
                }}
              />
            </Button>
            <Box flex={1}></Box>
            <>
              {contextActions
                ?.slice(0, numActionsToShow)
                ?.map((action, index) => (
                  <IconButton
                    size="large"
                    color="inherit"
                    title={action.name}
                    onClick={() => action.onClick()}
                  >
                    {action.icon}
                  </IconButton>
                ))}
              {!!appState.enableSearch && (
                <IconButton
                  size="large"
                  aria-label="show more"
                  color="inherit"
                  onClick={() => {
                    setSearchMode(true);
                  }}
                >
                  <SearchIcon />
                </IconButton>
              )}
              {!!(contextActions?.length - numActionsToShow > 0) && (
                <Dropdown>
                  {({ handleClose, open, handleOpen, anchorElement }) => (
                    <>
                      <IconButton
                        sx={{ color: "inherit" }}
                        style={{ paddingRight: 0 }}
                        onClick={handleOpen}
                      >
                        <MoreVertIcon />
                      </IconButton>
                      <Menu
                        anchorOrigin={{
                          vertical: "bottom",
                          horizontal: "right",
                        }}
                        transformOrigin={{
                          vertical: "top",
                          horizontal: "right",
                        }}
                        anchorEl={anchorElement}
                        id="basic-menu"
                        open={open}
                        onClose={handleClose}
                        MenuListProps={{
                          dense: false,
                          onClick: handleClose,
                          "aria-labelledby": "basic-button",
                        }}
                      >
                        {contextActions
                          ?.slice(numActionsToShow)
                          ?.map((action, index) => (
                            <MenuItem onClick={() => action.onClick()}>
                              <ListItemIcon>{action.icon}</ListItemIcon>
                              <ListItemText>{action.name}</ListItemText>
                            </MenuItem>
                          ))}
                      </Menu>
                    </>
                  )}
                </Dropdown>
              )}
            </>
          </Toolbar>
        )}
        {!!searchMode && (
          <Toolbar style={{ padding: "0 15px" }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={() => {
                setSearchMode(false);
                setAppState({ ...appState, searchText: "" });
              }}
              edge="start"
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Search>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                autoFocus
                placeholder="Search…"
                inputProps={{ "aria-label": "search" }}
                value={appState?.searchText}
                onChange={(event) => {
                  const value = event?.target?.value;
                  setAppState({ ...appState, searchText: value });
                }}
              />
            </Search>
          </Toolbar>
        )}
      </AppBar>
      <SwipeableDrawer
        open={open}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
      >
        <Toolbar />
        <Box sx={{ width: 300 }}>
          <List>{navItems.map(renderMenuItem)}</List>
        </Box>
      </SwipeableDrawer>
    </>
  );
};
