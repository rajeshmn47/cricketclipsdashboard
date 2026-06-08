import React, { useState, useEffect } from "react";
import { Modal, Box, Typography, Button, CircularProgress, Alert } from "@mui/material";
import { API } from "api";
import { URL } from "constants/userconstants";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "80%",
  maxWidth: 900,
  maxHeight: "80vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  overflow: "auto",
};

// Auto‑detect wicket keeper candidates
const detectCandidates = (players) => {
  const wkRegex = /wk|wicket.?keeper|keeper.?batsman|\(wk\)|†/i;
  return players.map(p => ({
    ...p,
    isCandidate: wkRegex.test(p.position || '') || wkRegex.test(p.playerName || '')
  }));
};

// Fetch squad for a given series + team
const fetchSquad = async (seriesId, teamId) => {
  try {
    const res = await API.get(`${URL}/squads`, { params: { seriesId, teamId } });
    let players = res.data.squad.players || [];
    players = detectCandidates(players);
    const currentKeeper = players.find(p => p.isWicketKeeper) || null;
    const candidates = players.filter(p => p.isCandidate);
    return { squadId: res.data.squad._id, players, currentKeeper, candidates };
  } catch (err) {
    console.error(`Failed to fetch squad for ${teamId}`, err);
    return null;
  }
};

const SeriesKeeperModal = ({ open, onClose, series }) => {
  const [teams, setTeams] = useState([]);
  const [teamsData, setTeamsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Extract unique home & away teams from series object
  useEffect(() => {
    if (series && open) {
      const allTeams = [...new Set([...(series.homeTeams || []), ...(series.awayTeams || [])])];
      setTeams(allTeams);
    }
  }, [series, open]);

  // Fetch squads for all teams when modal opens
  useEffect(() => {
    if (!open || !series || teams.length === 0) return;
    const fetchAllSquads = async () => {
      setLoading(true);
      const data = {};
      for (const team of teams) {
        data[team] = await fetchSquad(series.seriesId, team);
      }
      setTeamsData(data);
      setLoading(false);
    };
    fetchAllSquads();
  }, [open, series, teams]);

  const selectKeeper = async (teamName, playerId) => {
    const team = teamsData[teamName];
    if (!team || !team.squadId) return;
    setSaving(true);
    const updatedPlayers = team.players.map(p => ({
      ...p,
      isWicketKeeper: p.playerId === playerId
    }));
    try {
      await API.put(`${URL}/squads/${team.squadId}`, {
        teamId: teamName,
        seriesId: series.seriesId,
        teamName: teamName,
        players: updatedPlayers
      });
      // Refresh this team's data
      const refreshed = await fetchSquad(series.seriesId, teamName);
      setTeamsData(prev => ({ ...prev, [teamName]: refreshed }));
    } catch (err) {
      console.error("Failed to set keeper", err);
    } finally {
      setSaving(false);
    }
  };

  if (!series) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Typography variant="h5" gutterBottom>
          Select Wicket Keepers – {series.name}
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={3}>
            {teams.map(teamName => {
              const team = teamsData[teamName];
              if (!team) return <Alert severity="error" key={teamName}>Failed to load {teamName}</Alert>;
              const { currentKeeper, candidates, players } = team;
              const displayList = candidates.length > 0 ? candidates : players.slice(0, 5);
              return (
                <Box key={teamName} border={1} borderColor="grey.300" borderRadius={2} p={2}>
                  <Typography variant="h6" gutterBottom>{teamName}</Typography>
                  {candidates.length === 0 && (
                    <Typography variant="caption" color="warning.main" display="block" mb={1}>
                      ⚠️ No auto-detected keepers. Showing first 5 players.
                    </Typography>
                  )}
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {displayList.map(player => (
                      <Button
                        key={player.playerId}
                        variant={currentKeeper?.playerId === player.playerId ? "contained" : "outlined"}
                        color={currentKeeper?.playerId === player.playerId ? "success" : "primary"}
                        size="small"
                        onClick={() => selectKeeper(teamName, player.playerId)}
                        disabled={saving}
                        sx={{ textTransform: "none" }}
                      >
                        {player.playerName}
                        {player.isCandidate && currentKeeper?.playerId !== player.playerId && (
                          <Typography component="span" variant="caption" ml={0.5} color="text.secondary">(wk)</Typography>
                        )}
                      </Button>
                    ))}
                  </Box>
                  {currentKeeper && (
                    <Typography variant="body2" color="success.main" mt={1}>
                      ✅ Current keeper: <strong>{currentKeeper.playerName}</strong>
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
        <Box display="flex" justifyContent="flex-end" mt={3}>
          <Button onClick={onClose} variant="outlined">Close</Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default SeriesKeeperModal;