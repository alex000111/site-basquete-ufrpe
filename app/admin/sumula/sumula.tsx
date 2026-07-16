"use client";

import { useEffect, useState } from "react";
import "./sumula.css";

type Game = {
  id: number;
  opponent: string;
  gameDate: string;
  gameTime: string;
  location: string;
  competition: string;
  status: string;
  ruralScore: number;
  opponentScore: number;
};

export default function Sumula({ authorized }: { authorized: boolean }) {
  const [games, setGames] = useState<Game[]>([]);
  const [selected, setSelected] = useState<Game | null>(null);
  const [loading, setLoading] = useState(authorized);

  useEffect(() => {
    if (!authorized) return;
    fetch("/api/games", { credentials: "same-origin" })
      .then((response) => response.json())
      .then((data) => setGames(data.games || []))
      .finally(() => setLoading(false));
  }, [authorized]);

  if (!authorized) {
    return (
      <main className="sumulaGate">
        <img src="/logo-rural.png" alt="Basquetebol da Rural" />
        <p>ÁREA RESTRITA</p>
        <h1>Entre no painel da equipe</h1>
        <span>A súmula digital só pode ser aberta pela comissão técnica.</span>
        <a href="/admin">FAZER LOGIN →</a>
      </main>
    );
  }

  if (selected) {
    return (
      <main className="sumulaWorkspace">
        <nav className="sumulaBar">
          <div>
            <button type="button" onClick={() => setSelected(null)}>← Trocar jogo</button>
            <a href="/admin">Painel</a>
            <a href="/admin/live">Controle ao vivo</a>
          </div>
          <p><b>Rural × {selected.opponent}</b><span>{selected.gameDate} · {selected.gameTime || "horário a definir"}</span></p>
        </nav>
        <iframe
          className="sumulaFrame"
          title={`Súmula Rural contra ${selected.opponent}`}
          src={`/admin/sumula/document?gameId=${selected.id}`}
        />
      </main>
    );
  }

  return (
    <main className="sumulaSelect">
      <header>
        <a href="/admin">← Voltar ao painel</a>
        <p>SÚMULA DIGITAL OFICIAL</p>
        <h1>Escolha a partida</h1>
        <span>Os pontos lançados na contagem progressiva atualizam o placar público do jogo selecionado.</span>
      </header>
      <section>
        {loading && <p className="sumulaEmpty">Carregando partidas…</p>}
        {!loading && games.length === 0 && (
          <div className="sumulaEmpty">
            <b>Nenhuma partida cadastrada.</b>
            <span>Cadastre o próximo jogo no painel para abrir a súmula.</span>
            <a href="/admin">CADASTRAR JOGO</a>
          </div>
        )}
        {games.map((game) => (
          <button type="button" className="gameChoice" key={game.id} onClick={() => setSelected(game)}>
            <span className="gameStatus">{game.status}</span>
            <small>{game.competition || "Basquetebol da Rural"}</small>
            <h2>Rural <em>×</em> {game.opponent}</h2>
            <p>{game.gameDate} · {game.gameTime || "horário a definir"}</p>
            <p>{game.location || "local a definir"}</p>
            <strong>{game.ruralScore} — {game.opponentScore}</strong>
            <i>ABRIR SÚMULA →</i>
          </button>
        ))}
      </section>
    </main>
  );
}
