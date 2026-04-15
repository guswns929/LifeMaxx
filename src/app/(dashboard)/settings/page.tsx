"use client";

import { useState, useEffect, useCallback } from "react";
import {
  displayWeight,
  parseWeightInput,
  weightLabel,
  kgToLb,
  lbToKg,
  cmToInches,
  inchesToCm,
  type UnitSystem,
} from "@/lib/units";

interface UserSettings {
  name: string | null;
  sex: string | null;
  bodyWeightKg: number | null;
  heightCm: number | null;
  dateOfBirth: string | null;
  preferredUnits: UnitSystem;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [sex, setSex] = useState<"male" | "female" | "">("");
  const [weight, setWeight] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [heightCmInput, setHeightCmInput] = useState("");
  const [dob, setDob] = useState("");
  const [units, setUnits] = useState<UnitSystem>("imperial");
  const [whoopConnected, setWhoopConnected] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data: UserSettings = await res.json();
        setName(data.name || "");
        setSex((data.sex as "male" | "female" | "") || "");
        setUnits(data.preferredUnits || "imperial");

        if (data.bodyWeightKg != null) {
          const displayed = displayWeight(data.bodyWeightKg, data.preferredUnits || "imperial");
          setWeight(String(displayed));
        }

        if (data.heightCm != null) {
          if ((data.preferredUnits || "imperial") === "imperial") {
            const totalInches = cmToInches(data.heightCm);
            const feet = Math.floor(totalInches / 12);
            const inches = Math.round(totalInches % 12);
            setHeightFeet(String(feet));
            setHeightInches(String(inches));
          } else {
            setHeightCmInput(String(Math.round(data.heightCm)));
          }
        }

        if (data.dateOfBirth) {
          setDob(new Date(data.dateOfBirth).toISOString().split("T")[0]);
        }
      }

      // Check WHOOP connection
      try {
        const whoopRes = await fetch("/api/whoop/data");
        setWhoopConnected(whoopRes.ok);
      } catch {
        setWhoopConnected(false);
      }

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // When units toggle changes, convert displayed values
  const handleUnitsChange = (newUnits: UnitSystem) => {
    if (newUnits === units) return;

    if (weight) {
      const currentKg = parseWeightInput(parseFloat(weight), units);
      const newDisplay = displayWeight(currentKg, newUnits);
      setWeight(String(newDisplay));
    }

    if (units === "imperial" && newUnits === "metric") {
      // Convert feet/inches to cm
      const feet = parseFloat(heightFeet) || 0;
      const inches = parseFloat(heightInches) || 0;
      const totalInches = feet * 12 + inches;
      if (totalInches > 0) {
        setHeightCmInput(String(Math.round(inchesToCm(totalInches))));
      }
    } else if (units === "metric" && newUnits === "imperial") {
      // Convert cm to feet/inches
      const cm = parseFloat(heightCmInput) || 0;
      if (cm > 0) {
        const totalInches = cmToInches(cm);
        const feet = Math.floor(totalInches / 12);
        const inches = Math.round(totalInches % 12);
        setHeightFeet(String(feet));
        setHeightInches(String(inches));
      }
    }

    setUnits(newUnits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      // Convert weight to kg
      let bodyWeightKg: number | null = null;
      if (weight) {
        bodyWeightKg = parseWeightInput(parseFloat(weight), units);
      }

      // Convert height to cm
      let heightCm: number | null = null;
      if (units === "imperial") {
        const feet = parseFloat(heightFeet) || 0;
        const inches = parseFloat(heightInches) || 0;
        const totalInches = feet * 12 + inches;
        if (totalInches > 0) {
          heightCm = inchesToCm(totalInches);
        }
      } else {
        const cm = parseFloat(heightCmInput);
        if (cm > 0) heightCm = cm;
      }

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || null,
          sex: sex || null,
          bodyWeightKg,
          heightCm,
          dateOfBirth: dob || null,
          preferredUnits: units,
        }),
      });

      if (res.ok) {
        setSuccessMsg("Settings saved successfully!");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to save settings.");
      }
    } catch {
      setErrorMsg("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Settings</h1>

      {/* Profile Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-semibold text-text-primary">Profile</h2>

          {/* Units Toggle */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Preferred Units
            </label>
            <div className="flex gap-1 bg-surface-raised rounded-lg p-0.5 w-fit">
              <button
                type="button"
                onClick={() => handleUnitsChange("imperial")}
                className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  units === "imperial"
                    ? "bg-surface text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                Imperial (lb / ft)
              </button>
              <button
                type="button"
                onClick={() => handleUnitsChange("metric")}
                className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  units === "metric"
                    ? "bg-surface text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                Metric (kg / cm)
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full max-w-sm rounded-lg border border-border px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Sex */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Sex
            </label>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value as "male" | "female" | "")}
              className="w-full max-w-sm rounded-lg border border-border px-3 py-2 text-sm text-text-primary focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Body Weight */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Body Weight ({weightLabel(units)})
            </label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={units === "imperial" ? "185" : "84"}
              className="w-full max-w-sm rounded-lg border border-border px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Height */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Height
            </label>
            {units === "imperial" ? (
              <div className="flex gap-2 max-w-sm">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="8"
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(e.target.value)}
                      placeholder="5"
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                      ft
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="11"
                      value={heightInches}
                      onChange={(e) => setHeightInches(e.target.value)}
                      placeholder="10"
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                      in
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative max-w-sm">
                <input
                  type="number"
                  min="0"
                  max="250"
                  value={heightCmInput}
                  onChange={(e) => setHeightCmInput(e.target.value)}
                  placeholder="178"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                  cm
                </span>
              </div>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full max-w-sm rounded-lg border border-border px-3 py-2 text-sm text-text-primary focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-medium py-2 px-6 rounded-lg transition-colors text-sm"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
            {successMsg && (
              <span className="text-sm text-green-600">{successMsg}</span>
            )}
            {errorMsg && (
              <span className="text-sm text-red-500">{errorMsg}</span>
            )}
          </div>
        </div>
      </form>

      {/* WHOOP Connection Status */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-text-primary mb-4">
          WHOOP Connection
        </h2>
        {whoopConnected ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium text-text-primary">Connected</p>
                <p className="text-xs text-text-muted">
                  Your WHOOP account is linked
                </p>
              </div>
            </div>
            <a
              href="/whoop"
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Manage
            </a>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-text-muted" />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Not Connected
                </p>
                <p className="text-xs text-text-muted">
                  Link your WHOOP to track recovery and strain
                </p>
              </div>
            </div>
            <a
              href="/api/whoop/connect"
              className="bg-green-500 hover:bg-green-600 text-white font-medium py-1.5 px-4 rounded-lg transition-colors text-sm"
            >
              Connect
            </a>
          </div>
        )}
      </div>

    </div>
  );
}
