import { useState, useEffect, useCallback } from "react";

const API = "https://oracleapex.com/ords/wksp_ecipij/api";

async function fetchData(path) {
  try {
    let r = await fetch(`${API}/${path}`);
    let d = await r.json();
    return d.items || [];
  } catch (e) { return []; }
}

async function sendData(path, method, body) {
  try {
    let r = await fetch(`${API}/${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return r;
  } catch (e) { return null; }
}

const fallback = {
  stats: [{ total_users: 30, total_games: 15, total_sessions: 80, total_achievements: 51, total_reviews: 42, total_play_minutes: 14400 }],
  users: [
    { user_id: 1, username: "dark_knight", email: "dknight@mail.com", country: "USA", total_score: 48800, total_kills: 758, achievements: 5, games_played: 4 },
    { user_id: 2, username: "pixel_queen", email: "pqueen@mail.com", country: "Germany", total_score: 27400, total_kills: 112, achievements: 2, games_played: 4 },
    { user_id: 3, username: "cyber_wolf", email: "cwolf@mail.com", country: "Japan", total_score: 68600, total_kills: 1070, achievements: 4, games_played: 5 },
    { user_id: 4, username: "retro_gamer", email: "rgamer@mail.com", country: "UK", total_score: 35100, total_kills: 487, achievements: 2, games_played: 4 },
    { user_id: 5, username: "storm_blade", email: "sblade@mail.com", country: "Canada", total_score: 42700, total_kills: 398, achievements: 2, games_played: 5 },
    { user_id: 6, username: "neon_shadow", email: "nshadow@mail.com", country: "France", total_score: 52200, total_kills: 320, achievements: 1, games_played: 4 },
    { user_id: 7, username: "fire_mage", email: "fmage@mail.com", country: "Brazil", total_score: 55000, total_kills: 409, achievements: 6, games_played: 5 },
    { user_id: 8, username: "ice_hunter", email: "ihunter@mail.com", country: "Kazakhstan", total_score: 83500, total_kills: 1000, achievements: 6, games_played: 5 },
    { user_id: 9, username: "ghost_rider", email: "grider@mail.com", country: "Australia", total_score: 29100, total_kills: 225, achievements: 1, games_played: 4 },
    { user_id: 10, username: "turbo_fox", email: "tfox@mail.com", country: "South Korea", total_score: 36300, total_kills: 434, achievements: 3, games_played: 4 },
    { user_id: 11, username: "shadow_ninja", email: "sninja@mail.com", country: "Japan", total_score: 17500, total_kills: 263, achievements: 2, games_played: 2 },
    { user_id: 12, username: "blue_dragon", email: "bdragon@mail.com", country: "China", total_score: 17300, total_kills: 117, achievements: 3, games_played: 2 },
  ],
  games: [
    { game_id: 1, title: "Dragon Siege", developer: "Mythic Studios", platform: "Steam", genres: "Action, RPG", avg_rating: 8.9, player_count: 10, review_count: 8 },
    { game_id: 2, title: "Shadow Ops", developer: "Vortex Dev", platform: "PlayStation Network", genres: "Action, FPS", avg_rating: 8.7, player_count: 8, review_count: 7 },
    { game_id: 3, title: "Stellar Voyage", developer: "Cosmos Interactive", platform: "Steam", genres: "Adventure, Simulation", avg_rating: 7.0, player_count: 4, review_count: 3 },
    { game_id: 4, title: "Neon Drift", developer: "Speed Labs", platform: "Xbox Live", genres: "Action, Simulation", avg_rating: 5.0, player_count: 3, review_count: 1 },
    { game_id: 5, title: "Haunted Manor", developer: "Fright Factory", platform: "Epic Games Store", genres: "Adventure, Horror", avg_rating: 6.0, player_count: 3, review_count: 2 },
    { game_id: 6, title: "Kingdom Clash", developer: "Throne Works", platform: "Nintendo eShop", genres: "Strategy", avg_rating: 8.7, player_count: 3, review_count: 3 },
    { game_id: 7, title: "Cyber Runner", developer: "Neon Works", platform: "Steam", genres: "Action, FPS", avg_rating: 8.8, player_count: 8, review_count: 5 },
    { game_id: 8, title: "Ocean Explorer", developer: "Aqua Games", platform: "PlayStation Network", genres: "Adventure, Simulation", avg_rating: 7.0, player_count: 4, review_count: 4 },
    { game_id: 13, title: "Battle Royale X", developer: "Arena Studios", platform: "PlayStation Network", genres: "Action, FPS", avg_rating: 9.2, player_count: 9, review_count: 6 },
    { game_id: 15, title: "Dungeon Crawl", developer: "Dark Depths", platform: "Steam", genres: "Adventure, RPG", avg_rating: 9.0, player_count: 6, review_count: 3 },
  ],
  reviews: [
    { review_id: 1, username: "dark_knight", game: "Dragon Siege", rating: 9, review_title: "Amazing RPG!", created_at: "2025-12-01" },
    { review_id: 4, username: "cyber_wolf", game: "Shadow Ops", rating: 10, review_title: "Perfect shooter", created_at: "2025-12-02" },
    { review_id: 8, username: "fire_mage", game: "Dragon Siege", rating: 10, review_title: "Masterpiece", created_at: "2025-12-05" },
    { review_id: 13, username: "iron_fist", game: "Battle Royale X", rating: 10, review_title: "Addictive BR", created_at: "2025-12-04" },
    { review_id: 15, username: "arctic_fox", game: "Dungeon Crawl", rating: 9, review_title: "Dark and deep", created_at: "2025-12-03" },
    { review_id: 21, username: "dark_wizard", game: "Dragon Siege", rating: 10, review_title: "Perfect RPG", created_at: "2025-12-01" },
    { review_id: 24, username: "viper_strike", game: "Battle Royale X", rating: 9, review_title: "Best BR ever", created_at: "2025-12-01" },
  ],
  achievements: [
    { achievement_id: 1, game: "Dragon Siege", title: "Dragon Slayer", criteria_type: "kills", threshold_num: 1, unlock_count: 9 },
    { achievement_id: 2, game: "Dragon Siege", title: "Century of Blood", criteria_type: "kills", threshold_num: 100, unlock_count: 6 },
    { achievement_id: 3, game: "Dragon Siege", title: "Hoarder", criteria_type: "collect_items", threshold_num: 500, unlock_count: 3 },
    { achievement_id: 5, game: "Dragon Siege", title: "Score Master", criteria_type: "score", threshold_num: 10000, unlock_count: 3 },
    { achievement_id: 6, game: "Shadow Ops", title: "First Blood", criteria_type: "kills", threshold_num: 1, unlock_count: 10 },
    { achievement_id: 7, game: "Shadow Ops", title: "Marksman Elite", criteria_type: "kills", threshold_num: 200, unlock_count: 5 },
    { achievement_id: 18, game: "Cyber Runner", title: "Speed Demon", criteria_type: "score", threshold_num: 5000, unlock_count: 7 },
    { achievement_id: 20, game: "Cyber Runner", title: "Neon Runner", criteria_type: "playtime", threshold_num: 600, unlock_count: 0 },
    { achievement_id: 30, game: "Battle Royale X", title: "First Blood", criteria_type: "kills", threshold_num: 1, unlock_count: 9 },
  ],
  sessions: [
    { session_id: 1, username: "dark_knight", game: "Dragon Siege", started_at: "2025-12-01 18:00", ended_at: "2025-12-01 21:30", hours: 3.5, platform_acc: "dknight_steam" },
    { session_id: 2, username: "dark_knight", game: "Dragon Siege", started_at: "2025-12-03 19:00", ended_at: "2025-12-03 23:00", hours: 4, platform_acc: "dknight_steam" },
    { session_id: 6, username: "cyber_wolf", game: "Shadow Ops", started_at: "2025-12-01 22:00", ended_at: "2025-12-02 02:00", hours: 4, platform_acc: "cwolf_psn" },
    { session_id: 26, username: "iron_fist", game: "Battle Royale X", started_at: "2025-12-04 20:00", ended_at: "2025-12-04 23:30", hours: 3.5, platform_acc: "ifist_psn" },
  ],
  audit: [
    { log_id: 1, table_name: "USERS", action: "INSERT", user_name: "WKSP_ECIPIJ", action_date: "2025-12-01 10:00:00", details: "New user registered: dark_knight (ID: 1) Country: USA" },
    { log_id: 2, table_name: "PLAYER_STATS", action: "INSERT", user_name: "WKSP_ECIPIJ", action_date: "2025-12-01 21:30:00", details: "user_id=1 game_id=1 score=4500 kills=45" },
    { log_id: 3, table_name: "REVIEWS", action: "INSERT", user_name: "WKSP_ECIPIJ", action_date: "2025-12-01 22:00:00", details: "dark_knight reviewed Dragon Siege with rating 9/10" },
  ],
};

const c = {
  bg: "#06060b", card: "#0d0d14", cardHover: "#13131f", line: "#1a1a2a",
  red: "#ff3b5c", redSoft: "#ff3b5c18",
  blue: "#3b82f6", blueSoft: "#3b82f618",
  green: "#22c55e", greenSoft: "#22c55e18",
  gold: "#eab308", goldSoft: "#eab30818",
  purple: "#a855f7", purpleSoft: "#a855f718",
  cyan: "#06b6d4",
  white: "#eaeaef", gray: "#6b6b80", dark: "#3a3a4a",
};

function rank(score) {
  if (score >= 50000) return { label: "LEGENDARY", color: c.gold };
  if (score >= 20000) return { label: "ELITE", color: c.purple };
  if (score >= 10000) return { label: "VETERAN", color: c.blue };
  if (score >= 5000) return { label: "ADVANCED", color: c.green };
  if (score > 0) return { label: "ROOKIE", color: c.gray };
  return { label: "UNRANKED", color: c.dark };
}

function Pill({ text, color }) {
  return <span style={{ padding: "2px 9px", borderRadius: 14, fontSize: 10, fontWeight: 700, background: color + "1a", color, letterSpacing: 0.8 }}>{text}</span>;
}

function Modal({ title, fields, onDone, onCancel }) {
  let [vals, setVals] = useState({});
  let set = (k, v) => setVals(prev => ({ ...prev, [k]: v }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000a", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }} onClick={onCancel}>
      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 16, padding: 28, width: "92%", maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 17, fontWeight: 700, color: c.white, marginBottom: 20 }}>{title}</div>
        {fields.map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: c.gray, marginBottom: 5, textTransform: "uppercase", letterSpacing: 1.2 }}>{f.label}</div>
            {f.options ? (
              <select value={vals[f.key] || ""} onChange={e => set(f.key, e.target.value)} style={{ width: "100%", padding: "9px 12px", background: c.bg, border: `1px solid ${c.line}`, borderRadius: 8, color: c.white, fontSize: 13, outline: "none" }}>
                <option value="">pick one</option>
                {f.options.map(o => <option key={o.v} value={o.v}>{o.t}</option>)}
              </select>
            ) : (
              <input type={f.type || "text"} placeholder={f.ph || ""} value={vals[f.key] || ""} onChange={e => set(f.key, e.target.value)} style={{ width: "100%", padding: "9px 12px", background: c.bg, border: `1px solid ${c.line}`, borderRadius: 8, color: c.white, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            )}
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button onClick={() => onDone(vals)} style={{ flex: 1, padding: 11, background: c.red, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save</button>
          <button onClick={onCancel} style={{ flex: 1, padding: 11, background: c.bg, color: c.gray, border: `1px solid ${c.line}`, borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function Table({ cols, rows, onRemove }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>{cols.map(h => <th key={h.k} style={{ padding: "11px 13px", textAlign: "left", color: c.gray, borderBottom: `1px solid ${c.line}`, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.1 }}>{h.t}</th>)}{onRemove && <th style={{ padding: "11px 13px", borderBottom: `1px solid ${c.line}`, width: 70 }}></th>}</tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={cols.length + (onRemove ? 1 : 0)} style={{ padding: 36, textAlign: "center", color: c.dark }}>nothing here yet</td></tr>}
          {rows.map((row, i) => (
            <tr key={i} onMouseEnter={e => e.currentTarget.style.background = c.cardHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              {cols.map(h => <td key={h.k} style={{ padding: "9px 13px", color: c.white, fontSize: 13 }}>{h.fn ? h.fn(row[h.k], row) : row[h.k]}</td>)}
              {onRemove && <td style={{ padding: "9px 13px" }}><button onClick={() => onRemove(row)} style={{ background: c.redSoft, color: c.red, border: "none", borderRadius: 5, padding: "3px 9px", fontSize: 10, cursor: "pointer" }}>del</button></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Num({ val, color, label, ico }) {
  return (
    <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, padding: "20px 18px", flex: "1 1 130px", minWidth: 130, position: "relative" }}>
      <div style={{ position: "absolute", top: 10, right: 12, fontSize: 24, opacity: 0.12 }}>{ico}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{typeof val === "number" ? val.toLocaleString() : val}</div>
      <div style={{ fontSize: 10, color: c.gray, marginTop: 5, textTransform: "uppercase", letterSpacing: 1.5 }}>{label}</div>
    </div>
  );
}

function Home({ stats, users, games }) {
  let s = stats[0] || {};
  let top5 = [...users].sort((a, b) => (b.total_score || 0) - (a.total_score || 0)).slice(0, 5);
  let topG = [...games].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0)).slice(0, 5);
  let totalKills = users.reduce((acc, u) => acc + (u.total_kills || 0), 0);

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: c.white, marginBottom: 22 }}>Dashboard</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
        <Num val={s.total_users || 0} color={c.red} label="players" ico="👤" />
        <Num val={s.total_games || 0} color={c.blue} label="games" ico="🎮" />
        <Num val={s.total_sessions || 0} color={c.green} label="sessions" ico="⏱" />
        <Num val={s.total_achievements || 0} color={c.gold} label="unlocked" ico="🏆" />
        <Num val={s.total_reviews || 0} color={c.purple} label="reviews" ico="⭐" />
        <Num val={Math.round((s.total_play_minutes || 0) / 60)} color={c.cyan} label="play hours" ico="🕐" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 11, color: c.gray, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>Top Players</div>
          {top5.map((p, i) => {
            let r = rank(p.total_score || 0);
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < 4 ? `1px solid ${c.line}10` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: c.dark, fontSize: 12, width: 18 }}>#{i + 1}</span>
                  <span style={{ color: c.white, fontSize: 13 }}>{p.username}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Pill text={r.label} color={r.color} />
                  <span style={{ color: c.gray, fontSize: 11 }}>{(p.total_score || 0).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 11, color: c.gray, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>Top Rated</div>
          {topG.map((g, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < 4 ? `1px solid ${c.line}10` : "none" }}>
              <div>
                <div style={{ color: c.white, fontSize: 13 }}>{g.title}</div>
                <div style={{ color: c.dark, fontSize: 10 }}>{g.genres || g.platform}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: c.gold, fontWeight: 700, fontSize: 15 }}>{g.avg_rating}</span>
                <span style={{ color: c.dark, fontSize: 10 }}>/10</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, padding: 18 }}>
        <div style={{ fontSize: 11, color: c.gray, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>Score Distribution</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { label: "Legendary 50k+", count: users.filter(u => (u.total_score || 0) >= 50000).length, color: c.gold },
            { label: "Elite 20-50k", count: users.filter(u => (u.total_score || 0) >= 20000 && (u.total_score || 0) < 50000).length, color: c.purple },
            { label: "Veteran 10-20k", count: users.filter(u => (u.total_score || 0) >= 10000 && (u.total_score || 0) < 20000).length, color: c.blue },
            { label: "Rookie <10k", count: users.filter(u => (u.total_score || 0) > 0 && (u.total_score || 0) < 10000).length, color: c.green },
          ].map((tier, i) => (
            <div key={i} style={{ flex: "1 1 120px", background: tier.color + "0d", border: `1px solid ${tier.color}22`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: tier.color }}>{tier.count}</div>
              <div style={{ fontSize: 10, color: c.gray, marginTop: 3 }}>{tier.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Players({ users, isAdmin, refresh }) {
  let [modal, setModal] = useState(false);
  let [search, setSearch] = useState("");

  let filtered = users.filter(u => (u.username || "").toLowerCase().includes(search.toLowerCase()) || (u.country || "").toLowerCase().includes(search.toLowerCase()));

  async function create(d) {
    await sendData("users", "POST", { ...d, password_hash: "h_" + Date.now() });
    setModal(false);
    refresh();
  }

  async function remove(row) {
    if (!confirm(`Remove ${row.username}?`)) return;
    await sendData(`users/${row.user_id}`, "DELETE");
    refresh();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: c.white }}>Players <span style={{ color: c.gray, fontWeight: 400, fontSize: 14 }}>({filtered.length})</span></div>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="search..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: "8px 14px", background: c.card, border: `1px solid ${c.line}`, borderRadius: 8, color: c.white, fontSize: 12, outline: "none", width: 180 }} />
          {isAdmin && <button onClick={() => setModal(true)} style={{ padding: "8px 18px", background: c.red, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ add</button>}
        </div>
      </div>
      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, overflow: "hidden" }}>
        <Table
          cols={[
            { k: "user_id", t: "id" },
            { k: "username", t: "name", fn: v => <span style={{ color: c.red, fontWeight: 600 }}>{v}</span> },
            { k: "email", t: "email" },
            { k: "country", t: "country" },
            { k: "total_score", t: "score", fn: (v) => { let r = rank(v || 0); return <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span>{(v || 0).toLocaleString()}</span><Pill text={r.label} color={r.color} /></span>; } },
            { k: "total_kills", t: "kills" },
            { k: "achievements", t: "ach", fn: v => <span style={{ color: c.gold }}>🏆 {v || 0}</span> },
            { k: "games_played", t: "games" },
          ]}
          rows={filtered}
          onRemove={isAdmin ? remove : null}
        />
      </div>
      {modal && <Modal title="New Player" fields={[
        { key: "username", label: "Username", ph: "gamertag" },
        { key: "email", label: "Email", type: "email", ph: "mail@example.com" },
        { key: "country", label: "Country", ph: "USA" },
        { key: "dob", label: "Birth Date", type: "date" },
      ]} onDone={create} onCancel={() => setModal(false)} />}
    </div>
  );
}

function Games({ games, isAdmin, refresh }) {
  let [modal, setModal] = useState(false);
  let [search, setSearch] = useState("");

  let filtered = games.filter(g => (g.title || "").toLowerCase().includes(search.toLowerCase()) || (g.developer || "").toLowerCase().includes(search.toLowerCase()));

  async function create(d) {
    await sendData("games", "POST", d);
    setModal(false);
    refresh();
  }

  async function remove(row) {
    if (!confirm(`Delete ${row.title} and ALL related data?`)) return;
    await sendData(`games/${row.game_id}`, "DELETE");
    refresh();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: c.white }}>Games <span style={{ color: c.gray, fontWeight: 400, fontSize: 14 }}>({filtered.length})</span></div>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="search..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: "8px 14px", background: c.card, border: `1px solid ${c.line}`, borderRadius: 8, color: c.white, fontSize: 12, outline: "none", width: 180 }} />
          {isAdmin && <button onClick={() => setModal(true)} style={{ padding: "8px 18px", background: c.blue, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ add</button>}
        </div>
      </div>
      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, overflow: "hidden" }}>
        <Table
          cols={[
            { k: "game_id", t: "id" },
            { k: "title", t: "title", fn: v => <span style={{ color: c.blue, fontWeight: 600 }}>{v}</span> },
            { k: "developer", t: "developer" },
            { k: "platform", t: "platform" },
            { k: "genres", t: "genres", fn: v => (v || "").split(", ").map((g, i) => <Pill key={i} text={g} color={c.purple} />) },
            { k: "avg_rating", t: "rating", fn: v => <span style={{ color: (v || 0) >= 8 ? c.green : (v || 0) >= 6 ? c.gold : c.red, fontWeight: 700 }}>{v || "—"}<span style={{ color: c.dark, fontWeight: 400 }}>/10</span></span> },
            { k: "player_count", t: "players" },
            { k: "review_count", t: "reviews" },
          ]}
          rows={filtered}
          onRemove={isAdmin ? remove : null}
        />
      </div>
      {modal && <Modal title="New Game" fields={[
        { key: "title", label: "Title", ph: "Game name" },
        { key: "developer", label: "Developer", ph: "Studio" },
        { key: "publisher", label: "Publisher", ph: "Publisher" },
        { key: "platform_id", label: "Platform", options: [
          { v: 1, t: "Steam" }, { v: 2, t: "PlayStation" }, { v: 3, t: "Xbox" }, { v: 4, t: "Nintendo" }, { v: 5, t: "Epic" },
        ]},
        { key: "release_date", label: "Release", type: "date" },
        { key: "avg_playtime", label: "Playtime (hrs)", type: "number" },
      ]} onDone={create} onCancel={() => setModal(false)} />}
    </div>
  );
}

function Achievements({ data }) {
  let [search, setSearch] = useState("");
  let filtered = data.filter(a => (a.title || "").toLowerCase().includes(search.toLowerCase()) || (a.game || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: c.white }}>Achievements <span style={{ color: c.gray, fontWeight: 400, fontSize: 14 }}>({filtered.length})</span></div>
        <input placeholder="search..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: "8px 14px", background: c.card, border: `1px solid ${c.line}`, borderRadius: 8, color: c.white, fontSize: 12, outline: "none", width: 180 }} />
      </div>
      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, overflow: "hidden" }}>
        <Table cols={[
          { k: "game", t: "game", fn: v => <span style={{ color: c.blue }}>{v}</span> },
          { k: "title", t: "achievement", fn: v => <b>{v}</b> },
          { k: "criteria_type", t: "type", fn: v => <Pill text={v} color={c.purple} /> },
          { k: "threshold_num", t: "threshold", fn: v => (v || 0).toLocaleString() },
          { k: "unlock_count", t: "unlocked", fn: v => <span style={{ color: c.gold }}>🏆 {v || 0}</span> },
        ]} rows={filtered} />
      </div>
    </div>
  );
}

function Sessions({ data }) {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: c.white, marginBottom: 18 }}>Sessions <span style={{ color: c.gray, fontWeight: 400, fontSize: 14 }}>({data.length})</span></div>
      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, overflow: "hidden" }}>
        <Table cols={[
          { k: "session_id", t: "id" },
          { k: "username", t: "player", fn: v => <span style={{ color: c.red }}>{v}</span> },
          { k: "game", t: "game", fn: v => <span style={{ color: c.blue }}>{v}</span> },
          { k: "started_at", t: "start" },
          { k: "ended_at", t: "end" },
          { k: "hours", t: "hrs", fn: v => v ? v + "h" : "active" },
          { k: "platform_acc", t: "account" },
        ]} rows={data} />
      </div>
    </div>
  );
}

function Reviews({ data }) {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: c.white, marginBottom: 18 }}>Reviews <span style={{ color: c.gray, fontWeight: 400, fontSize: 14 }}>({data.length})</span></div>
      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, overflow: "hidden" }}>
        <Table cols={[
          { k: "username", t: "player", fn: v => <span style={{ color: c.red }}>{v}</span> },
          { k: "game", t: "game", fn: v => <span style={{ color: c.blue }}>{v}</span> },
          { k: "rating", t: "rating", fn: v => <span>{"★".repeat(Math.round((v || 0) / 2))}{"☆".repeat(5 - Math.round((v || 0) / 2))} <span style={{ color: c.gray, fontSize: 11 }}>{v}/10</span></span> },
          { k: "review_title", t: "title" },
          { k: "created_at", t: "date" },
        ]} rows={data} />
      </div>
    </div>
  );
}

function Audit({ data, isAdmin }) {
  if (!isAdmin) return <div style={{ color: c.gray, padding: 40, textAlign: "center" }}>admin access required</div>;
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: c.white, marginBottom: 18 }}>Audit Log <span style={{ color: c.gray, fontWeight: 400, fontSize: 14 }}>({data.length})</span></div>
      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, overflow: "hidden" }}>
        <Table cols={[
          { k: "log_id", t: "#" },
          { k: "action_date", t: "when", fn: v => <span style={{ fontSize: 10 }}>{v}</span> },
          { k: "table_name", t: "table", fn: v => <Pill text={v} color={c.blue} /> },
          { k: "action", t: "action", fn: v => <Pill text={v} color={v === "INSERT" ? c.green : v === "DELETE" ? c.red : c.gold} /> },
          { k: "user_name", t: "who" },
          { k: "details", t: "details", fn: v => <span style={{ fontSize: 10, color: c.gray }}>{(v || "").substring(0, 55)}{(v || "").length > 55 ? "..." : ""}</span> },
        ]} rows={data} />
      </div>
    </div>
  );
}

function Login({ onLogin }) {
  let [user, setUser] = useState("");
  let [pass, setPass] = useState("");
  let [err, setErr] = useState("");

  function go() {
    if (user === "admin" && pass === "admin123") { onLogin("admin"); return; }
    if (user && pass === "player") { onLogin("user"); return; }
    setErr("wrong credentials. admin: admin/admin123, player: any/player");
  }

  return (
    <div style={{ minHeight: "100vh", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Manrope', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: "40px 36px", width: "90%", maxWidth: 360, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 6 }}>🎮</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: c.white, marginBottom: 4 }}>Game Tracker</div>
        <div style={{ fontSize: 11, color: c.gray, marginBottom: 28, textTransform: "uppercase", letterSpacing: 2 }}>sign in to continue</div>

        <input placeholder="username" value={user} onChange={e => setUser(e.target.value)} style={{ width: "100%", padding: "11px 14px", background: c.bg, border: `1px solid ${c.line}`, borderRadius: 10, color: c.white, fontSize: 14, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
        <input placeholder="password" type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} style={{ width: "100%", padding: "11px 14px", background: c.bg, border: `1px solid ${c.line}`, borderRadius: 10, color: c.white, fontSize: 14, outline: "none", marginBottom: 16, boxSizing: "border-box" }} />
        {err && <div style={{ color: c.red, fontSize: 11, marginBottom: 12 }}>{err}</div>}
        <button onClick={go} style={{ width: "100%", padding: 12, background: c.red, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Log In</button>

        <div style={{ marginTop: 20, fontSize: 10, color: c.dark, lineHeight: 1.6 }}>
          admin → admin / admin123<br />player → anything / player
        </div>
      </div>
    </div>
  );
}

let tabs = [
  { id: "home", name: "Dashboard", ico: "📊" },
  { id: "players", name: "Players", ico: "👤" },
  { id: "games", name: "Games", ico: "🎮" },
  { id: "achievements", name: "Achievements", ico: "🏆" },
  { id: "sessions", name: "Sessions", ico: "⏱" },
  { id: "reviews", name: "Reviews", ico: "⭐" },
  { id: "audit", name: "Audit Log", ico: "📋", adminOnly: true },
];

export default function App() {
  let [role, setRole] = useState(null);
  let [tab, setTab] = useState("home");
  let [live, setLive] = useState(false);
  let [d, setD] = useState({
    stats: fallback.stats, users: fallback.users, games: fallback.games,
    achievements: fallback.achievements, reviews: fallback.reviews,
    sessions: fallback.sessions, audit: fallback.audit,
  });

  let load = useCallback(async () => {
    try {
      let [stats, users, games, achievements, reviews, sessions, audit] = await Promise.all([
        fetchData("stats"), fetchData("users"), fetchData("games"),
        fetchData("achievements"), fetchData("reviews"), fetchData("sessions"), fetchData("audit"),
      ]);
      if (users.length > 0) {
        setD({ stats, users, games, achievements, reviews, sessions, audit });
        setLive(true);
      }
    } catch (e) { }
  }, []);

  useEffect(() => { if (role) load(); }, [role, load]);

  if (!role) return <Login onLogin={setRole} />;

  let isAdmin = role === "admin";
  let visibleTabs = tabs.filter(t => !t.adminOnly || isAdmin);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: c.bg, color: c.white, fontFamily: "'Manrope', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <nav style={{ width: 200, background: c.card, borderRight: `1px solid ${c.line}`, padding: "20px 0", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "0 16px 18px", borderBottom: `1px solid ${c.line}` }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: c.red }}>🎮 Game Tracker</div>
          <div style={{ fontSize: 9, color: c.dark, marginTop: 3, textTransform: "uppercase", letterSpacing: 2 }}>{isAdmin ? "admin panel" : "player view"}</div>
        </div>

        <div style={{ padding: "12px 8px", flex: 1 }}>
          {visibleTabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "8px 12px", border: "none", borderRadius: 8,
              background: tab === t.id ? c.redSoft : "transparent",
              color: tab === t.id ? c.red : c.gray,
              fontSize: 12, fontWeight: tab === t.id ? 700 : 400,
              cursor: "pointer", marginBottom: 2, textAlign: "left",
            }}>
              <span style={{ fontSize: 14 }}>{t.ico}</span>{t.name}
            </button>
          ))}
        </div>

        <div style={{ padding: "12px 16px", borderTop: `1px solid ${c.line}` }}>
          <div style={{ fontSize: 9, color: live ? c.green : c.gold, display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: live ? c.green : c.gold }}></span>
            {live ? "LIVE" : "DEMO"}
          </div>
          <button onClick={() => { setRole(null); setTab("home"); }} style={{
            width: "100%", padding: 7, background: c.bg, color: c.gray,
            border: `1px solid ${c.line}`, borderRadius: 6, fontSize: 10, cursor: "pointer",
          }}>logout</button>
        </div>
      </nav>

      <main style={{ flex: 1, padding: 28, overflowY: "auto", maxHeight: "100vh" }}>
        {tab === "home" && <Home stats={d.stats} users={d.users} games={d.games} />}
        {tab === "players" && <Players users={d.users} isAdmin={isAdmin} refresh={load} />}
        {tab === "games" && <Games games={d.games} isAdmin={isAdmin} refresh={load} />}
        {tab === "achievements" && <Achievements data={d.achievements} />}
        {tab === "sessions" && <Sessions data={d.sessions} />}
        {tab === "reviews" && <Reviews data={d.reviews} />}
        {tab === "audit" && <Audit data={d.audit} isAdmin={isAdmin} />}
      </main>
    </div>
  );
}