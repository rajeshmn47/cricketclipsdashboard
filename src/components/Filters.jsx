import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Switch } from "./ui/switch"
import { cn } from "@/lib/utils"
import { useState } from "react"
import FilterPopover from "./ui/FilterPopOver"
import { Button } from "@/components/ui/button"

function Filters({ values, onChange, clips }) {
  const [open, setOpen] = React.useState(false);
  const [openMap, setOpenMap] = useState({});
  const [filterMode, setFilterMode] = useState("basic"); // 'basic' or 'advanced'

  const togglePopover = (key, value) => {
    console.log(key, value, 'toggling')
    setOpenMap((prev) => ({ ...prev, [key]: !value }));
  };


  const uniqueBatsmen = Array.from(
    new Set(clips.map((clip) => clip.batsman))
  ).map((name) => ({
    id: name?.toLowerCase(),
    name,
  }));

  const uniqueBowler = Array.from(
    new Set(clips.map((clip) => clip.bowler))
  ).map((name) => ({
    id: name?.toLowerCase(),
    name,
  }));

  let alluniqueplayers = uniqueBatsmen?.concat(uniqueBowler)

  // Extract unique fielders for the "Caught By" filter
  const uniqueFielders = Array.from(
    new Set(alluniqueplayers)
  ).map((name) => ({
    id: name?.name?.toLowerCase(),
    name: name?.name,
  }));

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
    { id: "yorker", name: "Yorker" },
    { id: "full_toss", name: "Full Toss" },
    { id: "good_length", name: "Good Length" },
    { id: "short_of_length", name: "Short of a Length" },
    { id: "bouncer", name: "Bouncer" },
    { id: "slow_ball", name: "Slow Ball" },
    { id: "off_cutter", name: "Off Cutter" },
    { id: "leg_cutter", name: "Leg Cutter" },
    { id: "slower_bouncer", name: "Slower Bouncer" },
    { id: "wide", name: "Wide" },
    { id: "no_ball", name: "No Ball" },
    { id: "beamer", name: "Beamer" },
    { id: "length_ball", name: "Length Ball" },
    { id: "full_length", name: "Full Length" },
    { id: "half_volley", name: "Half Volley" },
    { id: "short_ball", name: "Short Ball" },
    { id: "back_of_length", name: "Back of a Length" },
    { id: "overpitched", name: "Overpitched" },
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
    { id: "slower_ball_bouncer", name: "Slower Ball Bouncer" },
    { id: "reverse_swing_yorker", name: "Reverse Swing Yorker" },
    { id: "other", name: "Other" }
  ];

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
  ];

  const connectionOptions = [
    { id: "middle", name: "Middled" },
    { id: "well_timed", name: "Well Timed" },
    { id: "perfect_timing", name: "Timed to Perfection" },
    { id: "top_edge", name: "Top Edge" },
    { id: "bottom_edge", name: "Bottom Edge" },
    { id: "outside_edge", name: "Outside Edge" },
    { id: "inside_edge", name: "Inside Edge" },
    { id: "thick_edge", name: "Thick Edge" },
    { id: "thin_edge", name: "Thin Edge" },
    { id: "toe_end", name: "Toe End" },
    { id: "splice", name: "Off the Splice" },
    { id: "miscue", name: "Miscued" },
    { id: "early", name: "Early Shot" },
    { id: "late", name: "Late Shot" },
    { id: "air_shot", name: "No Contact (Air Shot)" },
    { id: "beaten", name: "Beaten" },
    { id: "nick", name: "Nick" },
    { id: "edge_to_keeper", name: "Edge to Keeper" },
    { id: "edge_to_slip", name: "Edge to Slip" },
    { id: "skied", name: "Skied" },
    { id: "mistimed", name: "Mistimed" },
    { id: "sweet_spot", name: "Sweet Spot" },
    { id: "defensive_block", name: "Defensive Block" },
    { id: "no_connection", name: "No Connection" },
    { id: "other", name: "Other" }
  ];

  const connectionGroups = {
    "Clean Contact": [
      { id: "well_timed", name: "Well Timed" }
    ],
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
  };


  const teamOptions = [
    { id: "rcb", name: "RCB" },
    { id: "csk", name: "CSK" },
    { id: "mi", name: "MI" },
    { id: "kkr", name: "KKR" },
    { id: "srh", name: "SRH" },
    { id: "gt", name: "GT" },
    { id: "rr", name: "RR" },
    { id: "lsg", name: "LSG" },
    { id: "pbks", name: "PBKS" },
    { id: "dc", name: "DC" },
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
    { id: "ind", name: "India" },
    { id: "aus", name: "Australia" },
    { id: "eng", name: "England" },
    { id: "pak", name: "Pakistan" },
    { id: "sa", name: "South Africa" },
    { id: "nz", name: "New Zealand" },
    { id: "wi", name: "West Indies" },
    { id: "ban", name: "Bangladesh" },
    { id: "afg", name: "Afghanistan" },
    { id: "sl", name: "Sri Lanka" },
    { id: "ire", name: "Ireland" },
    { id: "ned", name: "Netherlands" },
    { id: "zim", name: "Zimbabwe" },
    { id: "nam", name: "Namibia" },
    { id: "uae", name: "UAE" },
    { id: "oma", name: "Oman" },
    { id: "usa", name: "USA" },
    { id: "nep", name: "Nepal" },
    { id: "sco", name: "Scotland" }
  ]

  const reportedOptions = [
    { id: "reported", name: "reported" },
    { id: "notReported", name: "not reported" }
  ]

  const filterConfig = [
    { type: "select", label: "Reported", key: "reported", options: reportedOptions },
    { type: "searchable", label: "Bowler", key: "bowler", options: uniqueBowler },
    { type: "searchable", label: "Team", key: "batting_team", options: teamOptions },
    {
      type: "select", label: "League", key: "series", options: [
        { id: "ipl", name: "IPL" },
        { id: "bbl", name: "BBL" },
        { id: "psl", name: "PSL" },
        { id: "cpl", name: "CPL" },
        { id: "mlc", name: "MLC" },
        { id: "t20_blast", name: "T20 Blast" },
        { id: "bpl", name: "BPL" },
        { id: "lpl", name: "LPL" },
        { id: "hundred", name: "The Hundred" },
        { id: "other", name: "Other" }
      ]
    },
    { type: "searchable", label: "Bowling Team", key: "bowling_team", options: teamOptions },
    { type: "select", label: "Bowler Type", key: "bowlerType", options: [{ id: "fast", name: "fast" }, { id: "spin", name: "Spin" }] },
    { type: "select", label: "Batting Hand", key: "battingHand", options: [{ id: "left", name: "Left" }, { id: "right", name: "Right" }] },
    { type: "select", label: "Bowling Hand", key: "bowlingHand", options: [{ id: "left", name: "Left" }, { id: "right", name: "Right" }] },
    { type: "select", label: "Match Format", key: "matchFormat", options: [{ id: "odi", name: "ODI" }, { id: "t20", name: "T20" }, { id: "test", name: "Test" }] },
    { type: "select", label: "Match Venue", key: "venue", options: [{ id: "wankhede", name: "Wankhede" }, { id: "chinnaswamy", name: "Chinnaswamy" }] },
    {
      type: "select", label: "Season", key: "season", options: [
        { id: "2025", name: "2025" },
        { id: "2024", name: "2024" },
        { id: "2023", name: "2023" },
        { id: "2022", name: "2022" },
        { id: "2021", name: "2021" },
        { id: "2020", name: "2020" },
        { id: "2019", name: "2019" },
        { id: "2018", name: "2018" },
        { id: "2017", name: "2017" },
        { id: "2016", name: "2016" },
        { id: "2015", name: "2015" },
        { id: "other", name: "Other" }
      ]
    },
    { type: "select", label: "Over Range", key: "overRange", options: [{ id: "1-6", name: "1-6" }, { id: "7-15", name: "7-15" }, { id: "16-20", name: "16-20" }] },
    { type: "boolean", label: "Is Boundary", key: "isBoundary" },
    { type: "boolean", label: "Is Six", key: "isSix" },
    { type: "boolean", label: "Is Four", key: "isFour" },
    { type: "boolean", label: "Is Wicket", key: "isWicket" },
    { type: "boolean", label: "Is Catch", key: "isCatch" },
    { type: "boolean", label: "Is Runout", key: "isRunout" },
    { type: "boolean", label: "Is LBW", key: "isLBW" },
    { type: "boolean", label: "Is Clean Bowled", key: "isCleanBowled" },
    { type: "boolean", label: "Is Stumping", key: "isStumping" },
    { type: "boolean", label: "Keeper Catch", key: "isKeeperCatch" },
    { type: "boolean", label: "Lofted", key: "isLofted" }, // <-- Add this line
    { type: "boolean", label: "Along the Ground", key: "isGrounded" },
    {
      type: "select", label: "Duration (sec)", key: "durationRange", options: [
        { id: "0-2", name: "0-2 sec" },
        { id: "2-5", name: "2-5 sec" },
        { id: "5-10", name: "5-10 sec" },
        { id: "10+", name: "10+ sec" },
      ],
    },
    { type: "select", label: "Shot Type", key: "shotType", options: shotTypes },
    { type: "select", label: "Ball Type", key: "ballType", options: ballTypes },
    { type: "select", label: "Direction", key: "direction", options: directionOptions },
    { key: "connection", label: "Connection Type", type: "select", groups: connectionGroups },
    { type: "searchable", label: "Caught By", key: "caughtBy", options: uniqueFielders },
    { type: "searchable", label: "Run Out By", key: "runOutBy", options: uniqueFielders },
    { type: "boolean", label: "Is Dropped", key: "isDropped" },
    { type: "searchable", label: "Dropped By", key: "droppedBy", options: uniqueFielders },
  ]

  // Define which filters are basic (show by default)
  const basicFilterKeys = [
    "reported",
    "bowler",
    "batting_team",
    "series"
  ];

  // Filter config for current mode
  const visibleFilters = filterConfig.filter(f =>
    basicFilterKeys.includes(f.key) ||
    (f.key === "caughtBy" && (values.isCatch === true || values.isWicket === true)) ||
    (f.key === "runOutBy" && values.isRunout === true) ||
    (f.key === "droppedBy" && values.isDropped === true) ||
    (!basicFilterKeys.includes(f.key) &&
      f.key !== "caughtBy" &&
      f.key !== "runOutBy" &&
      f.key !== "droppedBy" &&
      filterMode === "advanced")
  );

  return (
    <div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-blue-900 font-bold text-lg">Filters</span>
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={() => setFilterMode(filterMode === "basic" ? "advanced" : "basic")}
          >
            {filterMode === "basic" ? "Show Advanced Filters" : "Show Fewer Filters"}
          </Button>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-white shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-cols-fr gap-4 p-4  rounded-xl">
            {/* Grouped: Is Catch + Caught By */}


            {/* Render the rest of your filters as before, skipping the above keys */}
            {visibleFilters.filter(f =>
              !["caughtBy", "runOutBy", "droppedBy", "isCatch", "isRunout", "isDropped"].includes(f.key)
            ).map((filter) => {
              if (filter.type === "select") {
                return filter.groups
                  ?
                  <div key={filter?.key} className="mb-4 w-full">
                    <Label className="mb-1 block text-blue-900 font-semibold tracking-wide">
                      {filter.label}
                    </Label>
                    <Select
                      value={values[filter.key] || ""}
                      onValueChange={(value) => onChange(filter.key, value === "clear" ? null : value)}
                    >
                      <SelectTrigger className="w-full rounded-lg border-blue-200 bg-white/80 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 shadow-sm">
                        <SelectValue placeholder={`Select ${filter.label}`} className="cursor-pointer text-gray-700" />
                      </SelectTrigger>

                      <SelectContent className="rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto">
                        <SelectItem value="clear" className="text-gray-400 italic">Select Option</SelectItem>

                        {Object.entries(connectionGroups).map(([groupName, items]) => (
                          <div key={groupName}>
                            <div className="px-3 py-1 text-xs font-medium text-gray-500">{groupName}</div>
                            {items.map((opt) => (
                              <SelectItem key={opt.id} value={opt.id} className="hover:bg-blue-50 focus:bg-blue-100">
                                {opt.name}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  : <div key={filter.key} className="mb-2 w-full min-w-0">
                    <Label className="mb-1 block text-blue-900 font-semibold tracking-wide">{filter.label}</Label>
                    <Select
                      className="w-full"
                      value={values[filter.key] || ""}
                      onValueChange={(value) => onChange(filter.key, value === "clear" ? null : value)}
                    >
                      <SelectTrigger className="w-full min-w-0 rounded-lg border-blue-200 bg-white/80 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 shadow-sm">
                        <SelectValue placeholder={`Select ${filter.label}`} className="cursor-pointer text-gray-700" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg bg-white shadow-lg">
                        <SelectItem value="clear" className="text-gray-400 italic">Select Option</SelectItem>
                        {filter.options.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id} className="hover:bg-blue-50 focus:bg-blue-100">
                            {opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
              }

              if (filter.type === "searchable") {
                const selected = filter.options.find(o => o.id === values[filter.key])
                return (
                  <div key={filter.key} className="mb-2 w-full min-w-0">
                    <FilterPopover onChange={onChange} filter={filter} selected={selected} />
                  </div>
                )
              }

              if (filter.type === "boolean") {
                return (
                  <div key={filter.key} className="flex items-center space-x-3 mb-2 p-2 bg-white/70 rounded-lg shadow-sm w-full min-w-0">
                    <Switch
                      id={filter.key}
                      className="cursor-pointer focus:ring-2 focus:ring-blue-200"
                      checked={values[filter.key] || false}
                      onCheckedChange={(value) => onChange(filter.key, value)}
                    />
                    <Label htmlFor={filter.key} className="text-blue-900 font-medium">{filter.label}</Label>
                  </div>
                )
              }

              return null
            })}
          </div>
          {filterMode == "advanced" &&
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-cols-fr gap-4 p-4 rounded-xl shadow-md">
              {/* Grouped: Is Catch + Caught By */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-3 mb-2 p-2 bg-white/70 rounded-lg shadow-sm w-full min-w-0">
                  <Switch
                    id="isCatch"
                    className="cursor-pointer focus:ring-2 focus:ring-blue-200"
                    checked={values.isCatch || false}
                    onCheckedChange={(value) => onChange("isCatch", value)}
                  />
                  <Label htmlFor="isCatch" className="text-blue-900 font-medium">Is Catch</Label>
                </div>
                {(values.isCatch === true || values.isWicket === true) && (
                  <div className="mb-2 w-full min-w-0">
                    <FilterPopover onChange={onChange} filter={filterConfig.find(f => f.key === "caughtBy")} selected={filterConfig.find(f => f.key === "caughtBy").options.find(o => o.id === values.caughtBy)} />
                  </div>
                )}
              </div>

              {/* Grouped: Is Runout + Run Out By */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-3 mb-2 p-2 bg-white/70 rounded-lg shadow-sm w-full min-w-0">
                  <Switch
                    id="isRunout"
                    className="cursor-pointer focus:ring-2 focus:ring-blue-200"
                    checked={values.isRunout || false}
                    onCheckedChange={(value) => onChange("isRunout", value)}
                  />
                  <Label htmlFor="isRunout" className="text-blue-900 font-medium">Is Runout</Label>
                </div>
                {values.isRunout === true && (
                  <div className="mb-2 w-full min-w-0">
                    <FilterPopover onChange={onChange} filter={filterConfig.find(f => f.key === "runOutBy")} selected={filterConfig.find(f => f.key === "runOutBy").options.find(o => o.id === values.runOutBy)} />
                  </div>
                )}
              </div>

              {/* Grouped: Is Dropped + Dropped By */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-3 mb-2 p-2 bg-white/70 rounded-lg shadow-sm w-full min-w-0">
                  <Switch
                    id="isDropped"
                    className="cursor-pointer focus:ring-2 focus:ring-blue-200"
                    checked={values.isDropped || false}
                    onCheckedChange={(value) => onChange("isDropped", value)}
                  />
                  <Label htmlFor="isDropped" className="text-blue-900 font-medium">Is Dropped</Label>
                </div>
                {values.isDropped === true && (
                  <div className="mb-2 w-full min-w-0">
                    <FilterPopover onChange={onChange} filter={filterConfig.find(f => f.key === "droppedBy")} selected={filterConfig.find(f => f.key === "droppedBy").options.find(o => o.id === values.droppedBy)} />
                  </div>
                )}
              </div>
            </div>}
        </div>
      </div>
    </div>
  )
}

export default Filters
