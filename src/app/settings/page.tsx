"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/useSession";
import { Avatar, PFP_PRESETS } from "@/components/Avatar";

export default function SettingsPage() {
  const { user, loading, refresh } = useSession();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pfp, setPfp] = useState<string | null>(null);

  const [usernameMsg, setUsernameMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pfpMsg, setPfpMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (user) {
      setUsername(user.username);
      setPfp(user.pfp);
    }
  }, [user, loading, router]);

  async function update(body: Record<string, unknown>) {
    const res = await fetch("/api/settings/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  }

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUsernameMsg(null);
    const { ok, data } = await update({ newUsername: username });
    if (!ok) {
      setUsernameMsg({ type: "err", text: data.error });
      return;
    }
    setUsernameMsg({ type: "ok", text: "Username updated." });
    await refresh();
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);
    const { ok, data } = await update({ currentPassword, newPassword });
    if (!ok) {
      setPasswordMsg({ type: "err", text: data.error });
      return;
    }
    setPasswordMsg({ type: "ok", text: "Password updated." });
    setCurrentPassword("");
    setNewPassword("");
  }

  async function handlePfpSelect(key: string) {
    setPfp(key);
    setPfpMsg(null);
    const { ok, data } = await update({ pfp: key });
    if (!ok) {
      setPfpMsg({ type: "err", text: data.error });
      return;
    }
    setPfpMsg({ type: "ok", text: "Profile picture updated." });
    await refresh();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 180_000) {
      setPfpMsg({ type: "err", text: "Please choose an image under ~180KB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPfp(dataUrl);
      const { ok, data } = await update({ pfp: dataUrl });
      if (!ok) {
        setPfpMsg({ type: "err", text: data.error });
        return;
      }
      setPfpMsg({ type: "ok", text: "Profile picture updated." });
      await refresh();
    };
    reader.readAsDataURL(file);
  }

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="glass-panel mx-auto h-3 w-48 overflow-hidden rounded-full">
          <div className="h-full w-1/2 shimmer-bar animate-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="mb-8 text-center text-3xl font-extrabold text-sky-900">Settings</h1>

      {/* PFP */}
      <section className="glass-panel-strong mb-6 p-6">
        <h2 className="mb-4 text-lg font-bold text-sky-900">Profile picture</h2>
        <div className="mb-4 flex justify-center">
          <Avatar pfp={pfp} size={80} />
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {PFP_PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => handlePfpSelect(p.key)}
              className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-xl ${
                pfp === p.key ? "border-sky-500" : "border-white/70"
              }`}
              style={{ background: p.gradient }}
              aria-label={p.key}
            >
              {p.emoji}
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-center">
          <label className="btn-secondary cursor-pointer text-sm">
            Upload image
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
        </div>
        {pfpMsg && (
          <p className={`mt-3 text-center text-sm ${pfpMsg.type === "ok" ? "text-emerald-600" : "text-red-600"}`}>
            {pfpMsg.text}
          </p>
        )}
      </section>

      {/* Username */}
      <section className="glass-panel-strong mb-6 p-6">
        <h2 className="mb-4 text-lg font-bold text-sky-900">Username</h2>
        <form onSubmit={handleUsernameSubmit} className="flex flex-col gap-3">
          <input
            className="input-aero"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={20}
          />
          {usernameMsg && (
            <p className={`text-sm ${usernameMsg.type === "ok" ? "text-emerald-600" : "text-red-600"}`}>
              {usernameMsg.text}
            </p>
          )}
          <button type="submit" className="btn-glossy self-start">
            Save username
          </button>
        </form>
      </section>

      {/* Password */}
      <section className="glass-panel-strong p-6">
        <h2 className="mb-4 text-lg font-bold text-sky-900">Password</h2>
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
          <input
            className="input-aero"
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <input
            className="input-aero"
            type="password"
            placeholder="New password (min 6 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
          />
          {passwordMsg && (
            <p className={`text-sm ${passwordMsg.type === "ok" ? "text-emerald-600" : "text-red-600"}`}>
              {passwordMsg.text}
            </p>
          )}
          <button type="submit" className="btn-glossy self-start">
            Update password
          </button>
        </form>
      </section>
    </div>
  );
}
