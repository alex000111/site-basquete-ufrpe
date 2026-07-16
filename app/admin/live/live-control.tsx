"use client";

import { useEffect, useState } from "react";
import "./live.css";

type Game = {
  id: number; opponent: string; status: string; ruralScore: number; opponentScore: number;
  youtubeUrl: string; period: number; clockSeconds: number; clockRunning: boolean;
  ruralFouls: number; opponentFouls: number; ruralTimeouts: number; opponentTimeouts: number;
  [key: string]: unknown;
};

const time = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export default function LiveControl({ authorized }: { authorized: boolean }) {
  const [games, setGames] = useState<Game[]>([]);
  const [game, setGame] = useState<Game | null>(null);
  const [message, setMessage] = useState("");

  const load = () => fetch("/api/games").then(response => response.json()).then(data => setGames(data.games || []));

  useEffect(() => { if (authorized) load(); }, [authorized]);

  async function persist(next: Game, quiet = false) {
    try {
      const response = await fetch("/api/games", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next),
      });
      if (!response.ok) throw new Error("sync");
      if (!quiet) setMessage("Atualizado ao vivo");
      localStorage.removeItem("rural-live-pending");
    } catch {
      localStorage.setItem("rural-live-pending", JSON.stringify(next));
      setMessage("Sem internet: ação guardada neste celular");
    }
  }

  async function update(changes: Partial<Game>) {
    if (!game) return;
    const next = { ...game, ...changes };
    setGame(next);
    setMessage("Sincronizando...");
    await persist(next);
  }

  useEffect(() => {
    if (!game?.clockRunning) return;
    const timer = window.setInterval(() => {
      setGame(current => {
        if (!current || !current.clockRunning || current.clockSeconds <= 0) return current;
        const remaining = current.clockSeconds - 1;
        const next = { ...current, clockSeconds: remaining, clockRunning: remaining > 0 };
        if (next.clockSeconds % 3 === 0) void persist(next, true);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [game?.clockRunning]);

  if (!authorized) return <main className="loginPage"><div className="loginCard"><img src="/logo-rural.png" alt="Basquetebol da Rural"/><p className="eyebrow">ÁREA RESTRITA</p><h1>Controle da partida</h1><p>Entre no painel da equipe antes de acessar a transmissão e os ajustes de emergência.</p><a className="primary" href="/admin">FAZER LOGIN →</a><a href="/">← Voltar ao site</a></div></main>;

  if (!game) return <main className="adminPage"><header><a className="brand" href="/admin">← PAINEL</a><b>TRANSMISSÃO E EMERGÊNCIA</b></header><div className="liveSelector"><h1>Escolha uma partida</h1><p>A pontuação principal vem da súmula digital.</p>{games.map(item => <button key={item.id} onClick={() => setGame(item)}>Rural × {item.opponent} · {item.status}</button>)}</div></main>;

  const adjust = (field: keyof Game, delta: number) => update({ [field]: Math.max(0, Number(game[field] || 0) + delta) });

  return <main className="liveControl">
    <header><a href="/admin">← Painel</a><span className="live">● TRANSMISSÃO E EMERGÊNCIA</span><b>{message}</b></header>
    <section>
      <p className="opponentName">Rural × {game.opponent}</p>
      <div className="controlScore"><div><small>RURAL</small><b>{game.ruralScore}</b></div><span>×</span><div><small>ADVERSÁRIO</small><b>{game.opponentScore}</b></div></div>
      <p className="syncHint">Placar, período, faltas e tempos debitados são recebidos da súmula.</p>
      <div className="clockControl"><button onClick={() => update({ period: Math.max(1, game.period - 1) })}>−</button><b>{game.period}º PERÍODO</b><button onClick={() => update({ period: Math.min(4, game.period + 1) })}>+</button><strong>{time(game.clockSeconds)}</strong><button onClick={() => update({ clockRunning: !game.clockRunning, status: "Ao vivo" })}>{game.clockRunning ? "PAUSAR" : "INICIAR"}</button><button onClick={() => update({ clockSeconds: 600, clockRunning: false })}>REINICIAR</button></div>
      <div className="liveExtras"><label>Link da live no YouTube<input type="url" placeholder="https://www.youtube.com/live/..." value={game.youtubeUrl || ""} onChange={event => setGame({ ...game, youtubeUrl: event.target.value })}/><small>Cole o link completo da transmissão ou do compartilhamento do YouTube.</small><button onClick={() => update({ youtubeUrl: game.youtubeUrl, status: "Ao vivo" })}>PUBLICAR LIVE</button></label></div>
      <details className="manualAdjust">
        <summary>⚠ Ajustes manuais de emergência</summary>
        <p>Use somente se algo tiver sido lançado incorretamente na súmula ou se ela ficar indisponível.</p>
        <div className="manualGrid">
          <div><b>Placar Rural</b><span>{game.ruralScore}</span><nav><button onClick={() => adjust("ruralScore", -1)}>−1</button>{[1, 2, 3].map(value => <button key={value} onClick={() => adjust("ruralScore", value)}>+{value}</button>)}</nav></div>
          <div><b>Placar adversário</b><span>{game.opponentScore}</span><nav><button onClick={() => adjust("opponentScore", -1)}>−1</button>{[1, 2, 3].map(value => <button key={value} onClick={() => adjust("opponentScore", value)}>+{value}</button>)}</nav></div>
          <div><b>Faltas Rural</b><span>{game.ruralFouls}</span><nav><button onClick={() => adjust("ruralFouls", -1)}>−</button><button onClick={() => adjust("ruralFouls", 1)}>+</button></nav></div>
          <div><b>Faltas adversário</b><span>{game.opponentFouls}</span><nav><button onClick={() => adjust("opponentFouls", -1)}>−</button><button onClick={() => adjust("opponentFouls", 1)}>+</button></nav></div>
          <div><b>Tempos Rural</b><span>{game.ruralTimeouts}</span><nav><button onClick={() => adjust("ruralTimeouts", -1)}>−</button><button onClick={() => adjust("ruralTimeouts", 1)}>+</button></nav></div>
          <div><b>Tempos adversário</b><span>{game.opponentTimeouts}</span><nav><button onClick={() => adjust("opponentTimeouts", -1)}>−</button><button onClick={() => adjust("opponentTimeouts", 1)}>+</button></nav></div>
        </div>
      </details>
      <button className="finish" onClick={() => update({ status: "Encerrado", clockRunning: false })}>ENCERRAR PARTIDA</button>
    </section>
  </main>;
}
