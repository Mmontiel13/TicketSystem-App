"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Users, Ticket } from "lucide-react";
import { useUser } from "@/lib/user-context";

export default function LoginPage() {
  const router = useRouter();
  const { authenticate } = useUser();
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
    await new Promise((r) => setTimeout(r, 400));

    const result = authenticate(identifier, password);

    if (!result.success) {
      setError(result.message ?? "Credenciales inválidas");
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <div
      className="min-h-screen w-full flex"
      style={{ backgroundColor: "#000000" }}
    >
      {/* ─── LEFT PANEL ─── */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 50%, #141414 100%)",
          borderRight: "1px solid #27272a",
        }}
      >
        {/* Subtle noise / grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px)",
          }}
        />

        {/* Top-left badge */}
        <div className="relative z-10 p-8">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Users size={16} className="text-zinc-400" />
            <span>Equipo de desarrolladores</span>
          </div>
        </div>

        {/* Center branding */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-12">
          {/* Ticket icon + title */}
          <div className="flex items-center gap-4 mb-12">
            <div className="p-3 rounded-xl border border-zinc-700 bg-zinc-800/50">
              <Ticket size={40} className="text-white" />
            </div>
            <span
              className="text-5xl font-bold text-white tracking-tight"
              style={{ fontWeight: 800 }}
            >
              Ticket List
            </span>
          </div>

          {/* Sub-branding */}
          <div className="text-center space-y-3">
            <p className="text-2xl font-bold text-white tracking-wide">
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
          <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
            Sistema de tickets de Asiatech, si requiere acceso comuníquese con
            el equipo de sistemas&nbsp; 31pte
          </p>
        </div>
      </div>

      {/* ─── RIGHT PANEL ─── */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-12"
        style={{ backgroundColor: "#111111" }}
      >
        {/* Glassmorphism card */}
        <div
          className="w-full max-w-md rounded-2xl p-10 border border-zinc-800"
          style={{
            background: "rgba(24, 24, 27, 0.50)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.04), 0 24px 64px rgba(0,0,0,0.6)",
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold text-white text-balance"
              style={{ fontWeight: 800 }}
            >
              Inicio de Sesión
            </h1>
            <p className="mt-2 text-sm text-zinc-400 text-pretty leading-relaxed">
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
                className="w-full rounded-lg px-4 py-3 pr-11 text-sm text-white placeholder-zinc-500 border border-zinc-700 bg-zinc-900/70 focus:outline-none focus:ring-1 focus:ring-zinc-500 transition"
                autoComplete="username"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
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
                className="w-full rounded-lg px-4 py-3 pr-11 text-sm text-white placeholder-zinc-500 border border-zinc-700 bg-zinc-900/70 focus:outline-none focus:ring-1 focus:ring-zinc-500 transition"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
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
                className="w-full flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-black bg-white hover:bg-zinc-100 active:bg-zinc-200 disabled:opacity-60 transition-all duration-150"
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
          <p className="mt-8 text-center text-xs text-zinc-600 leading-relaxed text-pretty">
            Las credenciales son proporcionadas por el Área de sistemas.{" "}
            <span className="text-zinc-400 cursor-pointer hover:text-white transition">
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
    <img
      src="/logo.svg"
      alt="asiatech logo"
      width={180}
      height={40}
      className="mx-auto"
    />
  );
}
