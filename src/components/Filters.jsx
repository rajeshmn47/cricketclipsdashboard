import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import FilterPopover from "./ui/FilterPopOver"
import { Button } from "@/components/ui/button"
import { API } from "../actions/userAction"
import { URL } from "../constants/userConstants"

function Filters({ values, onChange, clips, players }) {
  const [filterMode, setFilterMode] = useState("basic")
  const [seriesOptions, setSeriesOptions] = useState([])

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const res = await API.get(`${URL}/api/match/series/all`)
        setSeriesOptions(res.data || [])
      } catch (err) {
        setSeriesOptions([])
      }
    }
    fetchSeries()
  }, [])

  // Player options
  const playerOptions = (players || []).map(p => ({
    id: p?.toLowerCase(),
    name: p,
  }))

  // Deduplicate fielders
  const fielderMap = new Map()
  playerOptions.forEach(p => {
    if (p?.name && !fielderMap.has(p.name.toLowerCase())) {
      fielderMap.set(p.name.toLowerCase(), p)
    }
  })
  const uniqueFielders = playerOptions;

  // ---------- Full static option arrays (copied from your original component) ----------
  const shotTypes = [
    { id: "cover_drive", name: "Cover Drive" },
    { id: "straight_drive", name: "Straight Drive" },
    { id: "on_drive", name: "On Drive" },
    { id: "off_drive", name: "Off Drive" },
    { id: "square_drive", name: "Square Drive" },
    { id: "pull", name: "Pull" },
    { id: "hook", name: "Hook" },
    { id: "cut", name: "Cut" },
    { id: "upper_cut", name: "Upper Cut" },
    { id: "sweep", name: "Sweep" },
    { id: "reverse_sweep", name: "Reverse Sweep" },
    { id: "paddle_sweep", name: "Paddle Sweep" },
    { id: "switch_hit", name: "Switch Hit" },
    { id: "helicopter_shot", name: "Helicopter Shot" },
    { id: "glance", name: "Glance" },
    { id: "flick", name: "Flick" },
    { id: "dab", name: "Dab" },
    { id: "defensive_shot", name: "Defensive Shot" },
    { id: "reverse_hit", name: "Reverse Hit" },
    { id: "scoop", name: "Scoop" },
    { id: "ramp_shot", name: "Ramp Shot" },
    { id: "uppercut", name: "Uppercut" },
    { id: "inside_out", name: "Inside Out" }
  ]

  const ballTypes = [
    { id: "off_cutter", name: "Off Cutter" },
    { id: "leg_cutter", name: "Leg Cutter" },
    { id: "wide", name: "Wide" },
    { id: "no_ball", name: "No Ball" },
    { id: "beamer", name: "Beamer" },
    { id: "short_ball", name: "Short Ball" },
    { id: "inswinger", name: "Inswinger" },
    { id: "outswinger", name: "Outswinger" },
    { id: "reverse_swing", name: "Reverse Swing" },
    { id: "googly", name: "Googly" },
    { id: "doosra", name: "Doosra" },
    { id: "carrom_ball", name: "Carrom Ball" },
    { id: "top_spin", name: "Top Spin" },
    { id: "flipper", name: "Flipper" },
    { id: "arm_ball", name: "Arm Ball" },
    { id: "seam_up", name: "Seam Up" },
    { id: "cross_seam", name: "Cross Seam" },
    { id: "leg_break", name: "Leg Break" },
    { id: "off_break", name: "Off Break" },
    { id: "knuckle_ball", name: "Knuckle Ball" },
    { id: "split_finger", name: "Split Finger" },
    { id: "reverse_swing_yorker", name: "Reverse Swing Yorker" },
    { id: "other", name: "Other" }
  ]

  const lengthTypes = [
    { id: "yorker", name: "Yorker" },
    { id: "full_toss", name: "Full Toss" },
    { id: "good_length", name: "Good Length" },
    { id: "short_of_length", name: "Short of a Length" },
    { id: "bouncer", name: "Bouncer" },
    { id: "wide", name: "Wide" },
    { id: "no_ball", name: "No Ball" },
    { id: "beamer", name: "Beamer" },
    { id: "length_ball", name: "Length Ball" },
    { id: "full_length", name: "Full Length" },
    { id: "half_volley", name: "Half Volley" },
    { id: "short_ball", name: "Short Ball" },
    { id: "back_of_length", name: "Back of a Length" },
    { id: "overpitched", name: "Overpitched" },
    { id: "other", name: "Other" }
  ]

  const variationTypes = [
    { id: "normal", name: "Normal" },
    { id: "slow", name: "Slower Ball" },
    { id: "faster", name: "Faster Ball" }
  ]

  const directionOptions = [
    { id: "long_on", name: "Long On" },
    { id: "long_off", name: "Long Off" },
    { id: "straight", name: "Straight" },
    { id: "mid_on", name: "Mid On" },
    { id: "mid_off", name: "Mid Off" },
    { id: "deep_mid_wicket", name: "Deep Mid Wicket" },
    { id: "deep_cover", name: "Deep Cover" },
    { id: "deep_square_leg", name: "Deep Square Leg" },
    { id: "deep_fine_leg", name: "Deep Fine Leg" },
    { id: "deep_point", name: "Deep Point" },
    { id: "third_man", name: "Third Man" },
    { id: "slip", name: "Slip" },
    { id: "gully", name: "Gully" },
    { id: "cover", name: "Cover" },
    { id: "extra_cover", name: "Extra Cover" },
    { id: "point", name: "Point" },
    { id: "square_leg", name: "Square Leg" },
    { id: "fine_leg", name: "Fine Leg" },
    { id: "leg_gully", name: "Leg Gully" },
    { id: "short_leg", name: "Short Leg" },
    { id: "silly_point", name: "Silly Point" },
    { id: "mid_wicket", name: "Mid Wicket" },
    { id: "backward_point", name: "Backward Point" },
    { id: "backward_square_leg", name: "Backward Square Leg" },
    { id: "leg_slip", name: "Leg Slip" },
    { id: "short_third_man", name: "Short Third Man" },
    { id: "silly_mid_off", name: "Silly Mid Off" },
    { id: "silly_mid_on", name: "Silly Mid On" },
    { id: "half_tracker", name: "Half Tracker" },
    { id: "other", name: "Other" }
  ]

  const connectionGroups = {
    "Clean Contact": [{ id: "well_timed", name: "Well Timed" }],
    "Mistimed": [
      { id: "miscue", name: "Miscue" },
      { id: "mistimed", name: "Mistimed" },
      { id: "toe_end", name: "Toe End" },
      { id: "splice", name: "Splice" }
    ],
    "Edges": [
      { id: "top_edge", name: "Top Edge" },
      { id: "bottom_edge", name: "Bottom Edge" },
      { id: "inside_edge", name: "Inside Edge" },
      { id: "outside_edge", name: "Outside Edge" },
      { id: "nick", name: "Nick" }
    ],
    "No Contact": [
      { id: "air_shot", name: "Air Shot" },
      { id: "beaten", name: "Beaten" }
    ],
    "Other": [
      { id: "defensive_block", name: "Defensive Block" },
      { id: "other", name: "Other" }
    ]
  }

  const teamOptions = [
    { id: "rcb", name: "RCB" }, { id: "csk", name: "CSK" },
    { id: "mi", name: "MI" }, { id: "kkr", name: "KKR" },
    { id: "srh", name: "SRH" }, { id: "gt", name: "GT" },
    { id: "rr", name: "RR" }, { id: "lsg", name: "LSG" },
    { id: "pbks", name: "PBKS" }, { id: "dc", name: "DC" },
    { id: "tkr", name: "Trinbago Knight Riders" },
    { id: "gaw", name: "Guyana Amazon Warriors" },
    { id: "jt", name: "Jamaica Tallawahs" },
    { id: "slz", name: "Saint Lucia Kings" },
    { id: "bt", name: "Barbados Royals" },
    { id: "sknp", name: "St Kitts and Nevis Patriots" },
    { id: "iu", name: "Islamabad United" },
    { id: "kk", name: "Karachi Kings" },
    { id: "lhq", name: "Lahore Qalandars" },
    { id: "ms", name: "Multan Sultans" },
    { id: "pz", name: "Peshawar Zalmi" },
    { id: "qg", name: "Quetta Gladiators" },
    { id: "ind", name: "India" }, { id: "aus", name: "Australia" },
    { id: "eng", name: "England" }, { id: "pak", name: "Pakistan" },
    { id: "sa", name: "South Africa" }, { id: "nz", name: "New Zealand" },
    { id: "wi", name: "West Indies" }, { id: "ban", name: "Bangladesh" },
    { id: "afg", name: "Afghanistan" }, { id: "sl", name: "Sri Lanka" },
    { id: "ire", name: "Ireland" }, { id: "ned", name: "Netherlands" },
    { id: "zim", name: "Zimbabwe" }, { id: "nam", name: "Namibia" },
    { id: "uae", name: "UAE" }, { id: "oma", name: "Oman" },
    { id: "usa", name: "USA" }, { id: "nep", name: "Nepal" },
    { id: "sco", name: "Scotland" },
    { id: "dv", name: "Desert Vipers" }, { id: "dcp", name: "Dubai Capitals" },
    { id: "gg", name: "Gulf Giants" }, { id: "mie", name: "MI Emirates" },
    { id: "sw", name: "Sharjah Warriors" }, { id: "adkr", name: "Abu Dhabi Knight Riders" }
  ]

  const leagueOptions = [
    { id: "ipl", name: "IPL" }, { id: "bbl", name: "BBL" },
    { id: "psl", name: "PSL" }, { id: "cpl", name: "CPL" },
    { id: "mlc", name: "MLC" }, { id: "t20_blast", name: "T20 Blast" },
    { id: "bpl", name: "BPL" }, { id: "lpl", name: "LPL" },
    { id: "hundred", name: "The Hundred" }, { id: "other", name: "Other" }
  ]

  const eventOptions = [
    { id: "four", name: "Four" }, { id: "six", name: "Six" },
    { id: "wicket", name: "Wicket" }, { id: "dropped", name: "Dropped Catch" },
    { id: "dot", name: "Dot Ball" }, { id: "single", name: "Single (1 Run)" },
    { id: "double", name: "Two Runs" }, { id: "triple", name: "Three Runs" },
    { id: "wide", name: "Wide" }, { id: "noball", name: "No Ball" },
    { id: "bye", name: "Bye" }, { id: "legbye", name: "Leg Bye" },
    { id: "penalty", name: "Penalty Runs" }, { id: "other", name: "Other" }
  ]

  const wicketTypeOptions = [
    { id: "bowled", name: "Bowled" }, { id: "caught", name: "Caught" },
    { id: "keeperCatch", name: "Keeper Catch" }, { id: "runout", name: "Run Out" },
    { id: "lbw", name: "LBW" }, { id: "stumped", name: "Stumped" },
    { id: "hitwicket", name: "Hit Wicket" }, { id: "caught_bowled", name: "Caught & Bowled" },
    { id: "obstructing", name: "Obstructing the Field" }, { id: "retiredout", name: "Retired Out" },
    { id: "other", name: "Other" }
  ]

  // Admin options
  const reportedOptions = [
    { id: "reported", name: "Reported" },
    { id: "notReported", name: "Not Reported" }
  ]
  const flagReasonOptions = [
    { id: "label_conflict", name: "Label Conflict" },
    { id: "video_mismatch", name: "Video Mismatch" },
    { id: "half_clip", name: "Half Clip" },
    { id: "multiple_clips", name: "Multiple Clips" },
    { id: "manual", name: "Manual" },
    { id: "other", name: "Other" }
  ]
  const conflictFieldOptions = [
    { id: "batsman", name: "Batsman" }, { id: "bowler", name: "Bowler" },
    { id: "half_clip", name: "Half Clip" }, { id: "shotType", name: "Shot Type" },
    { id: "direction", name: "Direction" }, { id: "ballType", name: "Ball Type" },
    { id: "lengthType", name: "Length Type" }, { id: "catchBy", name: "Caught By" },
    { id: "droppedBy", name: "Dropped By" }, { id: "runoutBy", name: "Runout By" },
    { id: "stumpedBy", name: "Stumped By" }
  ]
  const reviewStatusOptions = [
    { id: "pending", name: "Pending" },
    { id: "fixed", name: "Fixed" },
    { id: "dismissed", name: "Dismissed" }
  ]

  // ---------- Filter configuration (keys aligned with basicFilterKeys) ----------
  const filterConfig = [
    // Admin filters – use keys that match basicFilterKeys (or adjust basicFilterKeys)
    { type: "select", label: "Reported", key: "reported", options: reportedOptions },
    { type: "select", label: "Flagged", key: "isFlagged", options: [{ id: "true", name: "Flagged" }, { id: "false", name: "Not Flagged" }] },
    { type: "select", label: "Flag Reason", key: "flagReason", options: flagReasonOptions },
    { type: "select", label: "Conflict Field", key: "conflictField", options: conflictFieldOptions },
    { type: "select", label: "Review Status", key: "reviewStatus", options: reviewStatusOptions },
    // Core cricket filters (basic)
    { type: "searchable", label: "Batsman", key: "batsman", options: playerOptions },
    { type: "searchable", label: "Bowler", key: "bowler", options: playerOptions },
    { type: "searchable", label: "Team", key: "batting_team", options: teamOptions },
    { type: "searchable", label: "Series", key: "series", options: seriesOptions.map(s => ({ id: s.seriesId, name: s.name || s.label })) },
    // Advanced filters (only in advanced mode)
    { type: "select", label: "League", key: "league", options: leagueOptions },
    { type: "searchable", label: "Bowling Team", key: "bowling_team", options: teamOptions },
    { type: "select", label: "Bowler Type", key: "bowlerType", options: [{ id: "fast", name: "Fast" }, { id: "spin", name: "Spin" }] },
    { type: "select", label: "Batting Hand", key: "battingHand", options: [{ id: "left", name: "Left" }, { id: "right", name: "Right" }] },
    { type: "select", label: "Bowling Hand", key: "bowlingHand", options: [{ id: "left", name: "Left" }, { id: "right", name: "Right" }] },
    { type: "select", label: "Match Format", key: "format", options: [{ id: "odi", name: "ODI" }, { id: "t20", name: "T20" }, { id: "test", name: "Test" }] },
    { type: "select", label: "Match Type", key: "type", options: [{ id: "i", name: "International" }, { id: "d", name: "Domestic" }, { id: "l", name: "League" }] },
    { type: "select", label: "Venue", key: "venue", options: [{ id: "wankhede", name: "Wankhede" }, { id: "chinnaswamy", name: "Chinnaswamy" }] },
    { type: "select", label: "Season", key: "season", options: ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "other"].map(y => ({ id: y, name: y })) },
    { type: "select", label: "Event", key: "event", options: eventOptions },
    { type: "select", label: "Over Range", key: "overRange", options: [{ id: "1-6", name: "1-6" }, { id: "7-15", name: "7-15" }, { id: "16-20", name: "16-20" }] },
    { type: "select", label: "Wicket Type", key: "wicketType", options: wicketTypeOptions },
    { type: "select", label: "Shot Elevation", key: "shotElevation", options: [{ id: "all", name: "All" }, { id: "lofted", name: "Lofted" }, { id: "grounded", name: "Along the Ground" }] },
    { type: "select", label: "Duration (sec)", key: "durationRange", options: [{ id: "0-2", name: "0-2 sec" }, { id: "2-4", name: "2-4 sec" }, { id: "5-10", name: "5-10 sec" }, { id: "10+", name: "10+ sec" }] },
    { type: "select", label: "Shot Type", key: "shotType", options: shotTypes },
    { type: "select", label: "Ball Type", key: "ballType", options: ballTypes },
    { type: "select", label: "Direction", key: "direction", options: directionOptions },
    { type: "select", label: "Length Type", key: "lengthType", options: lengthTypes },
    { type: "select", label: "Variation", key: "variation", options: variationTypes },
    { key: "connection", label: "Connection Type", type: "select", groups: connectionGroups },
    // Fielder popovers – conditionally shown
    { type: "searchable", label: "Caught By", key: "caughtBy", options: uniqueFielders },
    { type: "searchable", label: "Run Out By", key: "runOutBy", options: uniqueFielders },
    { type: "searchable", label: "Dropped By", key: "droppedBy", options: uniqueFielders },
    { type: "searchable", label: "Stumped By", key: "stumpedBy", options: uniqueFielders },
  ]

  // ✅ FIXED: Basic filter keys now match the exact keys used in filterConfig
  const basicFilterKeys = [
    "reported", "isFlagged", "flagReason", "conflictField", "reviewStatus",
    "batsman", "bowler", "batting_team", "series"
  ]

  const isWicketType = (type) => values.wicketType === type

  const visibleFilters = filterConfig.filter(f =>
    basicFilterKeys.includes(f.key) ||
    (f.key === "caughtBy" && (isWicketType("caught") || isWicketType("keeperCatch"))) ||
    (f.key === "runOutBy" && isWicketType("runout")) ||
    (f.key === "droppedBy" && values.event === "dropped") ||
    (f.key === "stumpedBy" && isWicketType("stumped")) ||
    (!basicFilterKeys.includes(f.key) &&
      !["caughtBy", "runOutBy", "droppedBy", "stumpedBy"].includes(f.key) &&
      filterMode === "advanced")
  )

  const sortOptions = [
    { value: "createdAt_desc", label: "Newest First" },
    { value: "createdAt_asc", label: "Oldest First" },
    { value: "duration_asc", label: "Shortest First" },
    { value: "duration_desc", label: "Longest First" },
    { value: "over_asc", label: "Over (earliest)" },
    { value: "event_asc", label: "Event (A-Z)" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-blue-900 font-bold text-lg">Filters</span>
          <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-md">
            <span className="text-xs text-gray-600 font-medium">Sort by:</span>
            <Select
              value={values.sortBy || "createdAt_desc"}
              onValueChange={(val) => onChange("sortBy", val)}  // reuse onChange
            >
              <SelectTrigger className="w-[150px] h-8 text-xs bg-white">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setFilterMode(m => m === "basic" ? "advanced" : "basic")}>
          {filterMode === "basic" ? "Show Advanced Filters" : "Show Fewer Filters"}
        </Button>
      </div>
      <div className="bg-gradient-to-br from-blue-50 to-white shadow-md rounded-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-cols-fr gap-4 p-4 rounded-xl">
          {visibleFilters.filter(f => !["caughtBy", "runOutBy", "droppedBy", "stumpedBy"].includes(f.key)).map((filter) => {
            if (filter.type === "select") {
              if (filter.groups) {
                return (
                  <div key={filter.key} className="w-full">
                    <Label className="mb-1 block text-blue-900 font-semibold">{filter.label}</Label>
                    <Select
                      value={values[filter.key] || ""}
                      onValueChange={(value) => onChange(filter.key, value === "clear" ? null : value)}
                    >
                      <SelectTrigger className="w-full rounded-lg border-blue-200 bg-white/80">
                        <SelectValue placeholder={`Select ${filter.label}`} />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        <SelectItem value="clear" className="text-gray-400 italic">Clear</SelectItem>
                        {Object.entries(filter.groups).map(([groupName, items]) => (
                          <React.Fragment key={groupName}>
                            <div className="px-3 py-1 text-xs font-medium text-gray-500">{groupName}</div>
                            {items.map(opt => (
                              <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                            ))}
                          </React.Fragment>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              } else {
                return (
                  <div key={filter.key} className="w-full min-w-0">
                    <Label className="mb-1 block text-blue-900 font-semibold">{filter.label}</Label>
                    <Select
                      value={values[filter.key] || ""}
                      onValueChange={(value) => onChange(filter.key, value === "clear" ? null : value)}
                    >
                      <SelectTrigger className="w-full rounded-lg border-blue-200 bg-white/80">
                        <SelectValue placeholder={`Select ${filter.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clear" className="text-gray-400 italic">Clear</SelectItem>
                        {filter.options.map(opt => (
                          <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              }
            } else if (filter.type === "searchable") {
              const selected = filter.options?.find(o => o.id === values[filter.key])
              return (
                <div key={filter.key} className="w-full min-w-0">
                  <FilterPopover onChange={onChange} filter={filter} selected={selected} />
                </div>
              )
            }
            return null
          })}
        </div>

        {filterMode === "advanced" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-cols-fr gap-4 p-4 rounded-xl shadow-md">
            {(isWicketType("caught") || isWicketType("keeperCatch")) && (
              <FilterPopover
                onChange={onChange}
                filter={filterConfig.find(f => f.key === "caughtBy")}
                selected={filterConfig.find(f => f.key === "caughtBy")?.options?.find(o => o.id === values.caughtBy)}
              />
            )}
            {isWicketType("runout") && (
              <FilterPopover
                onChange={onChange}
                filter={filterConfig.find(f => f.key === "runOutBy")}
                selected={filterConfig.find(f => f.key === "runOutBy")?.options?.find(o => o.id === values.runOutBy)}
              />
            )}
            {values.event === "dropped" && (
              <FilterPopover
                onChange={onChange}
                filter={filterConfig.find(f => f.key === "droppedBy")}
                selected={filterConfig.find(f => f.key === "droppedBy")?.options?.find(o => o.id === values.droppedBy)}
              />
            )}
            {isWicketType("stumped") && (
              <FilterPopover
                onChange={onChange}
                filter={filterConfig.find(f => f.key === "stumpedBy")}
                selected={filterConfig.find(f => f.key === "stumpedBy")?.options?.find(o => o.id === values.stumpedBy)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Filters