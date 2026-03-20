// ── i18n.js ───────────────────────────────────────────
// Translations: PL (default) and EN

const LANGS = {
  pl: {
    // HUD
    hud_score:   'WYNIK',
    hud_gems:    'KLEJNOTY',
    hud_time:    'CZAS',
    hud_lives:   'ŻYCIA',
    hud_level:   'POZIOM',
    // Title screen
    hint1:       '▣ ZBIERAJ DIAMENTY',
    hint2:       '▣ UNIKAJ SKAŁ',
    hint3:       '▣ OTWÓRZ WYJŚCIE',
    btn_continue:'⟳ KONTYNUUJ',
    btn_new:     '▶ NOWA GRA',
    btn_scores:  '🏆 WYNIKI',
    // Game over
    go_initials: 'WPISZ INICJAŁY:',
    btn_menu:    '▶ MENU',
    // Leaderboard
    btn_back:    '◀ WSTECZ',
    no_scores:   'BRAK WYNIKÓW',
    lbl_score:   'WYNIK',
    lbl_rank:    'MIEJSCE',
    lbl_record:  'REKORD!',
    // Loading
    loading_done:'POZIOM UKOŃCZONY!',
    loading_lvl: 'POZIOM',
    loading_gems:'DIAMENTY',
    loading_time:'CZAS',
    // Splash
    splash_tap:  'DOTKNIJ ABY KONTYNUOWAĆ',
  },
  en: {
    hud_score:   'SCORE',
    hud_gems:    'GEMS',
    hud_time:    'TIME',
    hud_lives:   'LIVES',
    hud_level:   'LEVEL',
    hint1:       '▣ COLLECT DIAMONDS',
    hint2:       '▣ AVOID BOULDERS',
    hint3:       '▣ OPEN THE EXIT',
    btn_continue:'⟳ CONTINUE',
    btn_new:     '▶ NEW GAME',
    btn_scores:  '🏆 SCORES',
    go_initials: 'ENTER INITIALS:',
    btn_menu:    '▶ MENU',
    btn_back:    '◀ BACK',
    no_scores:   'NO SCORES YET',
    lbl_score:   'SCORE',
    lbl_rank:    'RANK',
    lbl_record:  'RECORD!',
    loading_done:'LEVEL COMPLETE!',
    loading_lvl: 'LEVEL',
    loading_gems:'DIAMONDS',
    loading_time:'TIME',
    splash_tap:  'TAP TO CONTINUE',
  }
};

// Detect language from browser
let lang = (navigator.language || 'pl').slice(0,2).toLowerCase();
if (!LANGS[lang]) lang = 'en';

function t(key) {
  return (LANGS[lang] && LANGS[lang][key]) || (LANGS['en'][key]) || key;
}

function setLang(l) {
  lang = LANGS[l] ? l : 'en';
  applyLang();
}

function applyLang() {
  // HUD labels
  const hudMap = {
    'hl-score': 'hud_score', 'hl-gems': 'hud_gems',
    'hl-time':  'hud_time',  'hl-lives': 'hud_lives',
    'hl-level': 'hud_level',
  };
  for (const [id, key] of Object.entries(hudMap)) {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  }
  // Buttons and static text
  const elMap = {
    'btn-continue':  'btn_continue',
    'btn-start':     'btn_new',
    'btn-scores':    'btn_scores',
    'btn-gomenu':    'btn_menu',
    'btn-lbback':    'btn_back',
    'splash-press':  'splash_tap',
    'hint-1':        'hint1',
    'hint-2':        'hint2',
    'hint-3':        'hint3',
    'go-initials':   'go_initials',
    'loading-title': 'loading_done',
  };
  for (const [id, key] of Object.entries(elMap)) {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  }
}
