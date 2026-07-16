"use client";

import { useEffect, useMemo, useState } from "react";
import "./live.css";

const players = [
  "Antônio Senna", "Arthur Rafael", "Caio César", "Davi Santos", "Guilherme L.",
  "Heron Carlos", "Josephy Garibalde", "Juliano Pontes", "Luiz Alves", "Luiz Gabriel",
  "Marcos José", "Maryo Phelyp", "Nelson Júnior", "Pedro Lucas", "Renan",
  "Rinaldo Elias", "Roberto Vinícius", "Rui Silva", "Wesley",
];

type Game = { opponent: string; date: string; time: string; location: string; status: string; us: string; them: string; youtubeUrl?:string; period?:number; clockSeconds?:number; ruralFouls?:number; opponentFouls?:number; ruralTimeouts?:number; opponentTimeouts?:number };

function getYouTubeId(value: string) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.hostname.includes("youtu.be")) return url.pathname.split("/").filter(Boolean)[0] || "";
    const queryId = url.searchParams.get("v");
    if (queryId) return queryId;
    const parts = url.pathname.split("/").filter(Boolean);
    const marker = parts.findIndex(part => ["live", "embed", "shorts"].includes(part));
    return marker >= 0 ? parts[marker + 1] || "" : "";
  } catch {
    return value.trim();
  }
}

export default function Home() {
  const [tab, setTab] = useState("agenda");
  const [games, setGames] = useState<Game[]>([
    { opponent: "Adversário a confirmar", date: "Data a confirmar", time: "—", location: "UFRPE · Recife", status: "A confirmar", us: "00", them: "00" },
  ]);
  const [form, setForm] = useState<Game>({ opponent: "", date: "", time: "", location: "Ginásio da UFRPE", status: "Confirmado", us: "00", them: "00" });
  const next = games[0];
  const liveGame = games.find(game => game.status.toLowerCase().startsWith("ao vivo"));
  const liveVideoId = liveGame?.youtubeUrl ? getYouTubeId(liveGame.youtubeUrl) : "";
  const initials = (name: string) => name.split(" ").map(n => n[0]).slice(0, 2).join("");
  const stats = useMemo(() => players.slice(0, 5).map((name, i) => ({ name, pts: 18-i*2, reb: 8-i, ast: 3+i })), []);

  useEffect(() => { const load=()=>fetch("/api/games").then(r=>r.json()).then(data => {
    if (!data.games?.length) return;
    setGames(data.games.map((g: Record<string,string|number>) => ({ opponent:String(g.opponent), date:new Date(String(g.gameDate)+"T12:00:00").toLocaleDateString("pt-BR"), time:String(g.gameTime||"—"), location:String(g.location), status:String(g.effectiveStatus||g.status), us:String(g.ruralScore).padStart(2,"0"), them:String(g.opponentScore).padStart(2,"0"),youtubeUrl:String(g.youtubeUrl||""),period:Number(g.period||1),clockSeconds:Number(g.clockSeconds||600),ruralFouls:Number(g.ruralFouls||0),opponentFouls:Number(g.opponentFouls||0),ruralTimeouts:Number(g.ruralTimeouts||0),opponentTimeouts:Number(g.opponentTimeouts||0) })));
  }).catch(()=>{});load();const timer=setInterval(load,3000);return()=>clearInterval(timer)}, []);

  function addGame(e: React.FormEvent) {
    e.preventDefault();
    if (!form.opponent || !form.date) return;
    setGames(prev => [...prev, { ...form, date: new Date(form.date + "T12:00:00").toLocaleDateString("pt-BR") }]);
    setForm({ opponent: "", date: "", time: "", location: "Ginásio da UFRPE", status: "Confirmado", us: "00", them: "00" });
  }

  return <main>
    <section className="hero" id="inicio">
      <nav className="nav wrap">
        <a className="brand" href="#inicio"><img src="/logo-rural.png" alt="Basquetebol da Rural"/><span>UFRPE<br/><small>BASQUETEBOL</small></span></a>
        <div className="navlinks"><a href="#inicio">Início</a><a href="#elenco">Elenco</a><a href="#jogos">Jogos</a><a href="#estatisticas">Estatísticas</a><a href="#historia">História</a></div>
        <a className="outline" href="/admin" style={{fontWeight: 900}}>Área da equipe</a>
      </nav>
      <div className="heroContent wrap">
        <p className="eyebrow heroEyebrow">BASQUETEBOL DA RURAL</p>
        <h1>A FORÇA DA<br/><span>RURAL EM QUADRA</span></h1>
        <p className="lead">Tradição, intensidade e união representando a UFRPE.</p>
        <div className="actions"><a className="primary" href="#jogos">PRÓXIMOS JOGOS →</a><a className="secondary" href="#elenco">CONHEÇA O ELENCO →</a></div>
      </div>
    </section>

    {liveGame&&<section className="liveCenter"><div className="wrap"><div className="liveHeader"><div><p className="eyebrow">● TRANSMISSÃO AO VIVO</p><h2>Rural × {liveGame.opponent}</h2></div><div className="liveClock"><b>{liveGame.us} — {liveGame.them}</b><span>{liveGame.period}º período · {Math.floor((liveGame.clockSeconds||0)/60)}:{String((liveGame.clockSeconds||0)%60).padStart(2,"0")}</span></div></div><div className="liveGrid"><div className="videoFrame">{liveVideoId?<iframe src={`https://www.youtube.com/embed/${liveVideoId}`} title="Transmissão ao vivo" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/>:<div>LIVE DO YOUTUBE<br/><small>A transmissão aparecerá aqui quando o link for cadastrado.</small></div>}</div><aside><h3>Informações da partida</h3><p>Faltas: Rural {liveGame.ruralFouls||0} × {liveGame.opponentFouls||0} Adversário</p><p>Tempos: Rural {liveGame.ruralTimeouts||0} × {liveGame.opponentTimeouts||0} Adversário</p><small>Placar atualizado automaticamente a cada 3 segundos.</small></aside></div></div></section>}

    <section className="scoreWrap wrap" aria-label="Próximo jogo">
      <div className="scoreTop"><b>▦ &nbsp; PRÓXIMO JOGO</b><span className="live">● {next.status}</span></div>
      <div className="scoreMain"><div className="team">BASQUETEBOL<br/>DA RURAL</div><div className="digits">{next.us}</div><span className="versus">×</span><div className="digits">{next.them}</div><div className="team right">{next.opponent.toUpperCase()}</div></div>
      <div className="scoreMeta"><span>▣ {next.date} {next.time !== "—" && `· ${next.time}`}</span><span>● {next.location}</span></div>
    </section>

    <section className="section wrap" id="elenco"><div className="sectionHead"><div><p className="eyebrow">QUEM DEFENDE A RURAL</p><h2>Nosso elenco</h2></div><span>19 atletas</span></div>
      <div className="roster">{players.map((p,i)=><article className="player" key={p}><div className="avatar">{initials(p)}</div><small>{String(i+1).padStart(2,"0")}</small><h3>{p}</h3><p>{p === "Rinaldo Elias" ? "Monitor e jogador" : "Jogador"}</p></article>)}</div>
      <p className="former">Leonardo Henrique · Ex-jogador</p>
    </section>

    <section className="games section" id="jogos"><div className="wrap"><p className="eyebrow">CENTRAL DE JOGOS</p><h2>O jogo começa aqui</h2><div className="tabs"><button onClick={()=>setTab("agenda")} className={tab==="agenda"?"active":""}>Agenda</button><button onClick={()=>setTab("resultados")} className={tab==="resultados"?"active":""}>Resultados</button></div>
      <div className="gameList">{games.map((g,i)=><article key={i}><span className="status">{g.status}</span><div><small>{g.date} · {g.time}</small><h3>Rural <b>×</b> {g.opponent}</h3><p>{g.location}</p></div><strong>{g.status === "Encerrado" ? `${g.us} — ${g.them}` : "DETALHES →"}</strong></article>)}</div></div></section>

    <section className="section wrap" id="estatisticas"><p className="eyebrow">DESEMPENHO</p><h2>Estatísticas da equipe</h2><div className="statGrid"><div className="bigStat"><b>00</b><span>Jogos disputados</span></div><div className="bigStat"><b>00</b><span>Vitórias</span></div><div className="bigStat"><b>00</b><span>Pontos marcados</span></div></div><div className="table"><div className="tr head"><span>Atleta</span><span>PTS</span><span>REB</span><span>AST</span></div>{stats.map(s=><div className="tr" key={s.name}><span>{s.name}</span><span>—</span><span>—</span><span>—</span></div>)}</div><p className="hint">As estatísticas serão atualizadas a partir dos registros de cada partida.</p></section>

    <section className="history" id="historia"><div className="wrap"><p className="eyebrow">NOSSA IDENTIDADE</p><h2>Mais que uma equipe.<br/>A Rural em quadra.</h2><p>O Basquetebol da Rural representa a UFRPE com compromisso, coletividade e paixão pelo esporte.</p><div className="staff"><div><small>TÉCNICO</small><b>Ricardo Lima</b></div><div><small>COMISSÃO TÉCNICA</small><b>Roberta Laryssa</b><b>Rinaldo Elias</b></div></div></div></section>
    <footer><div className="wrap"><img src="/logo-rural.png" alt="Logo"/><p>Basquetebol da Rural · UFRPE<br/>Recife, Pernambuco</p><a href="#inicio">VOLTAR AO TOPO ↑</a></div></footer>
  </main>
}
