import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type Mode = "signin" | "signup";

export default function Profile() {
  const { user, loading, signOut } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [checkingRole, setCheckingRole] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      setCheckingRole(true);

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!error && !!data);
      setCheckingRole(false);
    };

    check();
  }, [user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <video className="h-full w-full object-cover" src="/normal-bg.mp4" autoPlay muted loop playsInline />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1">
          <div className="h-20" />

          <div className="mx-auto max-w-3xl px-6 py-10">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">Profile</h1>
            <p className="mt-2 text-white/70">Sign in to view your purchased songs and order history.</p>

            {/* Loading */}
            {loading ? (
              <div className="mt-10 rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xl p-6 text-white/70">
                Loading session…
              </div>
            ) : user ? (
              /* Logged in */
              <div className="mt-10 rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-white/60">Signed in as</div>
                    <div className="mt-1 font-semibold">{user.email}</div>
                  </div>

                  <button
                    onClick={() => signOut()}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition"
                  >
                    Sign out
                  </button>
                </div>

                {/* Admin button (admins only) */}
                <div className="mt-6 flex items-center gap-3">
                  {checkingRole ? (
                    <div className="text-sm text-white/60">Checking role…</div>
                  ) : isAdmin ? (
                    <NavLink
                      to="/admin"
                      className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-extrabold uppercase tracking-tight hover:bg-white/15 transition"
                    >
                      Go to Admin Panel
                    </NavLink>
                  ) : null}

                  {!checkingRole && !isAdmin && <div className="text-sm text-white/60">(No admin access)</div>}
                </div>

                {/* ✅ Real links */}
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <NavLink
                    to="/purchased"
                    className="group rounded-2xl border border-white/10 bg-black/30 p-5 hover:bg-black/40 hover:border-white/15 transition"
                  >
                    <h2 className="text-lg font-bold">Purchased songs</h2>
                    <p className="mt-2 text-sm text-white/60">
                      View everything you own (pulled from <span className="text-white/80">user_purchases</span>).
                    </p>
                    <div className="mt-4 inline-flex items-center rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold group-hover:bg-white/15 transition">
                      View library
                    </div>
                  </NavLink>

                  <NavLink
                    to="/orders"
                    className="group rounded-2xl border border-white/10 bg-black/30 p-5 hover:bg-black/40 hover:border-white/15 transition"
                  >
                    <h2 className="text-lg font-bold">Purchase history</h2>
                    <p className="mt-2 text-sm text-white/60">
                      View your orders and totals (from <span className="text-white/80">orders</span> +{" "}
                      <span className="text-white/80">order_items</span>).
                    </p>
                    <div className="mt-4 inline-flex items-center rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold group-hover:bg-white/15 transition">
                      View orders
                    </div>
                  </NavLink>
                </div>

                <div className="mt-4 text-xs text-white/50">
                  If you don’t see anything, you haven’t checked out yet. Go press “Checkout (Fake)” like you mean it.
                </div>
              </div>
            ) : (
              /* Logged out */
              <div className="mt-10 rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xl overflow-hidden">
                <div className="flex">
                  <button
                    className={`flex-1 px-4 py-3 text-sm font-bold border-b border-white/10 ${
                      mode === "signin" ? "bg-white/5 text-white" : "text-white/70 hover:text-white"
                    }`}
                    onClick={() => setMode("signin")}
                    type="button"
                  >
                    Sign in
                  </button>
                  <button
                    className={`flex-1 px-4 py-3 text-sm font-bold border-b border-white/10 ${
                      mode === "signup" ? "bg-white/5 text-white" : "text-white/70 hover:text-white"
                    }`}
                    onClick={() => setMode("signup")}
                    type="button"
                  >
                    Sign up
                  </button>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-4">
                  {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-white/60 mb-2">Email</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      required
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white/90 outline-none focus:border-teal-400/40 focus:ring-2 focus:ring-teal-400/15"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white/60 mb-2">Password</label>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      required
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white/90 outline-none focus:border-teal-400/40 focus:ring-2 focus:ring-teal-400/15"
                      placeholder="At least 6 characters"
                    />
                  </div>

                  <button
                    disabled={submitting}
                    className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-extrabold uppercase tracking-tight hover:bg-white/15 transition disabled:opacity-60"
                    type="submit"
                  >
                    {submitting ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
                  </button>

                  {mode === "signup" && (
                    <p className="text-xs text-white/50">
                      If email confirmations are enabled, you’ll need to verify before signing in.
                    </p>
                  )}
                </form>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
