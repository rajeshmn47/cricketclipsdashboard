// components/ModerationSection.jsx
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function ModerationSection({ form, onChange }) {
  return (
    <div className="border-t pt-4 mt-2">
      <h4 className="text-sm font-semibold text-blue-900 mb-3">Moderation & Flags</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Reported */}
        <div className="flex items-center justify-between p-2 bg-white/70 rounded-lg">
          <Label>Reported</Label>
          <Switch
            checked={form.reported || false}
            onCheckedChange={(val) => onChange('reported', val)}
          />
        </div>

        {/* Flagged */}
        <div className="flex items-center justify-between p-2 bg-white/70 rounded-lg">
          <Label>Flagged</Label>
          <Switch
            checked={form.flag?.isFlagged || false}
            onCheckedChange={(val) => onChange('flag', { ...form.flag, isFlagged: val })}
          />
        </div>

        {/* Flag Reason (only if flagged) */}

        <>
          <div className="col-span-1 sm:col-span-2">
            <Label className="mb-1 block">Flag Reason</Label>
            <Select
              value={form.flag?.reason || ""}
              onValueChange={(val) => onChange('flag', { ...form.flag, reason: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="label_conflict">Label Conflict</SelectItem>
                <SelectItem value="video_mismatch">Video Mismatch</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="half_clip">Half Clip</SelectItem>
                <SelectItem value="multiple_clips">Multiple Clips</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Review Status */}
          <div className="col-span-1 sm:col-span-2">
            <Label className="mb-1 block">Review Status</Label>
            <Select
              value={form.flag?.reviewStatus || "pending"}
              onValueChange={(val) => onChange('flag', { ...form.flag, reviewStatus: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="fixed">Fixed</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      </div>
    </div>
  );
}