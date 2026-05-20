export const THEME = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --navy:   #05112A;
    --navy2:  #0A1F44;
    --card:   #0D1E3D;
    --card2:  #0F2347;
    --blue:   #1B6FEB;
    --blue2:  #3D8EFF;
    --cyan:   #00D4FF;
    --white:  #F5F8FF;
    --muted:  #8A9CC0;
    --border: rgba(59,130,246,0.15);
    --red:    #FF4D6A;
    --green:  #00D48A;
    --yellow: #FFB800;
  }
  body { font-family: 'DM Sans', sans-serif; background: var(--navy); color: var(--white); }
  .sora { font-family: 'Sora', sans-serif; }
  input, select, textarea, button { font-family: 'DM Sans', sans-serif; }

  /* ── AUTH ── */
  .auth-wrap {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--navy);
    background-image: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(27,111,235,0.2) 0%, transparent 70%);
    padding: 24px;
  }
  .auth-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 20px; padding: 48px; width: 100%; max-width: 440px;
    box-shadow: 0 32px 80px rgba(0,0,0,0.4);
  }
  .auth-logo {
    font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 800;
    background: linear-gradient(135deg, #fff, var(--cyan));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    margin-bottom: 8px;
  }
  .auth-title { font-family: 'Sora', sans-serif; font-size: 26px; font-weight: 700; margin-bottom: 6px; }
  .auth-sub { font-size: 14px; color: var(--muted); margin-bottom: 32px; }
  .form-group { margin-bottom: 18px; }
  .form-label { display: block; font-size: 13px; font-weight: 600; color: var(--muted); margin-bottom: 8px; letter-spacing: 0.3px; }
  .form-input {
    width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--border);
    border-radius: 10px; padding: 12px 16px; font-size: 15px; color: var(--white);
    outline: none; transition: border-color 0.2s;
  }
  .form-input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(27,111,235,0.15); }
  .form-input::placeholder { color: rgba(138,156,192,0.5); }
  .form-select {
    width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--border);
    border-radius: 10px; padding: 12px 16px; font-size: 15px; color: var(--white);
    outline: none; transition: border-color 0.2s; cursor: pointer;
    appearance: none;
  }
  .form-select:focus { border-color: var(--blue); }
  .form-select option { background: var(--navy2); }
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px 24px; border-radius: 10px; font-size: 15px; font-weight: 600;
    border: none; cursor: pointer; transition: all 0.2s; text-decoration: none;
    font-family: 'DM Sans', sans-serif;
  }
  .btn-full { width: 100%; }
  .btn-blue {
    background: linear-gradient(135deg, var(--blue), #0F52C7);
    color: #fff; box-shadow: 0 6px 20px rgba(27,111,235,0.35);
  }
  .btn-blue:hover { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(27,111,235,0.5); }
  .btn-ghost {
    background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: var(--white);
  }
  .btn-ghost:hover { background: rgba(255,255,255,0.1); }
  .btn-danger { background: rgba(255,77,106,0.15); border: 1px solid rgba(255,77,106,0.3); color: var(--red); }
  .btn-danger:hover { background: rgba(255,77,106,0.25); }
  .btn-sm { padding: 7px 14px; font-size: 13px; border-radius: 8px; }
  .auth-link { font-size: 14px; color: var(--muted); text-align: center; margin-top: 24px; }
  .auth-link a { color: var(--blue2); text-decoration: none; font-weight: 500; }
  .err { background: rgba(255,77,106,0.1); border: 1px solid rgba(255,77,106,0.3); border-radius: 10px; padding: 12px 16px; font-size: 14px; color: var(--red); margin-bottom: 18px; }

  /* ── DASHBOARD LAYOUT ── */
  .dash-wrap { display: flex; min-height: 100vh; }
  .sidebar {
    width: 240px; background: var(--navy2); border-right: 1px solid var(--border);
    display: flex; flex-direction: column; position: fixed; top: 0; bottom: 0; left: 0; z-index: 50;
    padding: 24px 0;
  }
  .sidebar-logo {
    font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 800;
    background: linear-gradient(135deg, #fff, var(--cyan));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    padding: 0 24px; margin-bottom: 32px;
  }
  .sidebar-logo span { -webkit-text-fill-color: var(--blue2); }
  .sidebar-section { font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(138,156,192,0.5); padding: 0 24px; margin-bottom: 8px; margin-top: 16px; }
  .sidebar-link {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 24px; font-size: 14px; font-weight: 500; color: var(--muted);
    text-decoration: none; transition: all 0.15s; border-left: 2px solid transparent;
    cursor: pointer;
  }
  .sidebar-link:hover { color: var(--white); background: rgba(27,111,235,0.08); }
  .sidebar-link.active { color: var(--white); background: rgba(27,111,235,0.12); border-left-color: var(--blue); }
  .sidebar-link .icon { font-size: 16px; width: 20px; text-align: center; }
  .sidebar-bottom { margin-top: auto; padding: 16px 24px; border-top: 1px solid var(--border); }
  .user-chip { display: flex; align-items: center; gap: 10px; }
  .user-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: linear-gradient(135deg, var(--blue), var(--cyan));
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; color: #fff;
  }
  .user-name { font-size: 13px; font-weight: 600; color: var(--white); }
  .user-role { font-size: 11px; color: var(--muted); }

  .dash-main { margin-left: 240px; flex: 1; display: flex; flex-direction: column; min-height: 100vh; }
  .dash-header {
    padding: 20px 32px; border-bottom: 1px solid var(--border);
    background: rgba(5,17,42,0.8); backdrop-filter: blur(12px);
    position: sticky; top: 0; z-index: 40;
    display: flex; align-items: center; justify-content: space-between;
  }
  .dash-header-title { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 700; }
  .dash-header-sub { font-size: 13px; color: var(--muted); margin-top: 2px; }
  .dash-content { padding: 32px; flex: 1; }

  /* ── CARDS & GRIDS ── */
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 32px; }
  .stat-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 16px; padding: 24px; transition: all 0.2s;
  }
  .stat-card:hover { border-color: rgba(27,111,235,0.3); transform: translateY(-2px); }
  .stat-card-label { font-size: 13px; color: var(--muted); font-weight: 500; margin-bottom: 10px; }
  .stat-card-val { font-family: 'Sora', sans-serif; font-size: 30px; font-weight: 800; line-height: 1; }
  .stat-card-sub { font-size: 12px; color: var(--muted); margin-top: 6px; }
  .stat-card-icon { font-size: 24px; margin-bottom: 12px; }

  .data-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
  .data-card-header {
    padding: 20px 24px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .data-card-title { font-family: 'Sora', sans-serif; font-size: 16px; font-weight: 700; }

  /* ── TABLE ── */
  .tbl { width: 100%; border-collapse: collapse; }
  .tbl th {
    padding: 12px 16px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px;
    text-transform: uppercase; color: var(--muted); text-align: left;
    border-bottom: 1px solid var(--border); white-space: nowrap;
  }
  .tbl td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid rgba(59,130,246,0.07); }
  .tbl tr:last-child td { border-bottom: none; }
  .tbl tr:hover td { background: rgba(27,111,235,0.04); }
  .tbl-link { color: var(--blue2); text-decoration: none; font-weight: 500; }
  .tbl-link:hover { text-decoration: underline; }

  /* ── BADGE ── */
  .badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 100px; font-size: 12px; font-weight: 600; }
  .badge-blue   { background: rgba(27,111,235,0.15);  color: var(--blue2); }
  .badge-green  { background: rgba(0,212,138,0.15);   color: var(--green); }
  .badge-red    { background: rgba(255,77,106,0.15);  color: var(--red);   }
  .badge-yellow { background: rgba(255,184,0,0.15);   color: var(--yellow);}
  .badge-gray   { background: rgba(138,156,192,0.15); color: var(--muted); }

  /* ── MODAL / FORM PANEL ── */
  .panel {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 20px; padding: 32px; max-width: 640px; width: 100%;
  }
  .panel-title { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 24px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-divider { border: none; border-top: 1px solid var(--border); margin: 24px 0; }
  .form-section { font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--cyan); margin-bottom: 16px; }
  .form-actions { display: flex; gap: 12px; margin-top: 28px; justify-content: flex-end; }

  /* ── SEARCH BAR ── */
  .search-bar {
    display: flex; align-items: center; gap: 12px;
    background: rgba(255,255,255,0.04); border: 1px solid var(--border);
    border-radius: 10px; padding: 0 14px; flex: 1; max-width: 320px;
  }
  .search-bar input { flex: 1; background: none; border: none; outline: none; font-size: 14px; color: var(--white); padding: 10px 0; }
  .search-bar input::placeholder { color: var(--muted); }

  /* ── EMPTY STATE ── */
  .empty { text-align: center; padding: 64px 24px; color: var(--muted); }
  .empty-icon { font-size: 48px; margin-bottom: 16px; }
  .empty-title { font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 700; color: var(--white); margin-bottom: 8px; }
  .empty-sub { font-size: 14px; margin-bottom: 24px; }

  /* ── DETAIL PAGE ── */
  .detail-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
  .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border); }
  .detail-row:last-child { border-bottom: none; }
  .detail-key { font-size: 13px; color: var(--muted); font-weight: 500; }
  .detail-val { font-size: 14px; font-weight: 500; }

  @media (max-width: 900px) {
    .sidebar { display: none; }
    .dash-main { margin-left: 0; }
    .stat-grid { grid-template-columns: 1fr 1fr; }
    .detail-grid { grid-template-columns: 1fr; }
    .form-row { grid-template-columns: 1fr; }
  }
  @media (max-width: 600px) {
    .stat-grid { grid-template-columns: 1fr; }
    .dash-content { padding: 16px; }
  }
`;
