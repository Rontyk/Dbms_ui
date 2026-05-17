BEGIN
    ORDS.ENABLE_SCHEMA;
    COMMIT;
END;
/

CREATE OR REPLACE PROCEDURE set_app_user_context AS
    v_header VARCHAR2(100);
BEGIN
    v_header := OWA_UTIL.get_cgi_env('HTTP_X_APP_USER');
    IF v_header IS NOT NULL THEN
        DBMS_SESSION.SET_IDENTIFIER(v_header);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END;
/

BEGIN
    ORDS.DEFINE_MODULE(
        p_module_name    => 'api',
        p_base_path      => '/api/',
        p_items_per_page => 100
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_TEMPLATE(p_module_name => 'api', p_pattern => 'login');

    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'login',
        p_method      => 'POST',
        p_source_type => 'plsql/block',
        p_source      => q'[
DECLARE
    v_user_id  NUMBER;
    v_username VARCHAR2(50);
    v_email    VARCHAR2(100);
    v_country  VARCHAR2(50);
    v_role     VARCHAR2(20);
BEGIN
    SELECT u.user_id, u.username, u.email, u.country,
           NVL(ar.role_name, 'player')
      INTO v_user_id, v_username, v_email, v_country, v_role
      FROM users u
      LEFT JOIN app_roles ar ON u.user_id = ar.user_id
     WHERE u.username = :body_username
       AND u.password_hash = :body_password;

    HTP.p('{');
    HTP.p('"user_id":' || v_user_id || ',');
    HTP.p('"username":"' || v_username || '",');
    HTP.p('"email":"' || v_email || '",');
    HTP.p('"country":"' || v_country || '",');
    HTP.p('"role":"' || v_role || '"');
    HTP.p('}');
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        OWA_UTIL.status_line(401);
        HTP.p('{"error":"Invalid credentials"}');
    WHEN OTHERS THEN
        OWA_UTIL.status_line(500);
        HTP.p('{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;
        ]'
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_TEMPLATE(p_module_name => 'api', p_pattern => 'stats');

    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'stats',
        p_method      => 'GET',
        p_source_type => 'json/collection',
        p_source      => q'[
SELECT
    (SELECT COUNT(*) FROM users)                            AS total_users,
    (SELECT COUNT(*) FROM games)                            AS total_games,
    (SELECT COUNT(*) FROM sessions)                         AS total_sessions,
    (SELECT COUNT(*) FROM user_achievements)                AS total_achievements,
    (SELECT COUNT(*) FROM reviews)                          AS total_reviews,
    (SELECT NVL(SUM(play_minutes),0) FROM player_stats)     AS total_play_minutes
FROM dual
        ]'
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_TEMPLATE(p_module_name => 'api', p_pattern => 'users');

    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'users',
        p_method      => 'GET',
        p_source_type => 'json/collection',
        p_source      => q'[
SELECT
    u.user_id,
    u.username,
    u.email,
    u.country,
    NVL(ar.role_name, 'player') AS role,
    NVL((SELECT SUM(ps.score)   FROM player_stats ps WHERE ps.user_id = u.user_id), 0) AS total_score,
    NVL((SELECT SUM(ps.kills)   FROM player_stats ps WHERE ps.user_id = u.user_id), 0) AS total_kills,
    (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = u.user_id)           AS achievements,
    (SELECT COUNT(DISTINCT ps.game_id) FROM player_stats ps WHERE ps.user_id = u.user_id) AS games_played
  FROM users u
  LEFT JOIN app_roles ar ON u.user_id = ar.user_id
 ORDER BY total_score DESC
        ]'
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'users',
        p_method      => 'POST',
        p_source_type => 'plsql/block',
        p_source      => q'[
DECLARE
    v_new_id NUMBER;
BEGIN
    set_app_user_context;

    INSERT INTO users (username, email, country, dob, password_hash)
    VALUES (:body_username, :body_email, :body_country,
            TO_DATE(:body_dob, 'YYYY-MM-DD'), :body_password_hash)
    RETURNING user_id INTO v_new_id;

    COMMIT;

    HTP.p('{"status":"ok","user_id":' || v_new_id || '}');
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        IF SQLCODE = -20051 THEN
            OWA_UTIL.status_line(403);
        ELSE
            OWA_UTIL.status_line(400);
        END IF;
        HTP.p('{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;
        ]'
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_TEMPLATE(p_module_name => 'api', p_pattern => 'users/:id');

    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'users/:id',
        p_method      => 'GET',
        p_source_type => 'json/collection',
        p_source      => q'[
SELECT u.user_id, u.username, u.email, u.country, u.dob,
       NVL(ar.role_name, 'player') AS role
  FROM users u
  LEFT JOIN app_roles ar ON u.user_id = ar.user_id
 WHERE u.user_id = :id
        ]'
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'users/:id',
        p_method      => 'PUT',
        p_source_type => 'plsql/block',
        p_source      => q'[
BEGIN
    set_app_user_context;

    UPDATE users
       SET email   = NVL(:body_email, email),
           country = NVL(:body_country, country)
     WHERE user_id = :id;

    COMMIT;
    HTP.p('{"status":"ok"}');
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        IF SQLCODE = -20051 THEN OWA_UTIL.status_line(403);
        ELSE OWA_UTIL.status_line(400);
        END IF;
        HTP.p('{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;
        ]'
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'users/:id',
        p_method      => 'DELETE',
        p_source_type => 'plsql/block',
        p_source      => q'[
BEGIN
    set_app_user_context;

    DELETE FROM user_achievements WHERE user_id = :id;
    DELETE FROM player_stats      WHERE user_id = :id;
    DELETE FROM sessions          WHERE user_id = :id;
    DELETE FROM reviews           WHERE user_id = :id;
    DELETE FROM friends           WHERE user_id = :id OR friend_id = :id;
    DELETE FROM app_roles         WHERE user_id = :id;
    DELETE FROM users             WHERE user_id = :id;

    COMMIT;
    HTP.p('{"status":"ok"}');
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        IF SQLCODE = -20051 THEN OWA_UTIL.status_line(403);
        ELSE OWA_UTIL.status_line(400);
        END IF;
        HTP.p('{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;
        ]'
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_TEMPLATE(p_module_name => 'api', p_pattern => 'games');

    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'games',
        p_method      => 'GET',
        p_source_type => 'json/collection',
        p_source      => q'[
SELECT
    g.game_id,
    g.title,
    g.developer,
    p.name AS platform,
    (SELECT LISTAGG(ge.name, ', ') WITHIN GROUP (ORDER BY ge.name)
       FROM game_genre gg JOIN genres ge ON gg.genre_id = ge.genre_id
      WHERE gg.game_id = g.game_id) AS genres,
    NVL((SELECT ROUND(AVG(r.rating),1) FROM reviews r WHERE r.game_id = g.game_id), 0) AS avg_rating,
    (SELECT COUNT(DISTINCT ps.user_id) FROM player_stats ps WHERE ps.game_id = g.game_id) AS player_count,
    (SELECT COUNT(*) FROM reviews r WHERE r.game_id = g.game_id) AS review_count
  FROM games g
  LEFT JOIN platforms p ON g.platform_id = p.platform_id
 ORDER BY g.title
        ]'
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'games',
        p_method      => 'POST',
        p_source_type => 'plsql/block',
        p_source      => q'[
DECLARE
    v_new_id NUMBER;
BEGIN
    set_app_user_context;

    INSERT INTO games (title, developer, publisher, platform_id, release_date, avg_playtime)
    VALUES (:body_title, :body_developer, :body_publisher, :body_platform_id,
            TO_DATE(:body_release_date, 'YYYY-MM-DD'), :body_avg_playtime)
    RETURNING game_id INTO v_new_id;

    COMMIT;
    HTP.p('{"status":"ok","game_id":' || v_new_id || '}');
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        IF SQLCODE = -20050 THEN OWA_UTIL.status_line(403);
        ELSE OWA_UTIL.status_line(400);
        END IF;
        HTP.p('{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;
        ]'
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_TEMPLATE(p_module_name => 'api', p_pattern => 'games/:id');

    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'games/:id',
        p_method      => 'DELETE',
        p_source_type => 'plsql/block',
        p_source      => q'[
BEGIN
    set_app_user_context;

    DELETE FROM user_achievements WHERE achievement_id IN
        (SELECT achievement_id FROM achievements WHERE game_id = :id);
    DELETE FROM achievements        WHERE game_id = :id;
    DELETE FROM player_stats        WHERE game_id = :id;
    DELETE FROM sessions            WHERE game_id = :id;
    DELETE FROM reviews             WHERE game_id = :id;
    DELETE FROM leaderboard_entries WHERE leaderboard_id IN
        (SELECT leaderboard_id FROM leaderboards WHERE game_id = :id);
    DELETE FROM leaderboards        WHERE game_id = :id;
    DELETE FROM game_genre          WHERE game_id = :id;
    DELETE FROM games               WHERE game_id = :id;

    COMMIT;
    HTP.p('{"status":"ok"}');
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        IF SQLCODE = -20050 THEN OWA_UTIL.status_line(403);
        ELSE OWA_UTIL.status_line(400);
        END IF;
        HTP.p('{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;
        ]'
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_TEMPLATE(p_module_name => 'api', p_pattern => 'achievements');

    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'achievements',
        p_method      => 'GET',
        p_source_type => 'json/collection',
        p_source      => q'[
SELECT
    a.achievement_id,
    g.title         AS game,
    a.title,
    a.criteria_type,
    a.threshold_num,
    (SELECT COUNT(*) FROM user_achievements ua WHERE ua.achievement_id = a.achievement_id) AS unlock_count
  FROM achievements a
  JOIN games g ON a.game_id = g.game_id
 ORDER BY g.title, a.threshold_num
        ]'
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_TEMPLATE(p_module_name => 'api', p_pattern => 'sessions');

    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'sessions',
        p_method      => 'GET',
        p_source_type => 'json/collection',
        p_source      => q'[
SELECT *
  FROM (
    SELECT
        s.session_id,
        u.username,
        g.title AS game,
        TO_CHAR(s.started_at, 'YYYY-MM-DD HH24:MI') AS started_at,
        TO_CHAR(s.ended_at,   'YYYY-MM-DD HH24:MI') AS ended_at,
        ROUND((CAST(s.ended_at AS DATE) - CAST(s.started_at AS DATE)) * 24, 1) AS hours,
        s.platform_account AS platform_acc
      FROM sessions s
      JOIN users u ON s.user_id = u.user_id
      JOIN games g ON s.game_id = g.game_id
     ORDER BY s.started_at DESC
  )
 WHERE ROWNUM <= 100
        ]'
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_TEMPLATE(p_module_name => 'api', p_pattern => 'reviews');

    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'reviews',
        p_method      => 'GET',
        p_source_type => 'json/collection',
        p_source      => q'[
SELECT
    r.review_id,
    u.username,
    g.title AS game,
    r.rating,
    r.review_title,
    TO_CHAR(r.created_at, 'YYYY-MM-DD') AS created_at
  FROM reviews r
  JOIN users u ON r.user_id = u.user_id
  JOIN games g ON r.game_id = g.game_id
 ORDER BY r.created_at DESC
        ]'
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_TEMPLATE(p_module_name => 'api', p_pattern => 'platforms');

    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'platforms',
        p_method      => 'GET',
        p_source_type => 'json/collection',
        p_source      => q'[
SELECT platform_id, name FROM platforms ORDER BY name
        ]'
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_TEMPLATE(p_module_name => 'api', p_pattern => 'audit');

    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'audit',
        p_method      => 'GET',
        p_source_type => 'json/collection',
        p_source      => q'[
SELECT *
  FROM (
    SELECT log_id, table_name, action, user_name,
           TO_CHAR(action_date, 'YYYY-MM-DD HH24:MI:SS') AS action_date,
           details
      FROM audit_log
     ORDER BY action_date DESC
  )
 WHERE ROWNUM <= 100
        ]'
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_TEMPLATE(p_module_name => 'api', p_pattern => 'leaderboard/:game_id');

    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'leaderboard/:game_id',
        p_method      => 'GET',
        p_source_type => 'json/collection',
        p_source      => q'[
SELECT le.rank, u.username, le.score
  FROM leaderboard_entries le
  JOIN leaderboards lb ON le.leaderboard_id = lb.leaderboard_id
  JOIN users u ON le.user_id = u.user_id
 WHERE lb.game_id = :game_id
 ORDER BY le.rank
        ]'
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_TEMPLATE(p_module_name => 'api', p_pattern => 'roles');

    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'roles',
        p_method      => 'GET',
        p_source_type => 'json/collection',
        p_source      => q'[
SELECT u.user_id, u.username, NVL(ar.role_name, 'player') AS role
  FROM users u
  LEFT JOIN app_roles ar ON u.user_id = ar.user_id
 ORDER BY ar.role_name NULLS LAST, u.username
        ]'
    );
    COMMIT;
END;
/

SELECT module_name, uri_pattern, method, source_type
  FROM user_ords_handlers
 WHERE module_name = 'api'
 ORDER BY uri_pattern, method;

CREATE TABLE app_roles (
    role_id    NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id    NUMBER NOT NULL,
    role_name  VARCHAR2(20) DEFAULT 'player' NOT NULL
               CHECK (role_name IN ('admin','player')),
    CONSTRAINT fk_role_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT uq_role_user UNIQUE (user_id)
);
/

INSERT INTO app_roles (user_id, role_name)
SELECT user_id, 'player'
  FROM users
 WHERE user_id NOT IN (SELECT user_id FROM app_roles);
COMMIT;

CREATE OR REPLACE TRIGGER trg_assign_default_role
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO app_roles (user_id, role_name)
    VALUES (:NEW.user_id, 'player');
END;
/

CREATE OR REPLACE TRIGGER trg_admin_check_games
BEFORE INSERT OR UPDATE OR DELETE ON games
FOR EACH ROW
DECLARE
    v_role     VARCHAR2(20);
    v_app_user VARCHAR2(100);
BEGIN
    v_app_user := SYS_CONTEXT('USERENV', 'CLIENT_IDENTIFIER');

    IF v_app_user IS NULL THEN
        RETURN;
    END IF;

    BEGIN
        SELECT ar.role_name
          INTO v_role
          FROM app_roles ar
          JOIN users u ON ar.user_id = u.user_id
         WHERE u.username = v_app_user;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            v_role := 'player';
    END;

    IF v_role <> 'admin' THEN
        RAISE_APPLICATION_ERROR(-20050,
            'Admin role required for games table. Caller: '
            || v_app_user || ', role: ' || v_role);
    END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_admin_check_users
BEFORE INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW
DECLARE
    v_role     VARCHAR2(20);
    v_app_user VARCHAR2(100);
BEGIN
    v_app_user := SYS_CONTEXT('USERENV', 'CLIENT_IDENTIFIER');

    IF v_app_user IS NULL THEN
        RETURN;
    END IF;

    BEGIN
        SELECT ar.role_name
          INTO v_role
          FROM app_roles ar
          JOIN users u ON ar.user_id = u.user_id
         WHERE u.username = v_app_user;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            v_role := 'player';
    END;

    IF v_role <> 'admin' THEN
        RAISE_APPLICATION_ERROR(-20051,
            'Admin role required for users table. Caller: '
            || v_app_user || ', role: ' || v_role);
    END IF;
END;
/

UPDATE app_roles
   SET role_name = 'admin'
 WHERE user_id = (SELECT user_id FROM users WHERE username = 'dark_knight');
COMMIT;

SELECT u.user_id, u.username, ar.role_name
  FROM users u
  JOIN app_roles ar ON u.user_id = ar.user_id
 ORDER BY ar.role_name, u.username;

BEGIN
    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'login',
        p_method      => 'POST',
        p_source_type => 'plsql/block',
        p_source      => q'[
DECLARE
    v_body       CLOB := :body_text;
    v_in_user    VARCHAR2(100);
    v_in_pass    VARCHAR2(200);

    v_user_id    NUMBER;
    v_username   VARCHAR2(50);
    v_email      VARCHAR2(100);
    v_country    VARCHAR2(50);
    v_role       VARCHAR2(20);
BEGIN
    APEX_JSON.PARSE(v_body);
    v_in_user := APEX_JSON.GET_VARCHAR2('username');
    v_in_pass := APEX_JSON.GET_VARCHAR2('password');

    SELECT u.user_id, u.username, u.email, u.country,
           NVL(ar.role_name, 'player')
      INTO v_user_id, v_username, v_email, v_country, v_role
      FROM users u
      LEFT JOIN app_roles ar ON u.user_id = ar.user_id
     WHERE u.username = v_in_user
       AND u.password_hash = v_in_pass;

    HTP.p('{');
    HTP.p('"user_id":' || v_user_id || ',');
    HTP.p('"username":"' || v_username || '",');
    HTP.p('"email":"' || v_email || '",');
    HTP.p('"country":"' || v_country || '",');
    HTP.p('"role":"' || v_role || '"');
    HTP.p('}');
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        OWA_UTIL.status_line(401);
        HTP.p('{"error":"Invalid credentials","got_user":"' || v_in_user || '"}');
    WHEN OTHERS THEN
        OWA_UTIL.status_line(500);
        HTP.p('{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;
        ]'
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'register',
        p_method      => 'POST',
        p_source_type => 'plsql/block',
        p_source      => q'[
DECLARE
    v_body     CLOB := :body_text;
    v_username VARCHAR2(50);
    v_email    VARCHAR2(100);
    v_country  VARCHAR2(50);
    v_dob      VARCHAR2(20);
    v_pwd      VARCHAR2(200);
    v_new_id   NUMBER;
    v_count    NUMBER;
BEGIN
    APEX_JSON.PARSE(v_body);
    v_username := TRIM(APEX_JSON.GET_VARCHAR2('username'));
    v_email    := TRIM(APEX_JSON.GET_VARCHAR2('email'));
    v_country  := TRIM(APEX_JSON.GET_VARCHAR2('country'));
    v_dob      := TRIM(APEX_JSON.GET_VARCHAR2('dob'));
    v_pwd      := TRIM(APEX_JSON.GET_VARCHAR2('password'));

    IF v_username IS NULL OR LENGTH(v_username) < 3 THEN
        OWA_UTIL.status_line(400);
        HTP.p('{"error":"Username must be at least 3 characters"}');
        RETURN;
    END IF;
    IF v_pwd IS NULL OR LENGTH(v_pwd) < 4 THEN
        OWA_UTIL.status_line(400);
        HTP.p('{"error":"Password must be at least 4 characters"}');
        RETURN;
    END IF;
    IF v_email IS NULL THEN
        OWA_UTIL.status_line(400);
        HTP.p('{"error":"Email is required"}');
        RETURN;
    END IF;

    SELECT COUNT(*) INTO v_count FROM users WHERE username = v_username;
    IF v_count > 0 THEN
        OWA_UTIL.status_line(409);
        HTP.p('{"error":"Username already taken"}');
        RETURN;
    END IF;

    SELECT COUNT(*) INTO v_count FROM users WHERE email = v_email;
    IF v_count > 0 THEN
        OWA_UTIL.status_line(409);
        HTP.p('{"error":"Email already registered"}');
        RETURN;
    END IF;

    INSERT INTO users (username, email, country, dob, password_hash)
    VALUES (v_username, v_email, NVL(v_country, 'Unknown'),
            CASE WHEN v_dob IS NOT NULL THEN TO_DATE(v_dob, 'YYYY-MM-DD') ELSE NULL END,
            v_pwd)
    RETURNING user_id INTO v_new_id;

    COMMIT;

    -- New accounts are always 'player'. Don't re-query, just return.
    HTP.p('{');
    HTP.p('"user_id":' || v_new_id || ',');
    HTP.p('"username":"' || v_username || '",');
    HTP.p('"email":"' || v_email || '",');
    HTP.p('"country":"' || NVL(v_country, 'Unknown') || '",');
    HTP.p('"role":"player"');
    HTP.p('}');
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        OWA_UTIL.status_line(400);
        HTP.p('{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;
        ]
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_TEMPLATE(p_module_name => 'api', p_pattern => 'friends/:username');

    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'friends/:username',
        p_method      => 'GET',
        p_source_type => 'json/collection',
        p_source      => q'[
SELECT
    other.user_id,
    other.username,
    other.country,
    other.email,
    NVL(ar.role_name, 'player') AS role,
    NVL((SELECT SUM(ps.score) FROM player_stats ps WHERE ps.user_id = other.user_id), 0) AS total_score,
    NVL((SELECT SUM(ps.kills) FROM player_stats ps WHERE ps.user_id = other.user_id), 0) AS total_kills,
    (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = other.user_id) AS achievements,
    TO_CHAR(f.accepted_at, 'YYYY-MM-DD') AS friends_since
  FROM friends f
  JOIN users me ON (me.user_id = f.user_id OR me.user_id = f.friend_id) AND me.username = :username
  JOIN users other ON other.user_id = CASE WHEN f.user_id = me.user_id THEN f.friend_id ELSE f.user_id END
  LEFT JOIN app_roles ar ON other.user_id = ar.user_id
 WHERE f.status = 'accepted'
 ORDER BY total_score DESC
        ]'
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_TEMPLATE(p_module_name => 'api', p_pattern => 'friend-requests/:username');

    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'friend-requests/:username',
        p_method      => 'GET',
        p_source_type => 'json/collection',
        p_source      => q'[
SELECT
    requester.user_id,
    requester.username,
    requester.country,
    NVL((SELECT SUM(ps.score) FROM player_stats ps WHERE ps.user_id = requester.user_id), 0) AS total_score,
    TO_CHAR(f.requested_at, 'YYYY-MM-DD HH24:MI') AS requested_at
  FROM friends f
  JOIN users me ON me.user_id = f.friend_id AND me.username = :username
  JOIN users requester ON requester.user_id = f.user_id
 WHERE f.status = 'pending'
 ORDER BY f.requested_at DESC
        ]'
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_TEMPLATE(p_module_name => 'api', p_pattern => 'friend-sent/:username');

    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'friend-sent/:username',
        p_method      => 'GET',
        p_source_type => 'json/collection',
        p_source      => q'[
SELECT
    recipient.user_id,
    recipient.username,
    recipient.country,
    TO_CHAR(f.requested_at, 'YYYY-MM-DD HH24:MI') AS requested_at
  FROM friends f
  JOIN users me ON me.user_id = f.user_id AND me.username = :username
  JOIN users recipient ON recipient.user_id = f.friend_id
 WHERE f.status = 'pending'
 ORDER BY f.requested_at DESC
        ]'
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_TEMPLATE(p_module_name => 'api', p_pattern => 'friend-request');

    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'friend-request',
        p_method      => 'POST',
        p_source_type => 'plsql/block',
        p_source      => q'[
DECLARE
    v_body         CLOB := :body_text;
    v_from_user    VARCHAR2(50);
    v_to_user_id   NUMBER;
    v_from_user_id NUMBER;
    v_count        NUMBER;
BEGIN
    APEX_JSON.PARSE(v_body);
    v_from_user  := TRIM(APEX_JSON.GET_VARCHAR2('from_username'));
    v_to_user_id := APEX_JSON.GET_NUMBER('to_user_id');

    IF v_from_user IS NULL OR v_to_user_id IS NULL THEN
        OWA_UTIL.status_line(400);
        HTP.p('{"error":"from_username and to_user_id are required"}');
        RETURN;
    END IF;

    SELECT user_id INTO v_from_user_id FROM users WHERE username = v_from_user;

    IF v_from_user_id = v_to_user_id THEN
        OWA_UTIL.status_line(400);
        HTP.p('{"error":"You cannot send a request to yourself"}');
        RETURN;
    END IF;

    -- Block duplicates / reverse requests (no matter who sent first)
    SELECT COUNT(*) INTO v_count
      FROM friends
     WHERE (user_id = v_from_user_id AND friend_id = v_to_user_id)
        OR (user_id = v_to_user_id AND friend_id = v_from_user_id);

    IF v_count > 0 THEN
        OWA_UTIL.status_line(409);
        HTP.p('{"error":"A friendship or request already exists"}');
        RETURN;
    END IF;

    INSERT INTO friends (user_id, friend_id, status, requested_at)
    VALUES (v_from_user_id, v_to_user_id, 'pending', SYSTIMESTAMP);
    COMMIT;

    HTP.p('{"status":"ok","message":"Friend request sent"}');
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        OWA_UTIL.status_line(404);
        HTP.p('{"error":"User not found"}');
    WHEN OTHERS THEN
        ROLLBACK;
        OWA_UTIL.status_line(400);
        HTP.p('{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;
        ]'
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_TEMPLATE(p_module_name => 'api', p_pattern => 'friend-respond');

    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'friend-respond',
        p_method      => 'POST',
        p_source_type => 'plsql/block',
        p_source      => q'[
DECLARE
    v_body         CLOB := :body_text;
    v_username     VARCHAR2(50);
    v_from_user_id NUMBER;
    v_action       VARCHAR2(20);
    v_my_user_id   NUMBER;
    v_count        NUMBER;
BEGIN
    APEX_JSON.PARSE(v_body);
    v_username     := TRIM(APEX_JSON.GET_VARCHAR2('username'));
    v_from_user_id := APEX_JSON.GET_NUMBER('from_user_id');
    v_action       := LOWER(TRIM(APEX_JSON.GET_VARCHAR2('action')));

    IF v_action NOT IN ('accept','reject') THEN
        OWA_UTIL.status_line(400);
        HTP.p('{"error":"action must be accept or reject"}');
        RETURN;
    END IF;

    SELECT user_id INTO v_my_user_id FROM users WHERE username = v_username;

    SELECT COUNT(*) INTO v_count
      FROM friends
     WHERE user_id = v_from_user_id
       AND friend_id = v_my_user_id
       AND status = 'pending';

    IF v_count = 0 THEN
        OWA_UTIL.status_line(404);
        HTP.p('{"error":"No pending request found"}');
        RETURN;
    END IF;

    IF v_action = 'accept' THEN
        UPDATE friends
           SET status = 'accepted', accepted_at = SYSTIMESTAMP
         WHERE user_id = v_from_user_id AND friend_id = v_my_user_id;
        COMMIT;
        HTP.p('{"status":"ok","message":"Friend request accepted"}');
    ELSE
        DELETE FROM friends
         WHERE user_id = v_from_user_id AND friend_id = v_my_user_id;
        COMMIT;
        HTP.p('{"status":"ok","message":"Friend request rejected"}');
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        OWA_UTIL.status_line(404);
        HTP.p('{"error":"User not found"}');
    WHEN OTHERS THEN
        ROLLBACK;
        OWA_UTIL.status_line(400);
        HTP.p('{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;
        ]'
    );
    COMMIT;
END;
/

BEGIN
    ORDS.DEFINE_TEMPLATE(p_module_name => 'api', p_pattern => 'friend');

    ORDS.DEFINE_HANDLER(
        p_module_name => 'api',
        p_pattern     => 'friend',
        p_method      => 'DELETE',
        p_source_type => 'plsql/block',
        p_source      => q'[
DECLARE
    v_body          CLOB := :body_text;
    v_username      VARCHAR2(50);
    v_friend_id     NUMBER;
    v_my_user_id    NUMBER;
    v_rows          NUMBER;
BEGIN
    APEX_JSON.PARSE(v_body);
    v_username  := TRIM(APEX_JSON.GET_VARCHAR2('username'));
    v_friend_id := APEX_JSON.GET_NUMBER('friend_user_id');

    SELECT user_id INTO v_my_user_id FROM users WHERE username = v_username;

    DELETE FROM friends
     WHERE (user_id = v_my_user_id AND friend_id = v_friend_id)
        OR (user_id = v_friend_id AND friend_id = v_my_user_id);

    v_rows := SQL%ROWCOUNT;
    COMMIT;

    IF v_rows = 0 THEN
        OWA_UTIL.status_line(404);
        HTP.p('{"error":"No friendship found"}');
    ELSE
        HTP.p('{"status":"ok"}');
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        OWA_UTIL.status_line(404);
        HTP.p('{"error":"User not found"}');
    WHEN OTHERS THEN
        ROLLBACK;
        OWA_UTIL.status_line(400);
        HTP.p('{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;
        ]'
    );
    COMMIT;
END;
/