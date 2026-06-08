// EditClipForm.jsx
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import FilterPopover from '../components/ui/FilterPopOver';
import ModerationSection from '../components/ModerationSection';
import { API } from '../actions/userAction';
import { URL } from '../constants/userConstants';
import { useRef } from 'react';

// Predefined options (same as in Filters component)
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
];

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
    { id: "behind", name: "Behind" },
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
    { id: "well_timed", name: "Well Timed" },
    { id: "miscue", name: "Miscue" },
    { id: "mistimed", name: "Mistimed" },
    { id: "toe_end", name: "Toe End" },
    { id: "splice", name: "Splice" },
    { id: "top_edge", name: "Top Edge" },
    { id: "bottom_edge", name: "Bottom Edge" },
    { id: "inside_edge", name: "Inside Edge" },
    { id: "outside_edge", name: "Outside Edge" },
    { id: "nick", name: "Nick" },
    { id: "air_shot", name: "Air Shot" },
    { id: "beaten", name: "Beaten" },
    { id: "defensive_block", name: "Defensive Block" },
    { id: "other", name: "Other" }
];

const wicketTypes = [
    { id: "bowled", name: "Bowled" },
    { id: "caught", name: "Caught" },
    { id: "caught_bowled", name: "Caught & Bowled" },
    { id: "runout", name: "Run Out" },
    { id: "stumped", name: "Stumped" },
    { id: "lbw", name: "LBW" },
    { id: "hitwicket", name: "Hit Wicket" },
    { id: "obstructingthefield", name: "Obstructing the Field" },
    { id: "retiredhurt", name: "Retired Hurt" },
    { id: "timedout", name: "Timed Out" },
    { id: "keeperCatch", name: "Keeper Catch" }
];

const fetchMatchPlayers = async (matchId) => {
    if (!matchId) return [];
    try {
        const res = await API.get(`${URL}/getmatch/${matchId}`);
        return [...res.data.livematch.teamHomePlayers, ...res.data.livematch.teamAwayPlayers];
    } catch (err) {
        console.error("Failed to fetch match players", err);
        return [];
    }
};

function EditClipForm({ clip, onSave, matchPlayers: initialMatchPlayers, allPlayers = [] }) {
    const [form, setForm] = useState({ ...clip });
    const [matchPlayers, setMatchPlayers] = useState(initialMatchPlayers || []);
    const [loadingPlayers, setLoadingPlayers] = useState(false);
    const lastFetchedMatchId = useRef(null);

    // Effect for when there is no matchId
    useEffect(() => {
        if (!clip.matchId && allPlayers?.length) {
            setMatchPlayers(allPlayers.map(p => p.name || p).filter(Boolean));
        }
    }, [clip.matchId, allPlayers]);

    // Effect for fetching by matchId (depend only on matchId)
    useEffect(() => {
        if (!clip.matchId) return;
        if (initialMatchPlayers?.length) {
            setMatchPlayers(initialMatchPlayers);
            return;
        }
        if (lastFetchedMatchId.current === clip.matchId && matchPlayers.length) return;
        const load = async () => {
            setLoadingPlayers(true);
            try {
                const players = await fetchMatchPlayers(clip.matchId);
                setMatchPlayers(players.map(p => (typeof p === 'string' ? p : p.playerName)).filter(Boolean));
                lastFetchedMatchId.current = clip.matchId;
            } catch (err) {
                console.error(err);
                setMatchPlayers([]);
            } finally {
                setLoadingPlayers(false);
            }
        };
        load();
    }, [clip.matchId, initialMatchPlayers]); // no allPlayers here

    const playerOptions = matchPlayers.map(name => ({
        id: name?.toLowerCase(),
        name: name,
    }));

    const handleChange = (key, value) => {
        const labelFields = [
            'shotType', 'direction', 'ballType', 'lengthType', 'connection',
            'slowball', 'comesDown', 'powerplay', 'shotElevation',
            'wicketType', 'catchBy', 'runoutBy', 'stumpedBy', 'droppedBy',
            'lofted', 'dropped', 'runout', 'catch'
        ];
        if (key === 'flag') {
            setForm(prev => ({ ...prev, flag: { ...prev.flag, ...value } }));
        } else if (labelFields.includes(key)) {
            setForm(prev => ({
                ...prev,
                labels: { ...prev.labels, [key]: value }
            }));
        } else {
            setForm(prev => ({ ...prev, [key]: value }));
        }
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        handleChange(name, checked);
    };

    const handleSave = () => {
        onSave(form);
    };

    const getSelectedOption = (fieldName, optionsArray) => {
        const value = form.labels?.[fieldName] || form[fieldName];
        if (!value) return null;
        const found = optionsArray.find(opt => opt.id === value || opt.name === value);
        return found || { id: value, name: value };
    };

    // Helper for select components
    const renderSelect = (key, label, options, placeholder) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <Select
                value={form.labels?.[key] || ''}
                onValueChange={(val) => handleChange(key, val)}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>
                            {opt.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

    return (
        <div className="space-y-4 py-2">
            <DialogHeader>
                <DialogTitle>Edit Clip</DialogTitle>
                <DialogDescription>Update the clip metadata below.</DialogDescription>
            </DialogHeader>

            {/* Basic Info – player fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FilterPopover
                    filter={{ key: 'batsman', label: 'Batsman', options: playerOptions }}
                    selected={getSelectedOption('batsman', playerOptions)}
                    onChange={handleChange}
                />
                <FilterPopover
                    filter={{ key: 'bowler', label: 'Bowler', options: playerOptions }}
                    selected={getSelectedOption('bowler', playerOptions)}
                    onChange={handleChange}
                />
                <Input name="event" value={form.event || ''} onChange={(e) => handleChange('event', e.target.value)} placeholder="Event" />
                <Input name="over" value={form.over || ''} onChange={(e) => handleChange('over', e.target.value)} placeholder="Over" />
            </div>

            {/* Categorical fields as dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderSelect('shotType', 'Shot Type', shotTypes, 'Select shot type')}
                {renderSelect('direction', 'Direction', directionOptions, 'Select direction')}
                {renderSelect('ballType', 'Ball Type', ballTypes, 'Select ball type')}
                <Input name="lengthType" value={form.labels?.lengthType || ''} onChange={(e) => handleChange('lengthType', e.target.value)} placeholder="Length Type" />
                {renderSelect('connection', 'Connection', connectionOptions, 'Select connection')}
                <Input name="slowball" value={form.labels?.slowball || ''} onChange={(e) => handleChange('slowball', e.target.value)} placeholder="Slow Ball" />
                <Input name="comesDown" value={form.labels?.comesDown || ''} onChange={(e) => handleChange('comesDown', e.target.value)} placeholder="Comes Down" />
                <Input name="powerplay" value={form.labels?.powerplay || ''} onChange={(e) => handleChange('powerplay', e.target.value)} placeholder="Powerplay" />
                <Input name="shotElevation" value={form.labels?.shotElevation || ''} onChange={(e) => handleChange('shotElevation', e.target.value)} placeholder="Shot Elevation" />
            </div>

            {/* Dismissal fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderSelect('wicketType', 'Wicket Type', wicketTypes, 'Select wicket type')}
                <FilterPopover
                    filter={{ key: 'catchBy', label: 'Caught By', options: playerOptions }}
                    selected={getSelectedOption('catchBy', playerOptions)}
                    onChange={handleChange}
                />
                <FilterPopover
                    filter={{ key: 'runoutBy', label: 'Runout By', options: playerOptions }}
                    selected={getSelectedOption('runoutBy', playerOptions)}
                    onChange={handleChange}
                />
                <FilterPopover
                    filter={{ key: 'stumpedBy', label: 'Stumped By', options: playerOptions }}
                    selected={getSelectedOption('stumpedBy', playerOptions)}
                    onChange={handleChange}
                />
                <FilterPopover
                    filter={{ key: 'droppedBy', label: 'Dropped By', options: playerOptions }}
                    selected={getSelectedOption('droppedBy', playerOptions)}
                    onChange={handleChange}
                />
            </div>

            {loadingPlayers && <p className="text-xs text-gray-500">Loading match players…</p>}

            {/* Boolean Flags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center gap-2">
                    <input type="checkbox" name="lofted" checked={form.labels?.lofted || false} onChange={handleCheckboxChange} />
                    Lofted
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" name="dropped" checked={form.labels?.dropped || false} onChange={handleCheckboxChange} />
                    Dropped
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" name="runout" checked={form.labels?.runout || false} onChange={handleCheckboxChange} />
                    Runout
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" name="catch" checked={form.labels?.catch || false} onChange={handleCheckboxChange} />
                    Catch
                </label>
            </div>

            {/* Moderation Section (separate component) */}
            <ModerationSection form={form} onChange={handleChange} />

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogClose>
            </div>
        </div>
    );
}

export default EditClipForm;