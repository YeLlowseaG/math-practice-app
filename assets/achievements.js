/**
 * Unified Achievements Registry + Local Storage API (T0)
 * - Static registry (no backend required)
 * - Storage: localStorage.achievementsV1 = { earned: {id:true}, ts:{id:number}, progress:{}}
 * - API: window.achievements.unlockAchievement(id), isEarned(id), getAll()
 */
(function () {
  var STORAGE_KEY = 'achievementsV1';

  var registry = [
    // Global achievements (examples – mirror learning-progress conditions)
    { id: 'global_first_game', name: '初次体验', icon: '🎮', scope: 'global', desc: '完成第一个学习游戏' },
    { id: 'global_streak_3', name: '坚持不懈', icon: '🔥', scope: 'global', desc: '连续学习3天' },
    { id: 'global_streak_7', name: '周战士', icon: '🏆', scope: 'global', desc: '连续学习7天' },
    { id: 'global_super_learner', name: '学习超人', icon: '🚀', scope: 'global', desc: '三大类都有进展' },

    // Letter Recognition (lr)
    { id: 'lr_first_correct', name: '首题正确', icon: '🎯', scope: 'game:letters', desc: '首题答对' },
    { id: 'lr_combo_5', name: '连击达人', icon: '🔥', scope: 'game:letters', desc: '连续答对5题' },
    { id: 'lr_speed', name: '极速答题', icon: '⚡', scope: 'game:letters', desc: '限时内完成' },
    { id: 'lr_level_reach', name: '闯关能手', icon: '🏆', scope: 'game:letters', desc: '到达指定关卡' },
    { id: 'lr_perfect', name: '完美回合', icon: '💎', scope: 'game:letters', desc: '一回合全对' },

    // Antonyms Solo (ant_solo)
    { id: 'ant_first_correct', name: '初试身手', icon: '🎯', scope: 'game:antonyms_solo', desc: '答对第一题' },
    { id: 'ant_combo_5', name: '连击达人', icon: '🔥', scope: 'game:antonyms_solo', desc: '连续答对5题' },
    { id: 'ant_level_5', name: '闯关高手', icon: '🏆', scope: 'game:antonyms_solo', desc: '到达第5关' },
    { id: 'ant_speed', name: '闪电侠', icon: '⚡', scope: 'game:antonyms_solo', desc: '3秒内答对' },
    { id: 'ant_perfect', name: '完美关卡', icon: '💎', scope: 'game:antonyms_solo', desc: '一关内全部答对' }
    ,
    // Word Memory
    { id: 'wm_first_clear', name: '首次记忆完成', icon: '📘', scope: 'game:word_memory', desc: '完成一次记忆配对' },
    // Word Connect
    { id: 'wc_first_clear', name: '首次连线完成', icon: '🧩', scope: 'game:word_connect', desc: '完成一次连线关卡' },
    // Poem Puzzle Solo
    { id: 'pp_first_clear', name: '诗词初体验', icon: '📜', scope: 'game:poem_puzzle', desc: '完成一次诗词拼图' },
    // Antonyms VS
    { id: 'antv_first_match', name: '对战初胜', icon: '⚔️', scope: 'game:antonyms_vs', desc: '完成一场对战' },
    // Alphabet Game
    { id: 'ab_first_points', name: '首获积分', icon: '🔤', scope: 'game:alphabet', desc: '在字母认知中获得积分' },
    // English Chain
    { id: 'ec_first_game', name: '接龙初体验', icon: '🔗', scope: 'game:english_chain', desc: '完成一次英语接龙' },
    // Letter Jump
    { id: 'lj_first_complete', name: '青蛙到岸', icon: '🐸', scope: 'game:letter_jump', desc: '完成一次跳跳乐' },
    // Word Bubbles
    { id: 'wb_first_round', name: '泡泡初体验', icon: '🫧', scope: 'game:word_bubbles', desc: '完成一轮泡泡' },
    // Pinyin Game
    { id: 'py_first_finish', name: '拼音初体验', icon: '🗣️', scope: 'game:pinyin', desc: '完成一次拼音练习' },
    // Math Practice
    { id: 'math_first_finish', name: '数学初上手', icon: '➕', scope: 'game:math', desc: '完成一次数学练习' }
  ];

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (_) { return {}; }
  }

  function save(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  function ensure() {
    var st = load();
    if (!st.earned) st.earned = {};
    if (!st.ts) st.ts = {};
    if (!st.progress) st.progress = {};
    return st;
  }

  function unlockAchievement(id) {
    var st = ensure();
    if (st.earned[id]) return false;
    st.earned[id] = true;
    st.ts[id] = Date.now();
    save(st);
    try { document.dispatchEvent(new CustomEvent('achievement-unlocked', { detail: { id: id } })); } catch (_) {}
    return true;
  }

  function isEarned(id) {
    var st = load();
    return !!(st.earned && st.earned[id]);
  }

  function getAll() {
    var st = load();
    return registry.map(function (r) {
      return Object.assign({}, r, { earned: !!(st.earned && st.earned[r.id]), unlockedAt: st.ts ? st.ts[r.id] : undefined });
    });
  }

  function getByScope(scope) {
    return getAll().filter(function (r) { return r.scope === scope; });
  }

  window.achievements = {
    registry: registry,
    unlockAchievement: unlockAchievement,
    isEarned: isEarned,
    getAll: getAll,
    getByScope: getByScope
  };
})();

