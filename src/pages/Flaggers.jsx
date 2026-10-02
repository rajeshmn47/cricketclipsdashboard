import { useEffect, useState, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    ShieldAlert, User, AlertTriangle, CheckCircle2, XCircle,
    Ban, Loader2, RefreshCw, ArrowLeft, Clock, MessageSquare,
    Flag, Search, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API } from "../actions/userAction";
import { NEW_URL, URL } from "../constants/userConstants";

/* ============================================================
   Constants
   ============================================================ */

const REASON_LABELS = {
    label_conflict: "Label Conflict",
    video_mismatch: "Video Mismatch",
    half_clip: "Half Clip",
    multiple_clips: "Multiple Clips",
    wrong_player: "Wrong Player",
    wrong_event: "Wrong Event",
    bad_quality: "Bad Quality",
    duplicate: "Duplicate",
    manual: "Manual Review",
    other: "Other",
};

const REASON_COLORS = {
    label_conflict: "bg-amber-100 text-amber-800 border-amber-200",
    video_mismatch: "bg-red-100 text-red-800 border-red-200",
    half_clip: "bg-orange-100 text-orange-800 border-orange-200",
    multiple_clips: "bg-purple-100 text-purple-800 border-purple-200",
    wrong_player: "bg-blue-100 text-blue-800 border-blue-200",
    wrong_event: "bg-indigo-100 text-indigo-800 border-indigo-200",
    bad_quality: "bg-gray-100 text-gray-800 border-gray-200",
    duplicate: "bg-pink-100 text-pink-800 border-pink-200",
    manual: "bg-cyan-100 text-cyan-800 border-cyan-200",
    other: "bg-slate-100 text-slate-800 border-slate-200",
};

/* ============================================================
   Main Page
   ============================================================ */

export default function FlaggedClipsPage() {
    const navigate = useNavigate();
    const { user } = useSelector((s) => s.user || {});
    const isAdmin = user?.role === "admin" || user?.role === "user";

    const [flaggers, setFlaggers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);

    const [selectedFlagger, setSelectedFlagger] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("pending");

    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // 🆕 Confirmation state
    const [banTarget, setBanTarget] = useState(null);         // { userId, username, email, flagsCount, onSuccess? }
    const [unbanTarget, setUnbanTarget] = useState(null);     // { userId, username }
    const [acceptTarget, setAcceptTarget] = useState(null);   // { flagger, clip } — only set when flagger is banned

    /* ---------------- Fetch ---------------- */

    const fetchFlaggers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (searchTerm.trim()) params.append("search", searchTerm.trim());
            params.append("sort", sortBy);

            const res = await API.get(`${URL}/clips/flaggers?${params.toString()}`);
            setFlaggers(res.data.flaggers || []);
            setStats(res.data.stats || null);
        } catch (e) {
            console.error(e);
            setError(e.response?.data?.error || "Failed to load flaggers");
        } finally {
            setLoading(false);
        }
    }, [searchTerm, sortBy]);

    useEffect(() => { fetchFlaggers(); }, [fetchFlaggers]);

    /* ---------------- Toast ---------------- */

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 2500);
    };

    /* ---------------- Ban / Unban flows ---------------- */

    const requestBan = (userId, userName, email, flagsCount) => {
        if (!isAdmin) return;
        setBanTarget({ userId, username: userName, email, flagsCount });
    };

    const confirmBan = async () => {
        if (!banTarget) return;
        setActionLoading(true);
        try {
            await API.post(`${URL}/clips/ban/${banTarget.userId}`, {
                reason: "Wrong flag reason",
            });
            showToast(`${banTarget.username || "User"} banned`);
            setBanTarget(null);
            fetchFlaggers();
            setSelectedFlagger(null);
        } catch (e) {
            console.error(e);
            showToast("Failed to ban user", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const requestUnban = (userId, userName) => {
        if (!isAdmin) return;
        setUnbanTarget({ userId, username: userName });
    };

    const confirmUnban = async () => {
        if (!unbanTarget) return;
        setActionLoading(true);
        try {
            await API.post(`${URL}/unban/${unbanTarget.userId}`);
            showToast(`${unbanTarget.username || "User"} unbanned`);
            setUnbanTarget(null);
            fetchFlaggers();
            setSelectedFlagger(null);
        } catch (e) {
            console.error(e);
            showToast("Failed to unban user", "error");
        } finally {
            setActionLoading(false);
        }
    };

    /* ---------------- Accept flag (with banned-user check) ---------------- */

    const requestAcceptFlag = (flagger, clip) => {
        if (!isAdmin) return;

        // 🆕 If the flagger is banned, require extra confirmation
        if (flagger.banned) {
            setAcceptTarget({ flagger, clip });
            return;
        }

        // Otherwise, accept directly
        doAcceptFlag(flagger, clip);
    };

    const doAcceptFlag = async (flagger, clip) => {
        setActionLoading(true);
        try {
            await API.put(`${URL}/clips/update-clip/${clip._id}`, {
                flag: {
                    ...clip.flag,
                    reviewStatus: "fixed",
                    reviewedAt: new Date(),
                },
            });
            showToast("Flag accepted");
            setAcceptTarget(null);
            fetchFlaggers();
        } catch (e) {
            console.error(e);
            showToast("Failed to accept flag", "error");
        } finally {
            setActionLoading(false);
        }
    };

    /* ---------------- Derived ---------------- */

    const visibleFlaggers = useMemo(() => {
        if (!searchTerm.trim()) return flaggers;
        const term = searchTerm.trim().toLowerCase();
        return flaggers.filter((f) =>
            `${f.username || ""} ${f.email || ""}`.toLowerCase().includes(term)
        );
    }, [flaggers, searchTerm]);

    /* ============================================================
       Render
       ============================================================ */

    return (
        <div className="min-h-screen bg-gray-50">
            {toast && (
                <div
                    className={`fixed top-20 right-4 z-[70] px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === "error"
                            ? "bg-red-600 text-white"
                            : "bg-green-600 text-white"
                        }`}
                >
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                            title="Back"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
                                <ShieldAlert className="w-6 h-6 text-red-500" />
                                Flag Moderation
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500">
                                Review who's flagging and why
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={fetchFlaggers}
                        disabled={loading}
                        className="flex items-center gap-1.5"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <StatsRow stats={stats} loading={loading} />

                {/* Search + sort */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Search flagger by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="border rounded-md px-3 py-2 text-sm bg-white"
                    >
                        <option value="pending">Most pending flags</option>
                        <option value="total">Most total flags</option>
                        <option value="accuracy">Lowest accuracy</option>
                        <option value="recent">Most recent activity</option>
                    </select>
                </div>

                {loading ? (
                    <LoadingState />
                ) : error ? (
                    <ErrorState error={error} onRetry={fetchFlaggers} />
                ) : visibleFlaggers.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="space-y-3">
                        {visibleFlaggers.map((flagger) => (
                            <FlaggerRow
                                key={flagger._id}
                                flagger={flagger}
                                onOpen={() => setSelectedFlagger(flagger)}
                                onBan={() =>
                                    requestBan(
                                        flagger._id,
                                        flagger.username,
                                        flagger.email,
                                        flagger.totalCount
                                    )
                                }
                                onUnban={() => requestUnban(flagger._id, flagger.username)}
                                isAdmin={isAdmin}
                                actionLoading={actionLoading}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Detail drawer */}
            {selectedFlagger && (
                <FlaggerDetailDrawer
                    flagger={selectedFlagger}
                    isAdmin={isAdmin}
                    onClose={() => setSelectedFlagger(null)}
                    onBan={(id, name) =>
                        requestBan(id, name, selectedFlagger.email, selectedFlagger.totalCount)
                    }
                    onUnban={requestUnban}
                    onAcceptFlag={(clip) => requestAcceptFlag(selectedFlagger, clip)}
                    actionLoading={actionLoading}
                />
            )}

            {/* 🆕 Ban confirmation modal */}
            {banTarget && (
                <BanConfirmModal
                    target={banTarget}
                    onCancel={() => setBanTarget(null)}
                    onConfirm={confirmBan}
                    loading={actionLoading}
                />
            )}

            {/* 🆕 Unban confirmation modal */}
            {unbanTarget && (
                <ConfirmModal
                    title="Unban user?"
                    message={`Unban ${unbanTarget.username || "this user"}? They will be able to flag and edit clips again.`}
                    confirmLabel="Unban"
                    confirmClass="bg-green-600 hover:bg-green-700 text-white"
                    onCancel={() => setUnbanTarget(null)}
                    onConfirm={confirmUnban}
                    loading={actionLoading}
                />
            )}

            {/* 🆕 Accept flag from banned user — verify before accepting */}
            {acceptTarget && (
                <AcceptBannedFlagModal
                    flagger={acceptTarget.flagger}
                    clip={acceptTarget.clip}
                    onCancel={() => setAcceptTarget(null)}
                    onConfirm={() => doAcceptFlag(acceptTarget.flagger, acceptTarget.clip)}
                    loading={actionLoading}
                />
            )}
        </div>
    );
}

/* ============================================================
   Ban Confirmation Modal
   ============================================================ */

function BanConfirmModal({ target, onCancel, onConfirm, loading }) {
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-red-50 border-b border-red-100 px-6 py-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <Ban className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-red-900 text-lg">Ban this user?</h3>
                        <p className="text-xs text-red-700">
                            This action can be reversed later.
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* User card */}
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center font-semibold">
                            {(target.username || "?")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                                {target.username || "Unknown user"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {target.email || "—"}
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-xs text-gray-500">Total flags</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {target.flagsCount ?? 0}
                            </p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                            <p className="text-xs text-red-600">Effect</p>
                            <p className="text-sm font-medium text-red-700 mt-0.5">
                                Cannot flag or edit clips
                            </p>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p>
                            Make sure this is the same user who submitted the wrong flag.
                            Bans apply to their entire account.
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                    <Button variant="outline" onClick={onCancel} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Banning…
                            </>
                        ) : (
                            <>
                                <Ban className="w-4 h-4" /> Ban user
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   Generic confirmation modal
   ============================================================ */

function ConfirmModal({ title, message, confirmLabel, confirmClass, onCancel, onConfirm, loading }) {
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
                <div className="p-6 space-y-3">
                    <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
                    <p className="text-sm text-gray-600">{message}</p>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                    <Button variant="outline" onClick={onCancel} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} disabled={loading} className={confirmClass}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   Accept-flag-from-banned-user modal
   ============================================================ */

function AcceptBannedFlagModal({ flagger, clip, onCancel, onConfirm, loading }) {
    const sameUser =
        flagger?.username &&
        clip?.flag?.flaggedBy &&
        // if flaggedBy was populated, compare
        (typeof clip.flag.flaggedBy === "object"
            ? clip.flag.flaggedBy.username === flagger.username
            : true); // if not populated, fall back to true

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                <div className="bg-amber-50 border-b border-amber-100 px-6 py-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-amber-900 text-lg">
                            Flagger is banned
                        </h3>
                        <p className="text-xs text-amber-700">
                            Verify this flag belongs to them before accepting.
                        </p>
                    </div>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {/* Flagger identity */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Flag submitted by</p>
                        <p className="text-sm font-medium text-gray-900">
                            {flagger.username || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500">{flagger.email || "—"}</p>
                    </div>

                    {/* Clip info */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Clip</p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {clip.batsman} <span className="text-gray-400">vs</span> {clip.bowler}
                        </p>
                        <p className="text-xs text-gray-500">
                            {clip.event} · {clip.over}
                        </p>
                    </div>

                    {/* Verification */}
                    <div className="flex items-start gap-2 text-xs text-gray-700 bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                        <p>
                            Confirm this is the same user. If the flagger details don't match,
                            cancel and re-check the flag source.
                        </p>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                    <Button variant="outline" onClick={onCancel} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={loading || !sameUser}
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Accepting…
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" /> Accept flag
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   Stats / list / rows
   ============================================================ */

function StatsRow({ stats, loading }) {
    const items = [
        { label: "Total flags", value: stats?.totalFlags, icon: Flag, color: "text-blue-600 bg-blue-50" },
        { label: "Unique flaggers", value: stats?.uniqueFlaggers, icon: User, color: "text-purple-600 bg-purple-50" },
        { label: "Pending review", value: stats?.pending, icon: Clock, color: "text-yellow-600 bg-yellow-50" },
        { label: "Banned users", value: stats?.banned, icon: Ban, color: "text-red-600 bg-red-50" },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((it) => (
                <div key={it.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${it.color}`}>
                        <it.icon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">{it.label}</p>
                        <p className="text-xl font-semibold text-gray-900">
                            {loading ? "—" : it.value ?? 0}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function FlaggerRow({ flagger, onOpen, onBan, onUnban, isAdmin, actionLoading }) {
    const accepted = flagger.acceptedCount || 0;
    const dismissed = flagger.dismissedCount || 0;
    const pending = flagger.pendingCount || 0;
    const total = flagger.totalCount || 0;
    const decided = accepted + dismissed;
    const accuracy = decided > 0 ? (accepted / decided) * 100 : null;
    const isRisky = dismissed >= 3 && accuracy !== null && accuracy < 50;

    return (
        <div
            className={`bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow ${flagger.banned
                    ? "border-red-200 bg-red-50/50"
                    : isRisky
                        ? "border-amber-200"
                        : "border-gray-200"
                }`}
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center font-semibold flex-shrink-0">
                    {(flagger.username || "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                            {flagger.username || "Unknown"}
                        </p>
                        {flagger.banned && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                                BANNED
                            </span>
                        )}
                        {isRisky && !flagger.banned && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                RISKY
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{flagger.email || "—"}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
                <StatPill label="Total" value={total} color="bg-gray-100 text-gray-700" />
                <StatPill label="Pending" value={pending} color="bg-yellow-100 text-yellow-800" />
                <StatPill label="Accepted" value={accepted} color="bg-green-100 text-green-800" />
                <StatPill label="Dismissed" value={dismissed} color="bg-red-100 text-red-800" />
                {accuracy !== null && (
                    <StatPill
                        label="Accuracy"
                        value={`${accuracy.toFixed(0)}%`}
                        color={
                            accuracy >= 80
                                ? "bg-green-100 text-green-800"
                                : accuracy >= 50
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800"
                        }
                    />
                )}
            </div>

            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onOpen} className="flex items-center gap-1">
                    <Eye className="w-4 h-4" /> View flags
                </Button>

                {isAdmin && !flagger.banned && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onBan}
                        disabled={actionLoading}
                        className="border-red-300 text-red-600 hover:bg-red-50 flex items-center gap-1"
                    >
                        <Ban className="w-4 h-4" /> Ban
                    </Button>
                )}

                {isAdmin && flagger.banned && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onUnban}
                        disabled={actionLoading}
                        className="border-green-300 text-green-600 hover:bg-green-50 flex items-center gap-1"
                    >
                        <CheckCircle2 className="w-4 h-4" /> Unban
                    </Button>
                )}
            </div>
        </div>
    );
}

function StatPill({ label, value, color }) {
    return (
        <span className={`px-2 py-0.5 rounded-md font-medium ${color}`}>
            <span className="opacity-70">{label}:</span> {value}
        </span>
    );
}

/* ============================================================
   Detail drawer (updated to call requestAcceptFlag via prop)
   ============================================================ */

function FlaggerDetailDrawer({
    flagger,
    isAdmin,
    onClose,
    onBan,
    onUnban,
    onAcceptFlag,
    actionLoading,
}) {
    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-3xl bg-white shadow-2xl overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center font-semibold">
                            {(flagger.username || "?")[0].toUpperCase()}
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                {flagger.username || "Unknown"}
                                {flagger.banned && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                                        BANNED
                                    </span>
                                )}
                            </h2>
                            <p className="text-xs text-gray-500">{flagger.email || "—"}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 text-gray-600">
                        ✕
                    </button>
                </div>

                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <BigStat label="Total flags" value={flagger.totalCount} />
                        <BigStat label="Pending" value={flagger.pendingCount} color="text-yellow-600" />
                        <BigStat label="Accepted" value={flagger.acceptedCount} color="text-green-600" />
                        <BigStat label="Dismissed" value={flagger.dismissedCount} color="text-red-600" />
                    </div>
                </div>

                {isAdmin && (
                    <div className="p-5 border-b border-gray-100 flex gap-2">
                        {!flagger.banned ? (
                            <Button
                                onClick={() => onBan(flagger._id, flagger.username)}
                                disabled={actionLoading}
                                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                            >
                                <Ban className="w-4 h-4" /> Ban this user
                            </Button>
                        ) : (
                            <Button
                                onClick={() => onUnban(flagger._id, flagger.username)}
                                disabled={actionLoading}
                                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Unban this user
                            </Button>
                        )}
                    </div>
                )}

                <div className="p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Flag className="w-4 h-4" />
                        Flags submitted ({flagger.flags?.length || 0})
                    </h3>
                    <div className="space-y-3">
                        {flagger.flags?.map((clip) => (
                            <FlagItem
                                key={clip._id}
                                clip={clip}
                                isAdmin={isAdmin}
                                onAccept={() => onAcceptFlag(clip)}
                                flaggerBanned={flagger.banned}
                                actionLoading={actionLoading}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

function BigStat({ label, value, color = "text-gray-900" }) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-xl font-semibold ${color}`}>{value ?? 0}</p>
        </div>
    );
}

function FlagItem({ clip, isAdmin, onAccept, flaggerBanned, actionLoading }) {
    const reason = clip.flag?.reason || "other";
    const reasonLabel = REASON_LABELS[reason] || reason;
    const reasonColor = REASON_COLORS[reason] || REASON_COLORS.other;
    const status = clip.flag?.reviewStatus || "pending";

    const statusColor =
        status === "fixed"
            ? "bg-green-100 text-green-800 border-green-200"
            : status === "dismissed"
                ? "bg-gray-100 text-gray-600 border-gray-200"
                : "bg-yellow-100 text-yellow-800 border-yellow-200";

    return (
        <div className="flex gap-3 bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
            <div className="w-28 h-20 bg-black rounded-md overflow-hidden flex-shrink-0">
                <video
                    src={`${NEW_URL}/mockvideos/${clip.clip}`}
                    preload="metadata"
                    muted
                    className="w-full h-full object-contain"
                />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${reasonColor}`}>
                        {reasonLabel}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}>
                        {status}
                    </span>
                    {flaggerBanned && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200">
                            Banned flagger
                        </span>
                    )}
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">
                    {clip.batsman} <span className="text-gray-400">vs</span> {clip.bowler}
                </p>
                <p className="text-xs text-gray-500 truncate">
                    {clip.event} · {clip.over}
                </p>
                {clip.flag?.details && (
                    <p className="text-xs text-gray-600 italic mt-1 line-clamp-1">
                        "{clip.flag.details}"
                    </p>
                )}
                {clip.flag?.flaggedAt && (
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(clip.flag.flaggedAt).toLocaleString()}
                    </p>
                )}

                {/* 🆕 Accept action (only when pending) */}
                {isAdmin && status === "pending" && (
                    <div className="mt-2 flex gap-2">
                        <Button
                            size="sm"
                            onClick={onAccept}
                            disabled={actionLoading}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs flex items-center gap-1"
                        >
                            <CheckCircle2 className="w-3 h-3" />
                            Accept flag
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ============================================================
   Misc
   ============================================================ */

function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-500 mt-3">Loading flaggers…</p>
        </div>
    );
}

function ErrorState({ error, onRetry }) {
    return (
        <div className="text-center py-20">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-gray-800 font-medium">Something went wrong</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
            <Button onClick={onRetry} className="mt-4">Retry</Button>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="text-center py-20">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-800 font-medium">All clear!</p>
            <p className="text-sm text-gray-500 mt-1">
                No flaggers match the current filters.
            </p>
        </div>
    );
}