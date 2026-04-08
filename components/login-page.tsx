"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Users, Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!identifier || !password) {
      setError("Por favor ingresa tus credenciales.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("confirm") || error.message.toLowerCase().includes("confirmar")) {
          setError("Por favor, confirma tu correo antes de entrar");
        } else {
          setError(error.message || "Credenciales inválidas");
        }
        setLoading(false);
        return;
      }

      if (!data?.session || !data.session.user) {
        setError("No se pudo iniciar sesión. Intenta de nuevo.");
        setLoading(false);
        return;
      }

      const userEmail = data.session.user.email ?? identifier.trim().toLowerCase();
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id, full_name, avatar_icon, role, email")
        .eq("email", userEmail)
        .single();

      if (profileError || !profile) {
        setError("No se pudo cargar el perfil del usuario.");
        setLoading(false);
        return;
      }

      const targetRoute = profile.role === "admin" ? "/dashboard/metricas" : "/dashboard/tickets";
      router.push(targetRoute);
    } catch (e) {
      console.error("Login error:", e);
      setError("Ocurrió un error inesperado. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background">
      {/* ─── MOBILE BRANDING HEADER (visible only on < lg) ─── */}
      <div className="lg:hidden flex items-center justify-center gap-3 py-5 border-b border-border bg-card">
        <div className="p-2 rounded-lg border border-border bg-muted/50">
          <Ticket size={20} className="text-foreground" />
        </div>
        <span className="text-lg font-bold text-foreground">Ticket List</span>
      </div>

      {/* ─── LEFT PANEL ─── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden bg-card border-r border-border">
        {/* Subtle noise / grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 40px)",
          }}
        />

        {/* Top-left badge */}
        <div className="relative z-10 p-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users size={16} className="text-muted-foreground" />
            <span>Equipo de desarrolladores</span>
          </div>
        </div>

        {/* Center branding */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-12">
          {/* Ticket icon + title */}
          <div className="flex items-center gap-4 mb-12">
            <div className="p-3 rounded-xl border border-border bg-muted/50">
              <Ticket size={40} className="text-foreground" />
            </div>
            <span className="text-5xl font-bold text-foreground tracking-tight" style={{ fontWeight: 800 }}>
              Ticket List
            </span>
          </div>

          {/* Sub-branding */}
          <div className="text-center space-y-3">
            <p className="text-2xl font-bold text-foreground tracking-wide">
              Sistemas 31 Pte
            </p>
            {/* Asiatech logo mark */}
            <div className="flex items-center justify-center gap-2 mt-2">
              <AsiatechLogo />
            </div>
          </div>
        </div>

        {/* Bottom notice */}
        <div className="relative z-10 p-8">
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            Sistema de tickets de Asiatech, si requiere acceso comuníquese con
            el equipo de sistemas&nbsp; 31pte
          </p>
        </div>
      </div>

      {/* ─── RIGHT PANEL ─── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        {/* Card */}
        <div className="w-full max-w-md rounded-2xl p-10 border border-border bg-card/80 backdrop-blur-xl shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground text-balance" style={{ fontWeight: 800 }}>
              Inicio de Sesión
            </h1>
            <p className="mt-2 text-sm text-muted-foreground text-pretty leading-relaxed">
              Ingresa las credenciales proporcionadas por el equipo de sistemas
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email / Usuario */}
            <div className="relative">
              <input
                type="text"
                placeholder="Email o Usuario"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-lg px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring transition"
                autoComplete="username"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </span>
            </div>

            {/* Contraseña */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring transition"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-background bg-foreground hover:bg-foreground/90 active:bg-foreground/80 disabled:opacity-60 transition-all duration-150"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Ingresando...
                  </span>
                ) : (
                  <>
                    Ingresar
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer note */}
          <p className="mt-8 text-center text-xs text-muted-foreground leading-relaxed text-pretty">
            Las credenciales son proporcionadas por el Área de sistemas.{" "}
            <span className="text-foreground/70 cursor-pointer hover:text-foreground transition">
              Solicitar una por correo
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

/** Asiatech logo from public assets */
function AsiatechLogo() {
  return (
    <Image
      src="/logo.svg"
      alt="asiatech logo"
      width={180}
      height={40}
      className="mx-auto"
    />
  );
}
