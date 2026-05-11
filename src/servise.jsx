import { useState, useEffect, useCallback } from "react";

// ============================================================
// CONFIG - Change this to your APEX ORDS URL
// ============================================================
const API_BASE = "https://oracleapex.com/ords/wksp_ecipij/api";

// ============================================================
// API Helper
// ============================================================
const api = {
  get: async (endpoint) => {
    try {
      const res = await fetch(`${API_BASE}/${endpoint}`);
      const data = await res.json();
      return data.items || [];
    } catch (e) {
      console.error("API GET error:", e);
      return [];
    }
  },
  post: async (endpoint, body) => {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res;
  },
  put: async (endpoint, body) => {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res;
  },
  del: async (endpoint) => {
    const res = await fetch(`${API_BASE}/${endpoint}`, { method: "DELETE" });
    return res;
  },
};

// ============================================================
// Demo data (used when API is not available)
// ============================================================
const DEMO = {
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
  ],
  games: [
    { game_id: 1, title: "Dragon Siege", developer: "Mythic Studios", platform: "Steam", genres: "Action, RPG", avg_rating: 8.9, player_count: 8, review_count: 7 },
    { game_id: 2, title: "Shadow Ops", developer: "Vortex Dev", platform: "PlayStation Network", genres: "Action, FPS", avg_rating: 8.7, player_count: 7, review_count: 6 },
    { game_id: 7, title: "Cyber Runner", developer: "Neon Works", platform: "Steam", genres: "Action, FPS", avg_rating: 8.8, player_count: 7, review_count: 4 },
    { game_id: 13, title: "Battle Royale X", developer: "Arena Studios", platform: "PlayStation Network", genres: "Action, FPS", avg_rating: 9.2, player_count: 8, review_count: 5 },
    { game_id: 15, title: "Dungeon Crawl", developer: "Dark Depths", platform: "Steam", genres: "Adventure, RPG", avg_rating: 9.0, player_count: 5, review_count: 3 },
  ],
  reviews: [
    { review_id: 1, username: "dark_knight", game: "Dragon Siege", rating: 9, review_title: "Amazing RPG!", created_at: "2025-12-01" },
    { review_id: 4, username: "cyber_wolf", game: "Shadow Ops", rating: 10, review_title: "Perfect shooter", created_at: "2025-12-02" },
    { review_id: 8, username: "fire_mage", game: "Dragon Siege", rating: 10, review_title: "Masterpiece", created_at: "2025-12-05" },
  ],
  achievements: [
    { achievement_id: 1, game: "Dragon Siege", title: "Dragon Slayer", criteria_type: "kills", threshold_num: 1, unlock_count: 7 },
    { achievement_id: 2, game: "Dragon Siege", title: "Century of Blood", criteria_type: "kills", threshold_num: 100, unlock_count: 4 },
    { achievement_id: 6, game: "Shadow Ops", title: "First Blood", criteria_type: "kills", threshold_num: 1, unlock_count: 8 },
  ],
  audit: [
    { log_id: 1, table_name: "USERS", action: "INSERT", user_name: "ADMIN", action_date: "2025-12-01 10:00:00", details: "New user: dark_knight" },
  ],
};

// ============================================================
// Styles
// ============================================================
const colors = {
  bg: "#0a0a0f",
  surface: "#12121a",
  surfaceHover: "#1a1a28",
  border: "#1e1e30",
  accent: "#ff2d55",
  accentDim: "#ff2d5520",
  blue: "#0a84ff",
  blueDim: "#0a84ff20",
  green: "#30d158",
  greenDim: "#30d15820",
  yellow: "#ffd60a",
  yellowDim: "#ffd60a20",
  purple: "#bf5af2",
  text: "#f5f5f7",
  textDim: "#86868b",
  textMuted: "#48484a",
};

// ============================================================
// Components
// ============================================================

const StatCard = ({ label, value, color, icon }) => (
  <div style={{
    background: colors.surface, border: `1px solid ${colors.border}`,
    borderRadius: 16, padding: "24px 20px", flex: "1 1 140px",
    minWidth: 140, position: "relative", overflow: "hidden",
  }}>
    <div style={{
      position: "absolute", top: 12, right: 14, fontSize: 28, opacity: 0.15,
    }}>{icon}</div>
    <div style={{
      fontSize: 32, fontWeight: 700, color: color,
      fontFamily: "'JetBrains Mono', monospace",
    }}>{typeof value === "number" ? value.toLocaleString() : value}</div>
    <div style={{ fontSize: 12, color: colors.textDim, marginTop: 6, textTransform: "uppercase", letterSpacing: 1.5 }}>{label}</div>
  </div>
);

const DataTable = ({ columns, data, onDelete, deleteLabel = "Delete" }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} style={{
              padding: "12px 14px", textAlign: "left", color: colors.textDim,
              borderBottom: `1px solid ${colors.border}`, fontSize: 11,
              textTransform: "uppercase", letterSpacing: 1,
              fontFamily: "'JetBrains Mono', monospace",
            }}>{col.label}</th>
          ))}
          {onDelete && <th style={{ padding: "12px 14px", borderBottom: `1px solid ${colors.border}`, width: 80 }}></th>}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${colors.border}08` }}
            onMouseEnter={(e) => e.currentTarget.style.background = colors.surfaceHover}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            {columns.map((col) => (
              <td key={col.key} style={{ padding: "10px 14px", color: colors.text }}>
                {col.render ? col.render(row[col.key], row) : row[col.key]}
              </td>
            ))}
            {onDelete && (
              <td style={{ padding: "10px 14px" }}>
                <button onClick={() => onDelete(row)} style={{
                  background: "#ff2d5518", color: colors.accent, border: "none",
                  borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer",
                }}>{deleteLabel}</button>
              </td>
            )}
          </tr>
        ))}
        {data.length === 0 && (
          <tr><td colSpan={columns.length + (onDelete ? 1 : 0)} style={{
            padding: 40, textAlign: "center", color: colors.textMuted,
          }}>No data available</td></tr>
        )}
      </tbody>
    </table>
  </div>
);

const Badge = ({ children, color }) => (
  <span style={{
    display: "inline-block", padding: "3px 10px", borderRadius: 20,
    fontSize: 11, fontWeight: 600, background: color + "18", color: color,
    fontFamily: "'JetBrains Mono', monospace",
  }}>{children}</span>
);

const getRankColor = (score) => {
  if (score >= 50000) return colors.yellow;
  if (score >= 20000) return colors.purple;
  if (score >= 10000) return colors.blue;
  if (score >= 5000) return colors.green;
  return colors.textDim;
};

const getRankLabel = (score) => {
  if (score >= 50000) return "LEGENDARY";
  if (score >= 20000) return "ELITE";
  if (score >= 10000) return "VETERAN";
  if (score >= 5000) return "ADVANCED";
  if (score > 0) return "ROOKIE";
  return "UNRANKED";
};

const FormModal = ({ title, fields, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({});
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000000aa", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: colors.surface, border: `1px solid ${colors.border}`,
        borderRadius: 20, padding: 32, width: "90%", maxWidth: 440,
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: colors.text, margin: "0 0 24px", fontSize: 20 }}>{title}</h3>
        {fields.map((f) => (
          <div key={f.key} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, color: colors.textDim, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>{f.label}</label>
            {f.type === "select" ? (
              <select value={formData[f.key] || ""} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                style={{
                  width: "100%", padding: "10px 14px", background: colors.bg,
                  border: `1px solid ${colors.border}`, borderRadius: 10,
                  color: colors.text, fontSize: 14, outline: "none",
                }}>
                <option value="">Select...</option>
                {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input type={f.type || "text"} placeholder={f.placeholder || ""}
                value={formData[f.key] || ""}
                onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                style={{
                  width: "100%", padding: "10px 14px", background: colors.bg,
                  border: `1px solid ${colors.border}`, borderRadius: 10,
                  color: colors.text, fontSize: 14, outline: "none", boxSizing: "border-box",
                }} />
            )}
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={() => onSubmit(formData)} style={{
            flex: 1, padding: "12px", background: colors.accent, color: "#fff",
            border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>Create</button>
          <button onClick={onClose} style={{
            flex: 1, padding: "12px", background: colors.bg, color: colors.textDim,
            border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, cursor: "pointer",
          }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Pages
// ============================================================

const DashboardPage = ({ stats, users, games }) => {
  const s = stats[0] || {};
  const topPlayers = [...users].sort((a, b) => b.total_score - a.total_score).slice(0, 5);
  const topGames = [...games].sort((a, b) => b.avg_rating - a.avg_rating).slice(0, 5);

  return (
    <div>
      <h2 style={{ color: colors.text, fontSize: 24, margin: "0 0 24px", fontWeight: 700 }}>Dashboard</h2>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 32 }}>
        <StatCard label="Players" value={s.total_users || 0} color={colors.accent} icon="👤" />
        <StatCard label="Games" value={s.total_games || 0} color={colors.blue} icon="🎮" />
        <StatCard label="Sessions" value={s.total_sessions || 0} color={colors.green} icon="⏱" />
        <StatCard label="Achievements" value={s.total_achievements || 0} color={colors.yellow} icon="🏆" />
        <StatCard label="Reviews" value={s.total_reviews || 0} color={colors.purple} icon="⭐" />
        <StatCard label="Play Hours" value={Math.round((s.total_play_minutes || 0) / 60)} color={colors.blue} icon="🕐" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 20 }}>
          <h3 style={{ color: colors.textDim, fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 16px" }}>Top Players</h3>
          {topPlayers.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < topPlayers.length - 1 ? `1px solid ${colors.border}08` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: colors.textMuted, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, width: 20 }}>#{i + 1}</span>
                <span style={{ color: colors.text, fontSize: 14 }}>{p.username}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Badge color={getRankColor(p.total_score)}>{getRankLabel(p.total_score)}</Badge>
                <span style={{ color: colors.textDim, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{p.total_score?.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 20 }}>
          <h3 style={{ color: colors.textDim, fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 16px" }}>Top Rated Games</h3>
          {topGames.map((g, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < topGames.length - 1 ? `1px solid ${colors.border}08` : "none" }}>
              <div>
                <div style={{ color: colors.text, fontSize: 14 }}>{g.title}</div>
                <div style={{ color: colors.textMuted, fontSize: 11 }}>{g.genres}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: colors.yellow, fontWeight: 700, fontSize: 16 }}>{g.avg_rating}</span>
                <span style={{ color: colors.textMuted, fontSize: 11 }}>/ 10</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const UsersPage = ({ users, refresh }) => {
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (data) => {
    await api.post("users", { ...data, password_hash: "hash_" + Date.now() });
    setShowForm(false);
    refresh();
  };

  const handleDelete = async (row) => {
    if (confirm(`Delete user "${row.username}"?`)) {
      await api.del(`users/${row.user_id}`);
      refresh();
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ color: colors.text, fontSize: 24, margin: 0 }}>Players ({users.length})</h2>
        <button onClick={() => setShowForm(true)} style={{
          padding: "10px 20px", background: colors.accent, color: "#fff",
          border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>+ Add Player</button>
      </div>
      <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 16, overflow: "hidden" }}>
        <DataTable
          columns={[
            { key: "user_id", label: "ID" },
            { key: "username", label: "Username", render: (v) => <span style={{ color: colors.accent, fontWeight: 600 }}>{v}</span> },
            { key: "email", label: "Email" },
            { key: "country", label: "Country" },
            { key: "total_score", label: "Score", render: (v) => (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{(v || 0).toLocaleString()}</span>
                <Badge color={getRankColor(v || 0)}>{getRankLabel(v || 0)}</Badge>
              </div>
            )},
            { key: "achievements", label: "Achievements", render: (v) => <span style={{ color: colors.yellow }}>🏆 {v}</span> },
            { key: "games_played", label: "Games" },
          ]}
          data={users}
          onDelete={handleDelete}
        />
      </div>
      {showForm && (
        <FormModal title="Add New Player"
          fields={[
            { key: "username", label: "Username", placeholder: "e.g. pro_gamer" },
            { key: "email", label: "Email", type: "email", placeholder: "user@mail.com" },
            { key: "country", label: "Country", placeholder: "e.g. USA" },
            { key: "dob", label: "Date of Birth", type: "date" },
          ]}
          onSubmit={handleCreate} onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

const GamesPage = ({ games, refresh }) => {
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (data) => {
    await api.post("games", data);
    setShowForm(false);
    refresh();
  };

  const handleDelete = async (row) => {
    if (confirm(`Delete game "${row.title}"? This will remove all related data.`)) {
      await api.del(`games/${row.game_id}`);
      refresh();
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ color: colors.text, fontSize: 24, margin: 0 }}>Games ({games.length})</h2>
        <button onClick={() => setShowForm(true)} style={{
          padding: "10px 20px", background: colors.blue, color: "#fff",
          border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>+ Add Game</button>
      </div>
      <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 16, overflow: "hidden" }}>
        <DataTable
          columns={[
            { key: "game_id", label: "ID" },
            { key: "title", label: "Title", render: (v) => <span style={{ color: colors.blue, fontWeight: 600 }}>{v}</span> },
            { key: "developer", label: "Developer" },
            { key: "platform", label: "Platform" },
            { key: "genres", label: "Genres", render: (v) => v?.split(", ").map((g, i) => <Badge key={i} color={colors.purple}>{g}</Badge>) },
            { key: "avg_rating", label: "Rating", render: (v) => (
              <span style={{ color: v >= 8 ? colors.green : v >= 6 ? colors.yellow : colors.accent, fontWeight: 700 }}>
                {v || "—"} <span style={{ color: colors.textMuted, fontWeight: 400 }}>/ 10</span>
              </span>
            )},
            { key: "player_count", label: "Players" },
          ]}
          data={games}
          onDelete={handleDelete}
        />
      </div>
      {showForm && (
        <FormModal title="Add New Game"
          fields={[
            { key: "title", label: "Title", placeholder: "Game title" },
            { key: "developer", label: "Developer", placeholder: "Studio name" },
            { key: "publisher", label: "Publisher", placeholder: "Publisher name" },
            { key: "platform_id", label: "Platform", type: "select", options: [
              { value: 1, label: "Steam" }, { value: 2, label: "PlayStation Network" },
              { value: 3, label: "Xbox Live" }, { value: 4, label: "Nintendo eShop" },
              { value: 5, label: "Epic Games Store" },
            ]},
            { key: "release_date", label: "Release Date", type: "date" },
            { key: "avg_playtime", label: "Avg Playtime (hours)", type: "number" },
          ]}
          onSubmit={handleCreate} onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

const AchievementsPage = ({ achievements }) => (
  <div>
    <h2 style={{ color: colors.text, fontSize: 24, margin: "0 0 20px" }}>Achievements ({achievements.length})</h2>
    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 16, overflow: "hidden" }}>
      <DataTable columns={[
        { key: "game", label: "Game", render: (v) => <span style={{ color: colors.blue }}>{v}</span> },
        { key: "title", label: "Achievement", render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
        { key: "criteria_type", label: "Criteria", render: (v) => <Badge color={colors.purple}>{v}</Badge> },
        { key: "threshold_num", label: "Threshold", render: (v) => <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{v?.toLocaleString()}</span> },
        { key: "unlock_count", label: "Unlocked", render: (v) => <span style={{ color: colors.yellow }}>🏆 {v}</span> },
      ]} data={achievements} />
    </div>
  </div>
);

const ReviewsPage = ({ reviews }) => (
  <div>
    <h2 style={{ color: colors.text, fontSize: 24, margin: "0 0 20px" }}>Reviews ({reviews.length})</h2>
    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 16, overflow: "hidden" }}>
      <DataTable columns={[
        { key: "username", label: "Player", render: (v) => <span style={{ color: colors.accent }}>{v}</span> },
        { key: "game", label: "Game", render: (v) => <span style={{ color: colors.blue }}>{v}</span> },
        { key: "rating", label: "Rating", render: (v) => (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {"★".repeat(Math.round(v / 2))}{"☆".repeat(5 - Math.round(v / 2))}
            <span style={{ color: colors.textDim, marginLeft: 6, fontSize: 12 }}>{v}/10</span>
          </div>
        )},
        { key: "review_title", label: "Title" },
        { key: "created_at", label: "Date" },
      ]} data={reviews} />
    </div>
  </div>
);

const AuditPage = ({ audit }) => (
  <div>
    <h2 style={{ color: colors.text, fontSize: 24, margin: "0 0 20px" }}>Audit Log ({audit.length})</h2>
    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 16, overflow: "hidden" }}>
      <DataTable columns={[
        { key: "log_id", label: "ID" },
        { key: "action_date", label: "Date", render: (v) => <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{v}</span> },
        { key: "table_name", label: "Table", render: (v) => <Badge color={colors.blue}>{v}</Badge> },
        { key: "action", label: "Action", render: (v) => (
          <Badge color={v === "INSERT" ? colors.green : v === "DELETE" ? colors.accent : colors.yellow}>{v}</Badge>
        )},
        { key: "user_name", label: "User" },
        { key: "details", label: "Details", render: (v) => <span style={{ fontSize: 11, color: colors.textDim }}>{v?.substring(0, 60)}{v?.length > 60 ? "..." : ""}</span> },
      ]} data={audit} />
    </div>
  </div>
);

// ============================================================
// Main App
// ============================================================
const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "users", label: "Players", icon: "👤" },
  { id: "games", label: "Games", icon: "🎮" },
  { id: "achievements", label: "Achievements", icon: "🏆" },
  { id: "reviews", label: "Reviews", icon: "⭐" },
  { id: "audit", label: "Audit Log", icon: "📋" },
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState({
    stats: DEMO.stats, users: DEMO.users, games: DEMO.games,
    achievements: DEMO.achievements, reviews: DEMO.reviews, audit: DEMO.audit,
  });
  const [loading, setLoading] = useState(false);
  const [useDemo, setUseDemo] = useState(true);

  const loadData = useCallback(async () => {
    // Внимание: я убрал здесь проверку на "YOUR_APEX", 
    // чтобы код теперь реально обращался к твоему API, а не зависал в DEMO режиме.
    setLoading(true);
    try {
      const [stats, users, games, achievements, reviews, audit] = await Promise.all([
        api.get("stats"), api.get("users"), api.get("games"),
        api.get("achievements"), api.get("reviews"), api.get("audit"),
      ]);
      if (users && users.length > 0) {
        setData({ stats, users, games, achievements, reviews, audit });
        setUseDemo(false);
      } else {
        setUseDemo(true);
      }
    } catch (e) {
      console.log("API not available, using demo data");
      setUseDemo(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div style={{
      display: "flex", minHeight: "100vh", background: colors.bg, color: colors.text,
      fontFamily: "'Outfit', -apple-system, sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <nav style={{
        width: 220, background: colors.surface, borderRight: `1px solid ${colors.border}`,
        padding: "24px 0", display: "flex", flexDirection: "column", flexShrink: 0,
      }}>
        <div style={{ padding: "0 20px 24px", borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.accent }}>🎮 Game Tracker</div>
          <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 4, textTransform: "uppercase", letterSpacing: 2 }}>Admin Panel</div>
        </div>

        <div style={{ padding: "16px 10px", flex: 1 }}>
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setPage(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 14px", border: "none", borderRadius: 10,
                background: page === item.id ? colors.accentDim : "transparent",
                color: page === item.id ? colors.accent : colors.textDim,
                fontSize: 13, fontWeight: page === item.id ? 600 : 400,
                cursor: "pointer", marginBottom: 4, textAlign: "left",
                transition: "all 0.15s",
              }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "16px 20px", borderTop: `1px solid ${colors.border}` }}>
          <div style={{
            fontSize: 10, color: useDemo ? colors.yellow : colors.green,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: useDemo ? colors.yellow : colors.green,
            }}></span>
            {useDemo ? "DEMO MODE" : "CONNECTED"}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, padding: 32, overflowY: "auto", maxHeight: "100vh" }}>
        {loading && <div style={{ color: colors.textMuted, textAlign: "center", padding: 40 }}>Loading...</div>}

        {page === "dashboard" && <DashboardPage stats={data.stats} users={data.users} games={data.games} />}
        {page === "users" && <UsersPage users={data.users} refresh={loadData} />}
        {page === "games" && <GamesPage games={data.games} refresh={loadData} />}
        {page === "achievements" && <AchievementsPage achievements={data.achievements} />}
        {page === "reviews" && <ReviewsPage reviews={data.reviews} />}
        {page === "audit" && <AuditPage audit={data.audit} />}
      </main>
    </div>
  );
}