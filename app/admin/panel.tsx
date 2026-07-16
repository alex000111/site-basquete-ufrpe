"use client";

import { useEffect, useState } from "react";
import "./admin.css";

type User = { username: string; displayName?: string; name?: string; role: string; mustChangePassword: boolean };
type Game = {
  id?: number; opponent: string; gameDate: string; gameTime: string; location: string;
  competition: string; status: string; ruralScore: number; opponentScore: number;
  summary: string; youtubeUrl: string; period: number; clockSeconds: number;
  clockRunning: boolean; ruralFouls: number; opponentFouls: number;
  ruralTimeouts: number; opponentTimeouts: number;
};

const empty: Game = {
  opponent: "", gameDate: "", gameTime: "", location: "Ginásio da UFRPE",
  competition: "", status: "Confirmado", ruralScore: 0, opponentScore: 0,
  summary: "", youtubeUrl: "", period: 1, clockSeconds: 600,
  clockRunning: false, ruralFouls: 0, opponentFouls: 0,
  ruralTimeouts: 0, opponentTimeouts: 0,
};

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [form, setForm] = useState<Game>(empty);
  const [message, setMessage] = useState("");

  const loadGames = () => fetch("/api/games").then(response => response.json()).then(data => setGames(data.games || []));

  useEffect(() => {
    fetch("/api/auth/me").then(response => response.ok ? response.json() : null).then(data => {
      setUser(data?.user || null);
      setReady(true);
      if (data?.user) loadGames();
    });
  }, []);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (!response.ok) { setError(data.error); return; }
    setUser(data.user);
    loadGames();
  }

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/auth/password", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: newPassword }),
    });
    if (response.ok) {
      setUser(user ? { ...user, mustChangePassword: false } : null);
      setNewPassword("");
    } else setError((await response.json()).error);
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setCredentials({ username: "", password: "" });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setMessage("Salvando...");
    const response = await fetch("/api/games", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (response.ok) {
      setForm(empty);
      setMessage(form.id ? "Alterações salvas." : "Jogo publicado. A súmula já pode ser aberta.");
      loadGames();
    } else setMessage("Não foi possível salvar.");
  }

  async function remove(id?: number) {
    if (!id || !confirm("Excluir este jogo?")) return;
    await fetch(`/api/games?id=${id}`, { method: "DELETE" });
    loadGames();
  }

  if (!ready) return <main className="loginPage" />;
  if (!user) return <main className="loginPage"><form className="loginCard" onSubmit={signIn}><img src="/logo-rural.png" alt="Basquetebol da Rural"/><p className="eyebrow">ÁREA RESTRITA</p><h1>Painel da equipe</h1><p>Entre com seu usuário e senha para gerenciar as partidas.</p><label>Usuário<input autoComplete="username" value={credentials.username} onChange={event => setCredentials({ ...credentials, username: event.target.value })}/></label><label>Senha<input type="password" autoComplete="current-password" value={credentials.password} onChange={event => setCredentials({ ...credentials, password: event.target.value })}/></label>{error && <p className="formError">{error}</p>}<button className="primary">ENTRAR →</button><a href="/">← Voltar ao site</a></form></main>;
  if (user.mustChangePassword) return <main className="loginPage"><form className="loginCard" onSubmit={updatePassword}><p className="eyebrow">PRIMEIRO ACESSO</p><h1>Crie uma nova senha</h1><p>Por segurança, substitua a senha temporária antes de acessar o painel.</p><label>Nova senha<input type="password" minLength={8} required value={newPassword} onChange={event => setNewPassword(event.target.value)}/></label>{error && <p className="formError">{error}</p>}<button className="primary">SALVAR NOVA SENHA</button></form></main>;

  return <main className="adminPage">
    <header><a className="brand" href="/"><img src="/logo-rural.png" alt="Logo"/><span>PAINEL DA EQUIPE</span></a><div><small>{user.displayName || user.name || user.username} · {user.role === "admin" ? "Administrador" : "Comissão técnica"}</small><button onClick={signOut}>Sair</button></div></header>
    <div className="adminLayout">
      <section>
        <p className="eyebrow">GESTÃO DE PARTIDAS</p>
        <h1>{form.id ? "Editar jogo" : "Cadastrar jogo"}</h1>
        <form className="adminForm" onSubmit={save}>
          <label>Adversário<input required value={form.opponent} onChange={event => setForm({ ...form, opponent: event.target.value })}/></label>
          <label>Competição<input value={form.competition} onChange={event => setForm({ ...form, competition: event.target.value })}/></label>
          <div className="formRow"><label>Data<input required type="date" value={form.gameDate} onChange={event => setForm({ ...form, gameDate: event.target.value })}/></label><label>Horário<input type="time" value={form.gameTime} onChange={event => setForm({ ...form, gameTime: event.target.value })}/></label></div>
          <label>Local<input value={form.location} onChange={event => setForm({ ...form, location: event.target.value })}/></label>
          <label>Status<select value={form.status} onChange={event => setForm({ ...form, status: event.target.value })}><option>A confirmar</option><option>Confirmado</option><option>Ao vivo</option><option>Encerrado</option><option>Adiado</option><option>Cancelado</option></select></label>
          <div className="sumulaNotice"><b>▦ Placar conectado à súmula</b><span>Pontos, faltas, períodos e tempos debitados são lançados na súmula digital. Todo novo jogo começa em 0 × 0.</span></div>
          <button className="primary">{form.id ? "SALVAR ALTERAÇÕES" : "PUBLICAR JOGO"}</button>
          {form.id && <button type="button" className="cancel" onClick={() => setForm(empty)}>Cancelar</button>}
          <p>{message}</p>
        </form>
      </section>
      <aside>
        <h2>Jogos cadastrados</h2>
        {games.length === 0 && <p>Nenhum jogo cadastrado.</p>}
        {games.map(game => <article key={game.id}><span>{game.status}</span><h3>Rural × {game.opponent}</h3><p>{game.gameDate} · {game.gameTime || "Horário a definir"}</p><b>{game.ruralScore} — {game.opponentScore}</b><div><button onClick={() => setForm(game)}>Editar</button><button onClick={() => remove(game.id)}>Excluir</button></div></article>)}
      </aside>
    </div>
  </main>;
}
