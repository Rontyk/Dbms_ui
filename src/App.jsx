import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:8080/api";

async function fetchData(path, asUser) {
  try {
    const sep = path.includes("?") ? "&" : "?";
    const url = asUser ? `${API}/${path}${sep}app_user=${encodeURIComponent(asUser)}` : `${API}/${path}`;
    const r = await fetch(url);
    if (!r.ok) return [];
    const d = await r.json();
    return d.items || [];
  } catch (e) { return []; }
}

async function sendData(path, method, body, asUser) {
  try {
    const sep = path.includes("?") ? "&" : "?";
    const url = asUser ? `${API}/${path}${sep}app_user=${encodeURIComponent(asUser)}` : `${API}/${path}`;
    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return r;
  } catch (e) { return null; }
}

async function loginRequest(username, password) {
  try {
    const r = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) { return null; }
}

async function registerRequest(payload) {
  try {
    const r = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await r.text();
    if (!r.ok) {
      try { return { error: JSON.parse(text).error || "Registration failed" }; }
      catch { return { error: "Registration failed" }; }
    }
    return JSON.parse(text);
  } catch (e) { return { error: "Cannot reach server" }; }
}

const fallback = {
  stats: [{ total_users: 30, total_games: 15, total_sessions: 80, total_achievements: 51, total_reviews: 42, total_play_minutes: 14400 }],
  users: [], games: [], reviews: [], achievements: [], sessions: [], audit: [],
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
  if (score >= 50000) return { label: "LEGENDARY", color: c.gold, next: null };
  if (score >= 20000) return { label: "ELITE", color: c.purple, next: 50000 };
  if (score >= 10000) return { label: "VETERAN", color: c.blue, next: 20000 };
  if (score >= 5000) return { label: "ADVANCED", color: c.green, next: 10000 };
  if (score > 0) return { label: "ROOKIE", color: c.gray, next: 5000 };
  return { label: "UNRANKED", color: c.dark, next: 1 };
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

// ============================================================================
// FRIENDS — discover, request, accept, unfriend
// ============================================================================
function Friends({ me, users }) {
  let [friends, setFriends] = useState([]);
  let [incoming, setIncoming] = useState([]);
  let [sent, setSent] = useState([]);
  let [search, setSearch] = useState("");
  let [loading, setLoading] = useState(true);

  let loadAll = useCallback(async () => {
    setLoading(true);
    let [fr, inc, snt] = await Promise.all([
      fetchData(`friends/${me.username}`),
      fetchData(`friend-requests/${me.username}`),
      fetchData(`friend-sent/${me.username}`),
    ]);
    setFriends(fr); setIncoming(inc); setSent(snt);
    setLoading(false);
  }, [me.username]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function sendRequest(toUser) {
    let r = await sendData("friend-request", "POST", { from_username: me.username, to_user_id: toUser.user_id });
    if (r && !r.ok) {
      let err = await r.json().catch(() => ({}));
      alert(err.error || "Could not send request");
      return;
    }
    loadAll();
  }

  async function respond(fromUser, action) {
    let r = await sendData("friend-respond", "POST", { username: me.username, from_user_id: fromUser.user_id, action });
    if (r && !r.ok) {
      let err = await r.json().catch(() => ({}));
      alert(err.error || "Could not respond");
      return;
    }
    loadAll();
  }

  async function unfriend(friend) {
    if (!confirm(`Unfriend ${friend.username}?`)) return;
    let r = await sendData("friend", "DELETE", { username: me.username, friend_user_id: friend.user_id });
    if (r && !r.ok) {
      let err = await r.json().catch(() => ({}));
      alert(err.error || "Could not unfriend");
      return;
    }
    loadAll();
  }

  async function cancelSent(toUser) {
    if (!confirm(`Cancel friend request to ${toUser.username}?`)) return;
    let r = await sendData("friend", "DELETE", { username: me.username, friend_user_id: toUser.user_id });
    if (r && !r.ok) {
      let err = await r.json().catch(() => ({}));
      alert(err.error || "Could not cancel");
      return;
    }
    loadAll();
  }

  // Find players to add — exclude self, existing friends, pending in either direction
  let excludedIds = new Set([
    me.user_id,
    ...friends.map(f => f.user_id),
    ...incoming.map(i => i.user_id),
    ...sent.map(s => s.user_id),
  ]);

  let discoverable = users
    .filter(u => !excludedIds.has(u.user_id))
    .filter(u => !search || (u.username || "").toLowerCase().includes(search.toLowerCase()) || (u.country || "").toLowerCase().includes(search.toLowerCase()))
    .slice(0, 20);

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: c.white }}>Friends</div>
        <div style={{ fontSize: 11, color: c.gray, marginTop: 2 }}>
          {friends.length} friend{friends.length === 1 ? "" : "s"}
          {incoming.length > 0 && <> · <span style={{ color: c.gold }}>{incoming.length} new request{incoming.length === 1 ? "" : "s"}</span></>}
          {sent.length > 0 && <> · {sent.length} pending sent</>}
        </div>
      </div>

      {loading && <div style={{ color: c.dark, padding: 40, textAlign: "center" }}>loading...</div>}

      {/* INCOMING REQUESTS — highlighted at the top so they're not missed */}
      {!loading && incoming.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: c.gold, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            📨 incoming requests
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {incoming.map(req => {
              let r = rank(req.total_score || 0);
              return (
                <div key={req.user_id} style={{
                  background: c.goldSoft, border: `1px solid ${c.gold}44`, borderRadius: 14, padding: 16,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: c.white }}>{req.username}</div>
                      <div style={{ fontSize: 10, color: c.gray, marginTop: 2 }}>{req.country} · {req.requested_at}</div>
                    </div>
                    <Pill text={r.label} color={r.color} />
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => respond(req, "accept")} style={{ flex: 1, padding: "7px 0", background: c.green, color: "#fff", border: "none", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✓ accept</button>
                    <button onClick={() => respond(req, "reject")} style={{ flex: 1, padding: "7px 0", background: c.bg, color: c.gray, border: `1px solid ${c.line}`, borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>✕ reject</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MY FRIENDS */}
      {!loading && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: c.gray, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            👥 my friends
          </div>
          {friends.length === 0 ? (
            <div style={{ background: c.card, border: `1px dashed ${c.line}`, borderRadius: 14, padding: 30, textAlign: "center", color: c.dark, fontSize: 13 }}>
              no friends yet — add someone below!
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {friends.map(fr => {
                let r = rank(fr.total_score || 0);
                return (
                  <div key={fr.user_id} style={{
                    background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, padding: 16,
                    transition: "border-color 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = c.green + "44"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = c.line}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: c.white }}>{fr.username}</div>
                        <div style={{ fontSize: 10, color: c.gray, marginTop: 2 }}>{fr.country} · since {fr.friends_since}</div>
                      </div>
                      <Pill text={r.label} color={r.color} />
                    </div>
                    <div style={{ display: "flex", gap: 12, marginBottom: 12, fontSize: 11, color: c.gray }}>
                      <span>⚡ {(fr.total_score || 0).toLocaleString()}</span>
                      <span>⚔ {fr.total_kills || 0}</span>
                      <span>🏆 {fr.achievements || 0}</span>
                    </div>
                    <button onClick={() => unfriend(fr)} style={{ width: "100%", padding: "6px 0", background: c.bg, color: c.gray, border: `1px solid ${c.line}`, borderRadius: 7, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>unfriend</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SENT REQUESTS — small list */}
      {!loading && sent.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: c.gray, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>
            ⏳ waiting for response
          </div>
          <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, padding: "4px 0" }}>
            {sent.map((s, i) => (
              <div key={s.user_id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 16px", borderBottom: i < sent.length - 1 ? `1px solid ${c.line}40` : "none",
              }}>
                <div>
                  <span style={{ color: c.white, fontSize: 13, fontWeight: 600 }}>{s.username}</span>
                  <span style={{ color: c.dark, fontSize: 10, marginLeft: 8 }}>{s.country} · sent {s.requested_at}</span>
                </div>
                <button onClick={() => cancelSent(s)} style={{ background: "transparent", color: c.gray, border: `1px solid ${c.line}`, borderRadius: 6, padding: "4px 10px", fontSize: 10, cursor: "pointer" }}>cancel</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FIND PLAYERS */}
      {!loading && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 11, color: c.gray, textTransform: "uppercase", letterSpacing: 1.5 }}>
              🔍 find players
            </div>
            <input placeholder="search by name or country..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: "7px 12px", background: c.card, border: `1px solid ${c.line}`, borderRadius: 8, color: c.white, fontSize: 12, outline: "none", width: 230 }} />
          </div>
          {discoverable.length === 0 ? (
            <div style={{ background: c.card, border: `1px dashed ${c.line}`, borderRadius: 14, padding: 30, textAlign: "center", color: c.dark, fontSize: 12 }}>
              {search ? "no players match your search" : "no more players to add"}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
              {discoverable.map(u => {
                let r = rank(u.total_score || 0);
                return (
                  <div key={u.user_id} style={{
                    background: c.card, border: `1px solid ${c.line}`, borderRadius: 12, padding: 14,
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: c.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.username}</div>
                      <div style={{ fontSize: 10, color: c.gray, marginTop: 2 }}>{u.country} · {(u.total_score || 0).toLocaleString()}</div>
                    </div>
                    <button onClick={() => sendRequest(u)} style={{ background: c.red, color: "#fff", border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>+ add</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MY PROFILE — personal page for players
// ============================================================================
function MyProfile({ me, users, sessions, achievements, reviews, games }) {
  let myUser = users.find(u => u.username === me.username) || { username: me.username, total_score: 0, total_kills: 0, achievements: 0, games_played: 0, country: me.country || "Unknown", email: me.email };
  let mySessions = sessions.filter(s => s.username === me.username);
  let myReviews = reviews.filter(r => r.username === me.username);
  let myRank = rank(myUser.total_score || 0);

  let sortedUsers = [...users].sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
  let myPosition = sortedUsers.findIndex(u => u.username === me.username) + 1;
  let totalPlayers = sortedUsers.length;

  let score = myUser.total_score || 0;
  let progressPct = 0, tierFloor = 0;
  if (myRank.label === "LEGENDARY") progressPct = 100;
  else if (myRank.next) {
    if (myRank.label === "ELITE") tierFloor = 20000;
    else if (myRank.label === "VETERAN") tierFloor = 10000;
    else if (myRank.label === "ADVANCED") tierFloor = 5000;
    else if (myRank.label === "ROOKIE") tierFloor = 0;
    progressPct = Math.min(100, ((score - tierFloor) / (myRank.next - tierFloor)) * 100);
  }

  return (
    <div>
      <div style={{
        background: `linear-gradient(135deg, ${myRank.color}22 0%, ${c.card} 100%)`,
        border: `1px solid ${myRank.color}33`,
        borderRadius: 20, padding: 28, marginBottom: 22,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: c.gray, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>welcome back</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: c.white, marginBottom: 6 }}>{me.username}</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Pill text={myRank.label} color={myRank.color} />
              <span style={{ color: c.gray, fontSize: 12 }}>from {myUser.country}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: c.gray, textTransform: "uppercase", letterSpacing: 2 }}>global rank</div>
            <div style={{ fontSize: 38, fontWeight: 800, color: myRank.color, lineHeight: 1 }}>#{myPosition || "—"}</div>
            <div style={{ fontSize: 10, color: c.gray }}>of {totalPlayers} players</div>
          </div>
        </div>
        {myRank.next && (
          <div style={{ marginTop: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: c.gray, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1.2 }}>
              <span>progress to next tier</span>
              <span>{score.toLocaleString()} / {myRank.next.toLocaleString()}</span>
            </div>
            <div style={{ height: 8, background: c.bg, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPct}%`, background: myRank.color, transition: "width 0.6s" }} />
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 22 }}>
        <Num val={myUser.total_score || 0} color={c.gold} label="total score" ico="⚡" />
        <Num val={myUser.total_kills || 0} color={c.red} label="kills" ico="⚔" />
        <Num val={myUser.achievements || 0} color={c.purple} label="achievements" ico="🏆" />
        <Num val={myUser.games_played || 0} color={c.blue} label="games played" ico="🎮" />
        <Num val={mySessions.length} color={c.green} label="sessions" ico="⏱" />
        <Num val={myReviews.length} color={c.cyan} label="reviews" ico="⭐" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 11, color: c.gray, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>recent play sessions</div>
          {mySessions.length === 0 && <div style={{ color: c.dark, fontSize: 12, padding: "20px 0", textAlign: "center" }}>no sessions yet — go play something!</div>}
          {mySessions.slice(0, 6).map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < Math.min(mySessions.length, 6) - 1 ? `1px solid ${c.line}30` : "none" }}>
              <div>
                <div style={{ color: c.blue, fontSize: 13, fontWeight: 600 }}>{s.game}</div>
                <div style={{ color: c.dark, fontSize: 10 }}>{s.started_at}</div>
              </div>
              <div style={{ color: c.green, fontSize: 12, fontWeight: 600 }}>{s.hours ? s.hours + "h" : "active"}</div>
            </div>
          ))}
        </div>

        <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 11, color: c.gray, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>my reviews</div>
          {myReviews.length === 0 && <div style={{ color: c.dark, fontSize: 12, padding: "20px 0", textAlign: "center" }}>you haven't written any reviews yet</div>}
          {myReviews.slice(0, 6).map((r, i) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: i < Math.min(myReviews.length, 6) - 1 ? `1px solid ${c.line}30` : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ color: c.blue, fontSize: 13, fontWeight: 600 }}>{r.game}</div>
                <span style={{ color: c.gold, fontSize: 11, fontWeight: 700 }}>{r.rating}/10</span>
              </div>
              <div style={{ color: c.white, fontSize: 11, marginTop: 2 }}>{r.review_title}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, padding: 18 }}>
        <div style={{ fontSize: 11, color: c.gray, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>account info</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
          <div>
            <div style={{ fontSize: 9, color: c.gray, textTransform: "uppercase", letterSpacing: 1.5 }}>username</div>
            <div style={{ color: c.white, fontSize: 14, marginTop: 3 }}>{me.username}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: c.gray, textTransform: "uppercase", letterSpacing: 1.5 }}>email</div>
            <div style={{ color: c.white, fontSize: 14, marginTop: 3 }}>{me.email}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: c.gray, textTransform: "uppercase", letterSpacing: 1.5 }}>country</div>
            <div style={{ color: c.white, fontSize: 14, marginTop: 3 }}>{myUser.country}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: c.gray, textTransform: "uppercase", letterSpacing: 1.5 }}>role</div>
            <div style={{ marginTop: 3 }}><Pill text="PLAYER" color={c.gray} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrowseGames({ games }) {
  let [search, setSearch] = useState("");
  let [sortBy, setSortBy] = useState("rating");
  let filtered = games.filter(g => (g.title || "").toLowerCase().includes(search.toLowerCase()) || (g.developer || "").toLowerCase().includes(search.toLowerCase()) || (g.genres || "").toLowerCase().includes(search.toLowerCase()));
  if (sortBy === "rating") filtered = [...filtered].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
  else if (sortBy === "players") filtered = [...filtered].sort((a, b) => (b.player_count || 0) - (a.player_count || 0));
  else if (sortBy === "title") filtered = [...filtered].sort((a, b) => (a.title || "").localeCompare(b.title || ""));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: c.white }}>Browse Games</div>
          <div style={{ fontSize: 11, color: c.gray, marginTop: 2 }}>{filtered.length} games available</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: "8px 14px", background: c.card, border: `1px solid ${c.line}`, borderRadius: 8, color: c.white, fontSize: 12, outline: "none", cursor: "pointer" }}>
            <option value="rating">sort: rating</option>
            <option value="players">sort: players</option>
            <option value="title">sort: title</option>
          </select>
          <input placeholder="search games..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: "8px 14px", background: c.card, border: `1px solid ${c.line}`, borderRadius: 8, color: c.white, fontSize: 12, outline: "none", width: 200 }} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {filtered.length === 0 && <div style={{ gridColumn: "1 / -1", color: c.dark, textAlign: "center", padding: 60 }}>no games match your search</div>}
        {filtered.map(g => {
          let ratingColor = (g.avg_rating || 0) >= 8 ? c.green : (g.avg_rating || 0) >= 6 ? c.gold : c.red;
          return (
            <div key={g.game_id} style={{
              background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, padding: 18,
              transition: "transform 0.15s, border-color 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = c.blue + "55"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = c.line; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: c.white, lineHeight: 1.3 }}>{g.title}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                  <span style={{ color: ratingColor, fontSize: 18, fontWeight: 800 }}>{g.avg_rating || "—"}</span>
                  <span style={{ color: c.dark, fontSize: 10 }}>/10</span>
                </div>
              </div>
              <div style={{ color: c.gray, fontSize: 11, marginBottom: 12 }}>{g.developer} · {g.platform}</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12, minHeight: 22 }}>
                {(g.genres || "").split(", ").filter(Boolean).map((genre, i) => <Pill key={i} text={genre} color={c.purple} />)}
              </div>
              <div style={{ display: "flex", gap: 14, paddingTop: 10, borderTop: `1px solid ${c.line}` }}>
                <div>
                  <div style={{ fontSize: 9, color: c.gray, textTransform: "uppercase", letterSpacing: 1.2 }}>players</div>
                  <div style={{ fontSize: 13, color: c.white, fontWeight: 600 }}>{g.player_count || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: c.gray, textTransform: "uppercase", letterSpacing: 1.2 }}>reviews</div>
                  <div style={{ fontSize: 13, color: c.white, fontWeight: 600 }}>{g.review_count || 0}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Leaderboard({ users, me }) {
  let [search, setSearch] = useState("");
  let sorted = [...users].sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
  let filtered = sorted.filter(u => (u.username || "").toLowerCase().includes(search.toLowerCase()) || (u.country || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: c.white }}>Leaderboard</div>
          <div style={{ fontSize: 11, color: c.gray, marginTop: 2 }}>top players worldwide</div>
        </div>
        <input placeholder="find player..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: "8px 14px", background: c.card, border: `1px solid ${c.line}`, borderRadius: 8, color: c.white, fontSize: 12, outline: "none", width: 200 }} />
      </div>

      {!search && sorted.length >= 3 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[1, 0, 2].map((idx, i) => {
            let u = sorted[idx];
            let medals = ["🥇", "🥈", "🥉"];
            let colors = [c.gold, c.gray, "#cd7f32"];
            let heights = [180, 200, 160];
            let isMe = u.username === me.username;
            return (
              <div key={idx} style={{
                background: c.card, border: `1px solid ${isMe ? c.red : c.line}`, borderRadius: 14,
                padding: 18, textAlign: "center", height: heights[i], display: "flex",
                flexDirection: "column", justifyContent: "center", position: "relative",
              }}>
                {isMe && <div style={{ position: "absolute", top: 8, right: 8 }}><Pill text="YOU" color={c.red} /></div>}
                <div style={{ fontSize: 36, marginBottom: 4 }}>{medals[idx]}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors[idx] }}>{u.username}</div>
                <div style={{ fontSize: 10, color: c.gray, marginBottom: 6 }}>{u.country}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: c.white }}>{(u.total_score || 0).toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, overflow: "hidden" }}>
        {filtered.map((u, i) => {
          let pos = sorted.findIndex(x => x.username === u.username) + 1;
          let r = rank(u.total_score || 0);
          let isMe = u.username === me.username;
          return (
            <div key={u.user_id || i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 18px", borderBottom: i < filtered.length - 1 ? `1px solid ${c.line}40` : "none",
              background: isMe ? c.redSoft : "transparent",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: pos <= 3 ? r.color + "22" : c.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: pos <= 3 ? r.color : c.gray,
                }}>#{pos}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: c.white, fontSize: 14, fontWeight: 600 }}>{u.username}</span>
                    {isMe && <Pill text="YOU" color={c.red} />}
                  </div>
                  <div style={{ color: c.gray, fontSize: 11 }}>{u.country} · {u.games_played || 0} games · 🏆 {u.achievements || 0}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Pill text={r.label} color={r.color} />
                <div style={{ color: c.white, fontSize: 14, fontWeight: 700, minWidth: 80, textAlign: "right" }}>
                  {(u.total_score || 0).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Home({ stats, users, games }) {
  let s = stats[0] || {};
  let top5 = [...users].sort((a, b) => (b.total_score || 0) - (a.total_score || 0)).slice(0, 5);
  let topG = [...games].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0)).slice(0, 5);

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: c.white, marginBottom: 22 }}>Admin Dashboard</div>
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
    </div>
  );
}

function Players({ users, me, refresh }) {
  let [modal, setModal] = useState(false);
  let [search, setSearch] = useState("");
  let filtered = users.filter(u => (u.username || "").toLowerCase().includes(search.toLowerCase()) || (u.country || "").toLowerCase().includes(search.toLowerCase()));

  async function create(d) {
    let r = await sendData("users", "POST", { ...d, password_hash: "h_" + Date.now() }, me.username);
    if (r && !r.ok) { let err = await r.json().catch(() => ({})); alert(err.error || "Failed."); return; }
    setModal(false); refresh();
  }
  async function remove(row) {
    if (!confirm(`Remove ${row.username}?`)) return;
    let r = await sendData(`users/${row.user_id}`, "DELETE", null, me.username);
    if (r && !r.ok) { let err = await r.json().catch(() => ({})); alert(err.error || "Failed."); return; }
    refresh();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: c.white }}>Manage Players <span style={{ color: c.gray, fontWeight: 400, fontSize: 14 }}>({filtered.length})</span></div>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="search..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: "8px 14px", background: c.card, border: `1px solid ${c.line}`, borderRadius: 8, color: c.white, fontSize: 12, outline: "none", width: 180 }} />
          <button onClick={() => setModal(true)} style={{ padding: "8px 18px", background: c.red, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ add</button>
        </div>
      </div>
      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, overflow: "hidden" }}>
        <Table cols={[
          { k: "user_id", t: "id" },
          { k: "username", t: "name", fn: v => <span style={{ color: c.red, fontWeight: 600 }}>{v}</span> },
          { k: "email", t: "email" },
          { k: "country", t: "country" },
          { k: "role", t: "role", fn: v => v === "admin" ? <Pill text="ADMIN" color={c.gold} /> : <Pill text="PLAYER" color={c.gray} /> },
          { k: "total_score", t: "score", fn: (v) => { let r = rank(v || 0); return <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span>{(v || 0).toLocaleString()}</span><Pill text={r.label} color={r.color} /></span>; } },
          { k: "total_kills", t: "kills" },
          { k: "achievements", t: "ach", fn: v => <span style={{ color: c.gold }}>🏆 {v || 0}</span> },
        ]} rows={filtered} onRemove={remove} />
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

function Games({ games, me, refresh }) {
  let [modal, setModal] = useState(false);
  let [search, setSearch] = useState("");
  let filtered = games.filter(g => (g.title || "").toLowerCase().includes(search.toLowerCase()) || (g.developer || "").toLowerCase().includes(search.toLowerCase()));

  async function create(d) {
    let r = await sendData("games", "POST", d, me.username);
    if (r && !r.ok) { let err = await r.json().catch(() => ({})); alert(err.error || "Failed."); return; }
    setModal(false); refresh();
  }
  async function remove(row) {
    if (!confirm(`Delete ${row.title} and ALL related data?`)) return;
    let r = await sendData(`games/${row.game_id}`, "DELETE", null, me.username);
    if (r && !r.ok) { let err = await r.json().catch(() => ({})); alert(err.error || "Failed."); return; }
    refresh();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: c.white }}>Manage Games <span style={{ color: c.gray, fontWeight: 400, fontSize: 14 }}>({filtered.length})</span></div>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="search..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: "8px 14px", background: c.card, border: `1px solid ${c.line}`, borderRadius: 8, color: c.white, fontSize: 12, outline: "none", width: 180 }} />
          <button onClick={() => setModal(true)} style={{ padding: "8px 18px", background: c.blue, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ add</button>
        </div>
      </div>
      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 14, overflow: "hidden" }}>
        <Table cols={[
          { k: "game_id", t: "id" },
          { k: "title", t: "title", fn: v => <span style={{ color: c.blue, fontWeight: 600 }}>{v}</span> },
          { k: "developer", t: "developer" },
          { k: "platform", t: "platform" },
          { k: "genres", t: "genres", fn: v => (v || "").split(", ").map((g, i) => <Pill key={i} text={g} color={c.purple} />) },
          { k: "avg_rating", t: "rating", fn: v => <span style={{ color: (v || 0) >= 8 ? c.green : (v || 0) >= 6 ? c.gold : c.red, fontWeight: 700 }}>{v || "—"}<span style={{ color: c.dark, fontWeight: 400 }}>/10</span></span> },
          { k: "player_count", t: "players" },
          { k: "review_count", t: "reviews" },
        ]} rows={filtered} onRemove={remove} />
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

function Audit({ data }) {
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
  let [mode, setMode] = useState("login");
  let [user, setUser] = useState("");
  let [pass, setPass] = useState("");
  let [email, setEmail] = useState("");
  let [country, setCountry] = useState("");
  let [dob, setDob] = useState("");
  let [err, setErr] = useState("");
  let [okMsg, setOkMsg] = useState("");
  let [loading, setLoading] = useState(false);
  let isLogin = mode === "login";

  async function doLogin() {
    let u = user.trim(), p = pass.trim();
    if (!u || !p) { setErr("Enter both fields"); return; }
    setErr(""); setOkMsg(""); setLoading(true);
    let data = await loginRequest(u, p);
    setLoading(false);
    if (!data) { setErr("Wrong username or password"); return; }
    onLogin(data);
  }

  async function doRegister() {
    let u = user.trim(), p = pass.trim(), e = email.trim();
    if (!u || !p || !e) { setErr("Username, email, password required"); return; }
    if (u.length < 3) { setErr("Username must be at least 3 characters"); return; }
    if (p.length < 4) { setErr("Password must be at least 4 characters"); return; }
    setErr(""); setOkMsg(""); setLoading(true);
    let data = await registerRequest({ username: u, password: p, email: e, country: country.trim() || "Unknown", dob: dob || null });
    setLoading(false);
    if (data.error) {
      if (data.error.includes("ORA-01403") || data.error.includes("no data found")) {
        setOkMsg("Account created! Switching to sign in...");
        setMode("login"); setPass("");
        setTimeout(() => setOkMsg(""), 3500);
        return;
      }
      setErr(data.error);
      return;
    }
    onLogin(data);
  }

  let go = isLogin ? doLogin : doRegister;
  let inputStyle = { width: "100%", padding: "11px 14px", background: c.bg, border: `1px solid ${c.line}`, borderRadius: 10, color: c.white, fontSize: 14, outline: "none", marginBottom: 10, boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Manrope', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <div style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 20, padding: "40px 36px", width: "90%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 6 }}>🎮</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: c.white, marginBottom: 4 }}>Game Tracker</div>
          <div style={{ fontSize: 11, color: c.gray, textTransform: "uppercase", letterSpacing: 2 }}>{isLogin ? "sign in" : "create account"}</div>
        </div>
        <div style={{ display: "flex", marginBottom: 22, background: c.bg, borderRadius: 10, padding: 3 }}>
          <button onClick={() => { setMode("login"); setErr(""); setOkMsg(""); }} style={{ flex: 1, padding: "8px 0", background: isLogin ? c.red : "transparent", color: isLogin ? "#fff" : c.gray, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Sign In</button>
          <button onClick={() => { setMode("register"); setErr(""); setOkMsg(""); }} style={{ flex: 1, padding: "8px 0", background: !isLogin ? c.red : "transparent", color: !isLogin ? "#fff" : c.gray, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Create Account</button>
        </div>
        <input placeholder="username" value={user} onChange={e => setUser(e.target.value)} disabled={loading} style={inputStyle} />
        {!isLogin && <input placeholder="email" type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} style={inputStyle} />}
        <input placeholder="password" type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} disabled={loading} style={inputStyle} />
        {!isLogin && <input placeholder="country (optional)" value={country} onChange={e => setCountry(e.target.value)} disabled={loading} style={inputStyle} />}
        {!isLogin && <input placeholder="birth date (optional)" type="date" value={dob} onChange={e => setDob(e.target.value)} disabled={loading} style={inputStyle} />}
        {err && <div style={{ color: c.red, fontSize: 11, marginBottom: 12, textAlign: "center" }}>{err}</div>}
        {okMsg && <div style={{ color: c.green, fontSize: 11, marginBottom: 12, textAlign: "center" }}>{okMsg}</div>}
        <button onClick={go} disabled={loading} style={{ width: "100%", padding: 12, background: loading ? c.dark : c.red, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer", marginTop: 6 }}>
          {loading ? (isLogin ? "signing in..." : "creating...") : (isLogin ? "Sign In" : "Create Account")}
        </button>
        <div style={{ marginTop: 18, fontSize: 10, color: c.dark, textAlign: "center", lineHeight: 1.6 }}>
          {isLogin ? <>example admin: dark_knight / hash_abc1</> : <>new accounts start as <b style={{ color: c.gray }}>player</b></>}
        </div>
      </div>
    </div>
  );
}

let adminTabs = [
  { id: "home", name: "Dashboard", ico: "📊" },
  { id: "players", name: "Manage Players", ico: "👤" },
  { id: "games", name: "Manage Games", ico: "🎮" },
  { id: "achievements", name: "Achievements", ico: "🏆" },
  { id: "sessions", name: "Sessions", ico: "⏱" },
  { id: "reviews", name: "Reviews", ico: "⭐" },
  { id: "audit", name: "Audit Log", ico: "📋" },
];

let playerTabs = [
  { id: "profile", name: "My Profile", ico: "✨" },
  { id: "friends", name: "Friends", ico: "🤝" },
  { id: "browse", name: "Browse Games", ico: "🎮" },
  { id: "leaderboard", name: "Leaderboard", ico: "🏆" },
  { id: "achievements", name: "Achievements", ico: "🎯" },
  { id: "reviews", name: "Reviews", ico: "⭐" },
];

export default function App() {
  let [me, setMe] = useState(null);
  let [tab, setTab] = useState("");
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

  useEffect(() => { if (me) load(); }, [me, load]);

  if (!me) return <Login onLogin={(data) => { setMe(data); setTab(data.role === "admin" ? "home" : "profile"); }} />;

  let isAdmin = me.role === "admin";
  let visibleTabs = isAdmin ? adminTabs : playerTabs;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: c.bg, color: c.white, fontFamily: "'Manrope', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <nav style={{ width: 210, background: c.card, borderRight: `1px solid ${c.line}`, padding: "20px 0", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "0 16px 18px", borderBottom: `1px solid ${c.line}` }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: c.red }}>🎮 Game Tracker</div>
          <div style={{ fontSize: 9, color: c.dark, marginTop: 3, textTransform: "uppercase", letterSpacing: 2 }}>{isAdmin ? "admin panel" : "player view"}</div>
        </div>

        <div style={{ padding: "12px 14px", borderBottom: `1px solid ${c.line}` }}>
          <div style={{ fontSize: 9, color: c.gray, textTransform: "uppercase", letterSpacing: 1.5 }}>signed in</div>
          <div style={{ fontSize: 13, color: c.white, fontWeight: 700, marginTop: 2 }}>{me.username}</div>
          <div style={{ marginTop: 4 }}><Pill text={me.role.toUpperCase()} color={isAdmin ? c.gold : c.purple} /></div>
        </div>

        <div style={{ padding: "12px 8px", flex: 1 }}>
          {visibleTabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "9px 12px", border: "none", borderRadius: 8,
              background: tab === t.id ? c.redSoft : "transparent",
              color: tab === t.id ? c.red : c.gray,
              fontSize: 12, fontWeight: tab === t.id ? 700 : 500,
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
          <button onClick={() => { setMe(null); setTab(""); }} style={{
            width: "100%", padding: 7, background: c.bg, color: c.gray,
            border: `1px solid ${c.line}`, borderRadius: 6, fontSize: 10, cursor: "pointer",
          }}>logout</button>
        </div>
      </nav>

      <main style={{ flex: 1, padding: 28, overflowY: "auto", maxHeight: "100vh" }}>
        {isAdmin && tab === "home" && <Home stats={d.stats} users={d.users} games={d.games} />}
        {isAdmin && tab === "players" && <Players users={d.users} me={me} refresh={load} />}
        {isAdmin && tab === "games" && <Games games={d.games} me={me} refresh={load} />}
        {isAdmin && tab === "sessions" && <Sessions data={d.sessions} />}
        {isAdmin && tab === "audit" && <Audit data={d.audit} />}

        {!isAdmin && tab === "profile" && <MyProfile me={me} users={d.users} sessions={d.sessions} achievements={d.achievements} reviews={d.reviews} games={d.games} />}
        {!isAdmin && tab === "friends" && <Friends me={me} users={d.users} />}
        {!isAdmin && tab === "browse" && <BrowseGames games={d.games} />}
        {!isAdmin && tab === "leaderboard" && <Leaderboard users={d.users} me={me} />}

        {tab === "achievements" && <Achievements data={d.achievements} />}
        {tab === "reviews" && <Reviews data={d.reviews} />}
      </main>
    </div>
  );
}