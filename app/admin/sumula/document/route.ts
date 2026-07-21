import { getCurrentUser } from "../../../site-auth";
import template from "./template.html";

export const dynamic = "force-dynamic";

const bridge = String.raw`<script>
(function () {
  var gameId = Number(new URLSearchParams(window.location.search).get('gameId'));
  if (!gameId) return;

  var currentGame = null;
  var baselineA = 0;
  var baselineB = 0;
  var syncTimer = null;
  var roster = [
    'Antônio Senna', 'Arthur Rafael', 'Caio César', 'Davi Santos',
    'Guilherme L.', 'Heron Carlos', 'Josephy Garibalde', 'Juliano Pontes',
    'Luiz Alves', 'Luiz Gabriel', 'Marcos José', 'Maryo Phelyp'
  ];

  function status(text, color) {
    var badge = document.getElementById('site-sync-status');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'site-sync-status';
      badge.className = 'no-print';
      badge.style.cssText = 'position:fixed;left:16px;top:16px;z-index:2100;background:#071a35;color:#fff;border:2px solid #e6b735;border-radius:999px;padding:8px 12px;font:700 11px Arial;box-shadow:0 5px 16px #0007';
      document.body.appendChild(badge);
    }
    badge.textContent = text;
    badge.style.borderColor = color || '#e6b735';
  }

  function setValue(id, value) {
    var element = document.getElementById(id);
    if (element) element.value = value == null ? '' : String(value);
  }

  function fillRuralRoster() {
    var rows = document.querySelectorAll('#teamA-players tr');
    rows.forEach(function (row, index) {
      var name = row.querySelector('.player-name-input');
      var number = row.querySelector('.player-number-input');
      if (name) name.value = roster[index] || '';
      if (number) number.value = '';
    });
    document.querySelectorAll('#teamB-players input').forEach(function (input) {
      input.value = '';
    });
  }

  function applyGame(game) {
    currentGame = game;
    baselineA = Number(game.ruralScore || 0);
    baselineB = Number(game.opponentScore || 0);
    if (typeof executarLimpeza === 'function') executarLimpeza();
    setValue('header-equipeA', 'BASQUETEBOL DA RURAL');
    setValue('header-equipeB', game.opponent || 'ADVERSÁRIO');
    setValue('teamA-name', 'BASQUETEBOL DA RURAL');
    setValue('teamB-name', game.opponent || 'ADVERSÁRIO');
    setValue('header-comp', game.competition || '');
    setValue('header-jogo', game.id);
    setValue('header-local', game.location || '');
    setValue('header-data', game.gameDate || '');
    setValue('header-hora-inicio', game.gameTime || '');
    setValue('teamA-tec', 'RICARDO LIMA');
    setValue('teamB-tec', '');
    setValue('res-a', baselineA || '');
    setValue('res-b', baselineB || '');
    fillRuralRoster();
    if (typeof calculateQuarterScores === 'function' && !baselineA && !baselineB) calculateQuarterScores();
    var finishButton = document.getElementById('finish-game-button');
    if (finishButton) {
      finishButton.disabled = game.status === 'Encerrado';
      finishButton.textContent = game.status === 'Encerrado' ? '✓ PARTIDA ENCERRADA' : '🏁 ENCERRAR PARTIDA';
    }
    status('● SÚMULA CONECTADA AO PLACAR', '#22c55e');
  }

  async function loadSignatures() {
    try {
      var response = await fetch('/api/signatures?gameId=' + gameId, { credentials: 'same-origin' });
      if (!response.ok) throw new Error('signatures');
      var data = await response.json();
      (data.signatures || []).forEach(function (signature) {
        if (typeof window.applyStoredSignature === 'function') {
          window.applyStoredSignature(signature.role, signature.dataUrl, signature.signedBy);
        }
      });
    } catch (error) {
      status('PLACAR CONECTADO · ASSINATURAS INDISPONÍVEIS', '#f59e0b');
    }
  }

  window.persistSignatureToSite = async function (role, dataUrl, signedBy) {
    status('SALVANDO ASSINATURA…', '#e6b735');
    try {
      var response = await fetch('/api/signatures', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: gameId, role: role, dataUrl: dataUrl, signedBy: signedBy })
      });
      if (!response.ok) throw new Error('signature');
      status('✓ ASSINATURA VINCULADA À PARTIDA', '#22c55e');
      return true;
    } catch (error) {
      status('ASSINATURA SALVA SÓ NESTE APARELHO', '#ef4444');
      return false;
    }
  };

  window.deleteOfficialSignature = async function (role) {
    try {
      await fetch('/api/signatures?gameId=' + gameId + '&role=' + encodeURIComponent(role), {
        method: 'DELETE',
        credentials: 'same-origin'
      });
      status('ASSINATURA REMOVIDA', '#e6b735');
    } catch (error) {
      status('NÃO FOI POSSÍVEL REMOVER A ASSINATURA', '#ef4444');
    }
  };

  window.finishLinkedGame = async function () {
    if (!currentGame || currentGame.status === 'Encerrado') return;
    if (!window.confirm('Encerrar Rural × ' + currentGame.opponent + '? O placar final será publicado no painel principal.')) return;
    if (typeof calculateQuarterScores === 'function') calculateQuarterScores();
    var next = Object.assign({}, currentGame, {
      ruralScore: highestEnteredScore('A'),
      opponentScore: highestEnteredScore('B'),
      status: 'Encerrado',
      clockRunning: false,
      clockSeconds: 0,
      period: activePeriod()
    });
    status('ENCERRANDO PARTIDA…', '#e6b735');
    try {
      var response = await fetch('/api/games', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next)
      });
      if (!response.ok) throw new Error('finish');
      currentGame = next;
      var finish = document.getElementById('finish-game-button');
      if (finish) {
        finish.disabled = true;
        finish.textContent = '✓ PARTIDA ENCERRADA';
      }
      var end = document.getElementById('header-hora-fim');
      if (end && !end.value) end.value = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      status('✓ PARTIDA ENCERRADA E PLACAR FINAL PUBLICADO', '#22c55e');
    } catch (error) {
      status('NÃO FOI POSSÍVEL ENCERRAR A PARTIDA', '#ef4444');
    }
  };

  function highestEnteredScore(team) {
    var highest = 0;
    document.querySelectorAll('.input-' + team + '[data-score]').forEach(function (input) {
      if (input.value.trim()) highest = Math.max(highest, Number(input.dataset.score || 0));
    });
    var result = Number((document.getElementById('res-' + team.toLowerCase()) || {}).value || 0);
    return Math.max(highest, result, team === 'A' ? baselineA : baselineB);
  }

  function activePeriod() {
    return typeof currentPeriod === 'number' ? Math.max(1, Math.min(4, currentPeriod)) : 1;
  }

  function teamFouls(teamIndex, period) {
    var box = document.querySelectorAll('.team-box')[teamIndex];
    if (!box) return 0;
    return box.querySelectorAll('.foul-box[data-period="' + period + '"] span[data-state="x"]').length;
  }

  function teamTimeouts(teamIndex) {
    var box = document.querySelectorAll('.team-box')[teamIndex];
    if (!box) return 0;
    return Array.from(box.querySelectorAll('.timeout-box input')).filter(function (input) {
      return input.value.trim() !== '';
    }).length;
  }

  async function syncScoreboard() {
    if (!currentGame) return;
    var period = activePeriod();
    var next = Object.assign({}, currentGame, {
      ruralScore: highestEnteredScore('A'),
      opponentScore: highestEnteredScore('B'),
      ruralFouls: teamFouls(0, period),
      opponentFouls: teamFouls(1, period),
      ruralTimeouts: teamTimeouts(0),
      opponentTimeouts: teamTimeouts(1),
      period: period,
      status: currentGame.status === 'Encerrado' ? 'Encerrado' : 'Ao vivo'
    });
    status('SINCRONIZANDO PLACAR…', '#e6b735');
    try {
      var response = await fetch('/api/games', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next)
      });
      if (!response.ok) throw new Error('sync');
      currentGame = Object.assign({}, currentGame, next);
      baselineA = Math.max(baselineA, next.ruralScore);
      baselineB = Math.max(baselineB, next.opponentScore);
      status('● PLACAR AO VIVO ATUALIZADO', '#22c55e');
    } catch (error) {
      status('SEM CONEXÃO — ALTERAÇÃO NÃO ENVIADA', '#ef4444');
    }
  }

  function scheduleSync() {
    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(syncScoreboard, 2500);
  }

  async function loadGame() {
    status('CONECTANDO À PARTIDA…', '#e6b735');
    try {
      var response = await fetch('/api/games', { credentials: 'same-origin' });
      if (!response.ok) throw new Error('load');
      var data = await response.json();
      var game = (data.games || []).find(function (item) { return Number(item.id) === gameId; });
      if (!game) throw new Error('missing');
      applyGame(game);
      loadSignatures();
      document.addEventListener('input', function (event) {
        if (event.target.matches('.input-A, .input-B, #res-a, #res-b, .timeout-box input')) scheduleSync();
      });
      document.addEventListener('click', function (event) {
        if (event.target.closest('.team-fouls .foul-box, #fiba-keyboard')) scheduleSync();
      });
      document.addEventListener('dblclick', function (event) {
        if (event.target.closest('.score-table')) scheduleSync();
      });
    } catch (error) {
      status('NÃO FOI POSSÍVEL CARREGAR A PARTIDA', '#ef4444');
    }
  }

  window.addEventListener('load', function () {
    window.setTimeout(loadGame, 0);
  });
})();
</script>`;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(
      "<!doctype html><html lang='pt-BR'><meta charset='utf-8'><meta name='viewport' content='width=device-width'><body style='font-family:Arial;background:#06162d;color:white;display:grid;place-items:center;min-height:100vh;margin:0'><div style='text-align:center'><h1>Acesso restrito</h1><p>Entre no painel da equipe para abrir a súmula.</p><a style='color:#e6b735' href='/admin' target='_top'>Fazer login</a></div></body></html>",
      { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const html = template.replace("</body>", `${bridge}</body>`);
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, private",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
