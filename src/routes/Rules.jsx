import { AppBar, Button, LinearProgress, Toolbar, useTheme } from '@mui/material';
import Container from '@mui/material/Container';
import { DataContext } from 'hooks';
import React, { useContext } from 'react';
import ReactMarkdown from "react-markdown";
import styled from 'styled-components';
import { MarkdownRenderer } from 'utils/markdown';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import introduction from 'assets/rules/1_introduction.md';
import datasheets from 'assets/rules/2_datasheets.md';
import game_rounds from 'assets/rules/3_game_rounds.md';
import actions from 'assets/rules/4_actions.md';
import movement from 'assets/rules/5_movement.md';
import shooting from 'assets/rules/6_shooting.md';
import fighting from 'assets/rules/7_fighting.md';
import morale from 'assets/rules/8_morale.md';
import reactions from 'assets/rules/9_reactions.md';
import terrain from 'assets/rules/10_terrain.md';
import powers from 'assets/rules/11_powers.md';
import tactic_points from 'assets/rules/12_tactic_points.md';
import force_building from 'assets/rules/13_force_building.md';
import scenarios from 'assets/rules/14_scenarios.md';
import multiplayer from 'assets/rules/15_multiplayer.md';
import { Navigate, useNavigate, useParams } from 'react-router';
import { PrettyHeader } from 'components/pretty-header';

export const CHAPTERS = {
  introduction: {
    name: "Introduction",
    page: introduction
  },
  datasheets: {
    name: "Datasheets",
    page: datasheets
  },
  game_rounds: {
    name: "Game Rounds",
    page: game_rounds
  },
  actions: {
    name: "Actions",
    page: actions
  },
  movement: {
    name: "Movement",
    page: movement
  },
  shooting: {
    name: "Shooting",
    page: shooting
  },
  fighting: {
    name: "Fighting",
    page: fighting
  },
  morale: {
    name: "Morale",
    page: morale
  },
  reactions: {
    name: "Reactions",
    page: reactions
  },
  terrain: {
    name: "Terrain",
    page: terrain
  },
  powers: {
    name: "Powers",
    page: powers
  },
  tactic_points: {
    name: "Tactic Points",
    page: tactic_points
  },
  force_building: {
    name: "Force Building",
    page: force_building
  },
  scenarios: {
    name: "Scenarios",
    page: scenarios
  },
  multiplayer: {
    name: "Multiplayer",
    page: multiplayer
  }
};

export default function QuickRules() {
  const [{ userPrefs, setAppState }] = useContext(DataContext);
  const mdRenderer = React.useMemo(() => MarkdownRenderer(), []);
  const theme = useTheme();
  const StyledRules = styled.div`
    h1 {
      font-size: 24pt;
      font-weight: bold;
      border-bottom: 4px solid ${theme.palette.primary.main};
      padding-bottom: 0.25rem;
    }
    h2 {
      font-size: 18pt;
      border-bottom: 2px solid ${theme.palette.primary.main};
      padding-bottom: 0.25rem;
    }
    h3 {
      font-size: 16pt;
    }
    h4 {
      font-weight: bold;
      font-size: 12pt;
    }
    h5 {
      font-weight: bold;
      font-size: 12pt;
    }
    p {
      break-inside: "avoid-column";
      page-break-inside: avoid; /* For Firefox. */
      -webkit-column-break-inside: avoid; /* For Chrome & friends. */
      break-inside: avoid; /* For standard browsers like IE. :-) */
    }
  `;
  const scrollWithOffset = (smooth = true) => {
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'instant' });
  }
  React.useEffect(() => {
    setAppState({
      enableSearch: false,
      contextActions: [
        {
          name: 'Top',
          icon: <ArrowUpwardIcon />,
          onClick: () => scrollWithOffset()
        }
      ]
    })
    return () => {
      setAppState({
        contextActions: []
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPrefs.developerMode]);
  const [postMarkdown, setPostMarkdown] = React.useState('');
  const navigate = useNavigate();
  let params = useParams();
  const page = params.page || 'introduction';
  const currentPage = CHAPTERS[page]?.page;
  const firstChapter = Object.keys(CHAPTERS)[0] || 'introduction';
  const currentPageNumber = Object.keys(CHAPTERS).indexOf(page);
  const totalPages = Object.keys(CHAPTERS).length;
  const nextPage = () => {
    const newPage = (currentPageNumber + 1) % totalPages;
    const nextPageId = Object.keys(CHAPTERS)[newPage];
    navigate(`/rules/${nextPageId}`);
    scrollWithOffset(false);
  };
  const previousPage = () => {
    const newPage = (currentPageNumber - 1) % totalPages;
    const nextPageId = Object.keys(CHAPTERS)[newPage];
    navigate(`/rules/${nextPageId}`);
    scrollWithOffset(false);
  };
  React.useEffect(() => {
    fetch(currentPage)
      .then((response) => response.text())
      .then((text) => {
        setPostMarkdown(text);
      });
  }, [ currentPage ]);

  // Redirect back to the first page if the requested page is not found
  if (!currentPage) {
    return (
      <Navigate replace to={`/rules/${firstChapter}`} />
    );
  }

  return (
    <>
      {!postMarkdown &&
        <LinearProgress sx={{ width: '100%' }} />
      }
      {page === firstChapter && <PrettyHeader text="Core Rules" />}
      <Container sx={{ mt: 2 }}>
        <StyledRules>
          <ReactMarkdown children={postMarkdown} components={mdRenderer} />
        </StyledRules>
        <Toolbar />
        <AppBar position="fixed" color="primary" sx={{ top: 'auto', bottom: 0 }}>
          <Toolbar sx={{ justifyContent: "end" }}>
            <Button sx={{ color: 'inherit' }} onClick={previousPage} disabled={currentPageNumber === 0}>
              Previous
            </Button>
            <Button sx={{ ml: 1, color: 'inherit' }} onClick={nextPage} disabled={currentPageNumber === totalPages - 1}>
              Next
            </Button>
          </Toolbar>
        </AppBar>
      </Container>
    </>
  );
}

