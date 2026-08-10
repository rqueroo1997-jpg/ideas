"use client";

import { useActionState, useState } from "react";
import { loginAction, primerAccesoAction, type AuthFormState } from "@/lib/actions/auth";
import { SECCIONES, SUBSECCIONES } from "@/lib/catalog";

const initialState: AuthFormState = { error: null };

export function LoginForm({
  personasSinCuenta,
}: {
  personasSinCuenta: { id: number; nombre: string }[];
}) {
  const [mode, setMode] = useState<"login" | "primer">("login");
  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, initialState);
  const [primerState, primerFormAction, primerPending] = useActionState(primerAccesoAction, initialState);
  const [seccion, setSeccion] = useState<string>("S1");

  return (
    <div
      className="card blueprint"
      style={{ width: 380, padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}
    >
      <i className="corner tl" />
      <i className="corner tr" />
      <i className="corner bl" />
      <i className="corner br" />
      <div className="card-title">SIGO · Batallón CG IX</div>
      <div className="seg" style={{ width: "100%" }}>
        <label className="seg-opt" style={{ flex: 1, textAlign: "center" }}>
          <input type="radio" name="authmode" checked={mode === "login"} onChange={() => setMode("login")} />
          Iniciar sesión
        </label>
        <label className="seg-opt" style={{ flex: 1, textAlign: "center" }}>
          <input type="radio" name="authmode" checked={mode === "primer"} onChange={() => setMode("primer")} />
          Crear cuenta
        </label>
      </div>

      {mode === "login" && (
        <form action={loginFormAction} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div className="field">
            <label>Usuario</label>
            <input className="input" type="text" name="usuario" autoComplete="username" required />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input className="input" type="password" name="password" autoComplete="current-password" required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loginPending}>
            Entrar
          </button>
          {loginState.error && (
            <div style={{ fontSize: 13, color: "var(--color-accent-800)" }}>{loginState.error}</div>
          )}
        </form>
      )}

      {mode === "primer" && (
        <form action={primerFormAction} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div className="text-muted" style={{ fontSize: 12 }}>
            Crear cuenta: selecciona tu nombre y crea tu usuario y contraseña. Solo puede hacerse una vez — si ya
            tienes cuenta y olvidaste tus datos, acude al administrador (jefe de unidad) para renovarlos.
          </div>
          <div className="field">
            <label>Tu nombre</label>
            <select className="input" name="personaId" required defaultValue="">
              <option value="" disabled>
                Selecciona tu nombre...
              </option>
              {personasSinCuenta.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Tu sección</label>
            <select className="input" name="seccion" value={seccion} onChange={(e) => setSeccion(e.target.value)}>
              {SECCIONES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {seccion === "Transmisiones" && (
            <div className="field">
              <label>Tu sub-sección</label>
              <select className="input" name="sub" required defaultValue="">
                <option value="" disabled>
                  Selecciona...
                </option>
                {SUBSECCIONES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            <label>Elige un usuario</label>
            <input className="input" type="text" name="usuario" autoComplete="username" required />
          </div>
          <div className="field">
            <label>Elige una contraseña</label>
            <input className="input" type="password" name="password" autoComplete="new-password" required minLength={6} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={primerPending}>
            Crear cuenta y entrar
          </button>
          {primerState.error && (
            <div style={{ fontSize: 13, color: "var(--color-accent-800)" }}>{primerState.error}</div>
          )}
        </form>
      )}
    </div>
  );
}
