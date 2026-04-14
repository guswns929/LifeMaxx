"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type UnitSystem = "imperial" | "metric";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<UnitSystem>("imperial");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [bodyWeight, setBodyWeight] = useState("");
  const [height, setHeight] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          sex,
          bodyWeight: bodyWeight ? parseFloat(bodyWeight) : undefined,
          height: height ? parseFloat(height) : undefined,
          dateOfBirth: dateOfBirth || undefined,
          units,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }

      router.push("/login");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className="mb-6 text-xl font-semibold text-text-primary">
        Create account
      </h2>

      {error && (
        <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="mb-1 block text-sm font-medium text-text-secondary"
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Your name"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-text-secondary"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-text-secondary"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="At least 6 characters"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Sex
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSex("male")}
              className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                sex === "male"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-background text-text-secondary hover:border-accent/40"
              }`}
            >
              Male
            </button>
            <button
              type="button"
              onClick={() => setSex("female")}
              className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                sex === "female"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-background text-text-secondary hover:border-accent/40"
              }`}
            >
              Female
            </button>
          </div>
        </div>

        {/* Unit toggle */}
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Units
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUnits("imperial")}
              className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                units === "imperial"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-background text-text-secondary hover:border-accent/40"
              }`}
            >
              Imperial
            </button>
            <button
              type="button"
              onClick={() => setUnits("metric")}
              className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                units === "metric"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-background text-text-secondary hover:border-accent/40"
              }`}
            >
              Metric
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="bodyWeight"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Body weight ({units === "imperial" ? "lb" : "kg"})
            </label>
            <input
              id="bodyWeight"
              type="number"
              step="0.1"
              min="0"
              value={bodyWeight}
              onChange={(e) => setBodyWeight(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder={units === "imperial" ? "e.g. 175" : "e.g. 80"}
            />
          </div>

          <div>
            <label
              htmlFor="height"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Height ({units === "imperial" ? "in" : "cm"})
            </label>
            <input
              id="height"
              type="number"
              step="0.1"
              min="0"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder={units === "imperial" ? "e.g. 70" : "e.g. 178"}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="dateOfBirth"
            className="mb-1 block text-sm font-medium text-text-secondary"
          >
            Date of birth
          </label>
          <input
            id="dateOfBirth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-accent hover:text-accent-dark"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
