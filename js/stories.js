/* =========================================================
   stories.js — 三個完整故事資料（各六個事件）
   老師可以直接修改這個檔案的文字來調整故事內容。
   ---------------------------------------------------------
   情緒 (EMOTIONS)：lv = 遊戲中模擬的激發程度 0–100，
   tone = 感受方向（pos 愉快 / neg 不舒服 / neu 中性）。
   「情緒」與「激發程度」分開處理：興奮與焦慮都是高激發，但感受不同。
   這些數值只用於遊戲模擬，不代表玩家真實的心理狀態。
   ========================================================= */
window.OK = window.OK || {};

OK.EMOTIONS = {
  期待: { lv: 72, tone: 'pos', ico: '', expr: 'excited' },
  興奮: { lv: 86, tone: 'pos', ico: '', expr: 'excited' },
  開心: { lv: 64, tone: 'pos', ico: '', expr: 'happy' },
  平靜: { lv: 46, tone: 'neu', ico: '', expr: 'calm' },
  安心: { lv: 40, tone: 'pos', ico: '', expr: 'relieved' },
  好奇: { lv: 64, tone: 'pos', ico: '', expr: 'happy' },
  有信心: { lv: 58, tone: 'pos', ico: '', expr: 'determined' },
  專心: { lv: 56, tone: 'neu', ico: '', expr: 'determined' },
  驕傲: { lv: 70, tone: 'pos', ico: '', expr: 'happy' },
  感謝: { lv: 50, tone: 'pos', ico: '', expr: 'relieved' },
  還好: { lv: 50, tone: 'neu', ico: '', expr: 'calm' },
  緊張: { lv: 78, tone: 'neg', ico: '', expr: 'nervous' },
  焦慮: { lv: 84, tone: 'neg', ico: '', expr: 'nervous' },
  擔心: { lv: 74, tone: 'neg', ico: '', expr: 'worried' },
  害怕: { lv: 88, tone: 'neg', ico: '', expr: 'nervous' },
  慌張: { lv: 90, tone: 'neg', ico: '', expr: 'surprised' },
  生氣: { lv: 86, tone: 'neg', ico: '', expr: 'angry' },
  煩躁: { lv: 78, tone: 'neg', ico: '', expr: 'angry' },
  委屈: { lv: 62, tone: 'neg', ico: '', expr: 'sad' },
  困惑: { lv: 62, tone: 'neg', ico: '', expr: 'worried' },
  挫折: { lv: 68, tone: 'neg', ico: '', expr: 'worried' },
  尷尬: { lv: 74, tone: 'neg', ico: '', expr: 'nervous' },
  驚訝: { lv: 76, tone: 'neu', ico: '', expr: 'surprised' },
  有壓力: { lv: 80, tone: 'neg', ico: '', expr: 'nervous' },
  難過: { lv: 32, tone: 'neg', ico: '', expr: 'sad' },
  自責: { lv: 34, tone: 'neg', ico: '', expr: 'sad' },
  想哭: { lv: 40, tone: 'neg', ico: '', expr: 'sad' },
  失落: { lv: 26, tone: 'neg', ico: '', expr: 'sad' },
  累: { lv: 22, tone: 'neu', ico: '', expr: 'tired' },
  想放棄: { lv: 18, tone: 'neg', ico: '', expr: 'tired' },
  想躲起來: { lv: 20, tone: 'neg', ico: '', expr: 'sad' },
  沒什麼感覺: { lv: 24, tone: 'neu', ico: '', expr: 'tired' }
};

/* 身體訊號：d = 對模擬激發程度的影響 */
OK.SIGNALS = {
  heart: { label: '心跳變快', d: 5, ico: '' },
  breath: { label: '呼吸變快', d: 5, ico: '' },
  sweat: { label: '手心冒汗', d: 4, ico: '' },
  tense: { label: '肩膀緊繃', d: 4, ico: '' },
  hot: { label: '臉發熱', d: 4, ico: '' },
  fidget: { label: '坐不住想動', d: 5, ico: '' },
  tummy: { label: '肚子怪怪的', d: 3, ico: '' },
  blank: { label: '腦袋一片空白', d: 3, ico: '' },
  shake: { label: '腳在發抖', d: 4, ico: '' },
  fist: { label: '握緊拳頭', d: 5, ico: '' },
  throat: { label: '喉嚨緊緊的', d: 2, ico: '' },
  energy: { label: '全身充滿力氣', d: 4, ico: '' },
  bright: { label: '眼睛亮亮的', d: 2, ico: '' },
  stillFast: { label: '心跳還有點快', d: 3, ico: '' },
  tears: { label: '眼睛酸酸想哭', d: -3, ico: '' },
  hide: { label: '想躲起來', d: -5, ico: '' },
  weak: { label: '全身沒力', d: -6, ico: '' },
  yawn: { label: '打哈欠沒精神', d: -6, ico: '' },
  sore: { label: '肩膀痠痠的', d: -2, ico: '' },
  legSore: { label: '腳很痠', d: -2, ico: '' },
  relax: { label: '身體放鬆', d: -4, ico: '' },
  slowRelax: { label: '身體慢慢放鬆', d: -4, ico: '' },
  warm: { label: '心裡暖暖的', d: -1, ico: '' },
  none: { label: '沒有特別感覺', d: 0, ico: '' }
};

/* 四種調節技能 */
OK.SKILLS = {
  breath: { name: '呼吸光圈', icon: 'assets/svg/skill-breath.svg', desc: '跟著光圈慢慢吸氣、吐氣，讓身體的速度慢下來。' },
  harbor: { name: '安全港停靠', icon: 'assets/svg/skill-harbor.svg', desc: '把衝浪板慢慢停進安全港，觀察身體，選一個短暫休息的方法。' },
  island: { name: '支持浮島', icon: 'assets/svg/skill-island.svg', desc: '找一位適合的支持者，練習說出清楚又尊重的求助句子。' },
  puzzle: { name: '想法拼圖', icon: 'assets/svg/skill-puzzle.svg', desc: '把太重、太絕對的想法，拼成比較平衡的說法。' }
};

/* 支持人物 */
OK.HELPERS = {
  teacher: { name: '林老師', who: 'teacher', call: '老師', tip: '在學校裡隨時可以找的大人' },
  an: { name: '好朋友小安', who: 'an', call: '小安', tip: '願意聽你說話的朋友' },
  mom: { name: '家人', who: 'mom', call: '媽媽', tip: '放學回家可以聊聊' },
  counselor: { name: '輔導老師', who: 'counselor', call: '輔導老師', tip: '很會陪伴心情的老師' },
  staff: { name: '館員姊姊', who: 'staff', call: '館員姊姊', tip: '穿制服、掛識別證的工作人員' }
};

OK.STORIES = {
  /* ======================================================
     故事一：運動會的一天
     ====================================================== */
  sports: {
    id: 'sports', title: '運動會的一天', short: '運動會', boardColor: '#ffb938',
    bgTheme: 'sports',
    intro: '今天是一年一度的運動會！你是班上接力賽的選手。',
    events: [
      {
        title: '早上到校', time: '07:40', scene: 'gate',
        cast: [{ who: 'me', expr: 'happy', x: .3 }, { who: 'an', expr: 'excited', x: .55, pose: 'wave' }, { who: 'teacher', expr: 'happy', x: .8 }],
        lines: [
          { who: 'narr', text: '今天是運動會！操場上掛滿了萬國旗，廣播正在放輕快的音樂。' },
          { who: 'an', text: '早安！你今天要跑接力對不對？我好期待喔！' },
          { who: 'teacher', text: '各位同學早安！九點半是我們班的接力賽，大家先去暖身喔。' }
        ],
        emotionPrompt: '走進校門的這一刻，你的心情比較像哪一種？',
        emotions: ['期待', '興奮', '緊張', '平靜'], extra: ['擔心', '開心', '累', '沒什麼感覺'],
        signals: ['heart', 'fidget', 'tummy', 'hot', 'relax', 'yawn', 'none'],
        actionPrompt: '開始暖身前，你想做什麼？',
        actions: [
          { text: '跟小安一起去暖身，邊走邊聊天', reply: [{ who: 'an', text: '好啊！我們來比賽誰的拉筋拉比較久！' }] },
          { text: '先到旁邊喝口水，讓自己準備好', reply: [{ who: 'narr', text: '你喝了幾口水，看著操場上的人慢慢變多，心裡比較有底了。' }], da: -4 },
          { text: '跟小安說：「我其實有點緊張耶。」', reply: [{ who: 'an', text: '我也會耶！說出來好像就沒那麼可怕了，對吧？' }], da: -5 }
        ]
      },
      {
        title: '接力賽即將開始', time: '09:20', scene: 'track',
        cast: [{ who: 'me', expr: 'nervous', x: .3 }, { who: 'zhe', expr: 'determined', x: .55 }, { who: 'teacher', expr: 'calm', x: .82 }],
        lines: [
          { who: 'teacher', text: '五年三班的接力選手，請到起跑線集合！' },
          { who: 'narr', text: '你站上跑道，隔壁班的加油聲越來越大，心臟咚咚咚地跳得好快。' },
          { who: 'zhe', text: '我們今天一定要拿第一名！' }
        ],
        emotionPrompt: '站在跑道上，你感覺到的是？',
        emotions: ['緊張', '興奮', '害怕', '有信心'], extra: ['擔心', '期待', '有壓力', '平靜'],
        signals: ['heart', 'breath', 'sweat', 'tense', 'shake', 'blank', 'relax'],
        skillHint: 'breath',
        skillIntro: '比賽前心跳加快很正常，那是身體在幫你準備衝刺！要不要先調整一下狀態？',
        actionPrompt: '比賽開始前，你想怎麼準備自己？',
        actions: [
          { text: '在原地輕輕跳一跳、甩甩手', reply: [{ who: 'narr', text: '你跳了幾下，手腳暖起來了，身體像準備好的彈簧。' }] },
          { text: '對自己說：「我練習過了，盡力就好。」', reply: [{ who: 'sprite', text: '說給自己聽的鼓勵，也是一種力量喔！' }], da: -4 },
          { text: '對阿哲說：「我們一起加油，不管結果怎樣都盡力！」', reply: [{ who: 'zhe', text: '嗯……好！盡力就好！' }] }
        ]
      },
      {
        title: '接力賽正式開始', time: '09:30', scene: 'track',
        cast: [{ who: 'me', expr: 'determined', x: .35, pose: 'run' }, { who: 'mei', expr: 'excited', x: .65, pose: 'cheer' }, { who: 'kai', expr: 'excited', x: .85, pose: 'cheer' }],
        lines: [
          { who: 'narr', text: '砰！起跑槍響了！第一棒衝了出去，全場都在大喊加油！' },
          { who: 'mei', text: '加油——五年三班！衝啊！' },
          { who: 'narr', text: '輪到你了！接下來是節奏衝浪：接力棒來到圓圈的時候，按空白鍵或點一下畫面。跟不上也沒關係！' }
        ],
        challenge: { type: 'rhythm', title: '接力節奏衝浪', count: 10, words: ['加油！', '衝啊！', '五年三班！', '好快！', '跑跑跑！'] },
        emotionPrompt: '跑步時聽見大家的加油聲，你的感覺是？',
        emotions: ['興奮', '緊張', '開心', '有壓力'], extra: ['驕傲', '害怕', '平靜', '累'],
        signals: ['heart', 'breath', 'hot', 'energy', 'legSore', 'relax'],
        actionPrompt: '前面就是交棒區了！你在心裡提醒自己什麼？',
        actions: [
          { text: '專心看著前方的交棒區', reply: [{ who: 'narr', text: '你盯著交棒區，下一棒的同學已經伸出手了。' }] },
          { text: '聽著加油聲，讓自己衝更快', reply: [{ who: 'narr', text: '加油聲像海浪一樣推著你往前！' }], da: 4 },
          { text: '提醒自己：「手伸出去，穩穩交棒。」', reply: [{ who: 'narr', text: '你深吸一口氣，把接力棒握得更穩。' }], da: -3 }
        ]
      },
      {
        title: '接棒失誤', time: '09:32', scene: 'track',
        cast: [{ who: 'me', expr: 'surprised', x: .35 }, { who: 'zhe', expr: 'angry', x: .65 }],
        props: ['baton'],
        lines: [
          { who: 'narr', text: '就在交棒的那一刻，接力棒從手中滑了出去，「匡啷」一聲掉在跑道上……' },
          { who: 'narr', text: '你趕快撿起來再交出去，但隔壁班已經超前了。' },
          { who: 'zhe', text: '啊——怎麼會掉啦！' }
        ],
        emotionPrompt: '棒子掉下去的那一刻，你的心情是？',
        emotions: ['難過', '生氣', '委屈', '自責'], extra: ['尷尬', '慌張', '想躲起來', '失落'],
        signals: ['hot', 'heart', 'tears', 'throat', 'hide', 'weak', 'fist'],
        skillHint: 'puzzle',
        skillIntro: '這時候，腦中可能冒出一個很重的想法。我們一起看看它，把它拼成比較平衡的說法。',
        thought: {
          original: '我掉棒了，所以大家一定都討厭我。',
          feelingNote: '會難過、自責都很正常，那些感受是真的。我們不是要假裝沒事，而是幫想法鬆一鬆。',
          slots: [
            { label: '說出事實', piece: '我今天交棒時掉棒了，' },
            { label: '不過度概括', piece: '但這不代表大家都討厭我。' },
            { label: '我可以做的', piece: '我可以先了解同學的想法，下次多練習交棒。' }
          ],
          distractors: [
            { text: '反正我什麼都做不好。', why: '這片拼圖把一次失誤變成「什麼都做不好」，又變得太絕對了。' },
            { text: '我一點都不難過，沒差。', why: '難過是真實的感受，不需要假裝沒事喔。' }
          ]
        },
        actionPrompt: '比賽還在進行，你想先怎麼做？',
        actions: [
          { text: '深呼吸一下，跑回隊伍旁邊幫下一棒加油', reply: [{ who: 'mei', text: '你回來了！我們一起幫最後一棒加油！' }], da: -3 },
          { text: '小聲對自己說：「失誤會發生，我還在這裡。」', reply: [{ who: 'sprite', text: '對自己溫柔一點，是很重要的復原力。' }], da: -4 },
          { text: '先走到旁邊，一個人靜一靜', reply: [{ who: 'narr', text: '你在樹蔭下站了一會兒，慢慢讓呼吸穩下來。需要的時候，暫停也沒關係。' }], da: -2 }
        ]
      },
      {
        title: '同學的不同反應', time: '10:00', scene: 'track',
        cast: [{ who: 'me', expr: 'sad', x: .22 }, { who: 'zhe', expr: 'worried', x: .45 }, { who: 'mei', expr: 'happy', x: .66 }, { who: 'an', expr: 'worried', x: .86 }],
        lines: [
          { who: 'narr', text: '比賽結束了，我們班得到第三名。' },
          { who: 'zhe', text: '如果沒有掉棒，我們說不定就第一名了……' },
          { who: 'mei', text: '可是後面大家都追得超拼的啊！第三名也很棒耶！' },
          { who: 'an', text: '你還好嗎？' }
        ],
        emotionPrompt: '聽到同學不同的反應，你現在的感覺是？',
        emotions: ['委屈', '難過', '生氣', '安心'], extra: ['自責', '感謝', '尷尬', '平靜'],
        signals: ['heart', 'throat', 'tears', 'tense', 'slowRelax', 'none'],
        skillHint: 'island',
        skillIntro: '心裡有點亂的時候，可以找人幫忙。我們到支持浮島，練習一句清楚又尊重的求助說法。',
        support: {
          situation: '掉棒後心裡有點亂，不知道怎麼面對阿哲',
          helpers: ['teacher', 'an', 'counselor', 'mom'],
          parts: [
            { label: '打招呼', opts: [
              { t: '{call}，可以跟你說一下話嗎？', ok: true },
              { t: '喂！過來一下！', ok: false, why: '先禮貌地打招呼，對方會更願意好好聽你說。' }] },
            { label: '說出狀況和感受', opts: [
              { t: '我剛剛掉棒了，覺得很難過，也怕大家怪我。', ok: true },
              { t: '沒事啦……', ok: false, why: '說「沒事」的話，對方很難知道你需要幫忙。試著說出發生什麼事和你的感受。' }] },
            { label: '說出需要的幫忙', opts: [
              { t: '可以陪我想想，要怎麼跟阿哲說嗎？', ok: true },
              { t: '你去叫阿哲不要再講了！', ok: false, why: '這比較像命令別人。清楚說出「希望對方怎麼幫你」會更好。' }] }
          ]
        },
        actionPrompt: '你想怎麼表達感受、面對同學？',
        actions: [
          { tag: 'apologize', text: '對阿哲說：「掉棒我也很難過。我也很想贏，下次我們一起練習交棒好嗎？」', reply: [{ who: 'zhe', text: '嗯……我剛剛太激動了。好！下次體育課一起練！' }], da: -5 },
          { tag: 'thanks', text: '先跟美美說謝謝，等心情穩定一點，再和阿哲聊', reply: [{ who: 'mei', text: '不客氣！我們是同一隊的啊！' }], da: -4 },
          { tag: 'express', text: '告訴阿哲：「你剛剛那樣說，我聽了很難過。」', reply: [{ who: 'zhe', text: '……對不起，我不是故意要怪你，我只是太想贏了。' }], da: -4 }
        ]
      },
      {
        title: '運動會結束', time: '15:30', scene: 'photo',
        cast: [{ who: 'an', expr: 'happy', x: .18 }, { who: 'me', expr: 'relieved', x: .38 }, { who: 'zhe', expr: 'happy', x: .58 }, { who: 'mei', expr: 'excited', x: .76, pose: 'cheer' }, { who: 'teacher', expr: 'happy', x: .92 }],
        lines: [
          { who: 'teacher', text: '大家今天都很努力！來，全班一起拍張合照！' },
          { who: 'narr', text: '夕陽照在操場上，「喀嚓」一聲，照片裡的大家都比了大大的 YA。' }
        ],
        emotionPrompt: '回想今天一整天，現在的你感覺？',
        emotions: ['平靜', '累', '開心', '難過'], extra: ['驕傲', '感謝', '安心', '失落'],
        signals: ['weak', 'yawn', 'relax', 'warm', 'sore', 'none'],
        skillHint: 'harbor',
        skillIntro: '一整天用了好多能量。要不要停靠安全港，看看身體需要什麼樣的休息？',
        actionPrompt: '今天，你最想記住哪一件事？',
        actions: [
          { text: '失誤之後，我還是回到了隊伍裡', reply: [{ who: 'teacher', text: '跌倒後還願意站起來，這就是很棒的復原力。' }] },
          { text: '有同學願意鼓勵我、陪著我', reply: [{ who: 'an', text: '朋友就是要互相加油啊！以後我難過的時候，換你陪我喔！' }] },
          { text: '我注意到了自己的心情一直在變化', reply: [{ who: 'sprite', text: '能注意到自己的波浪，就是駕馭它的第一步！' }] }
        ],
        ending(rec) {
          const out = [];
          const a5 = rec[4] && rec[4].actionTag;
          if (a5 === 'apologize') out.push({ who: 'zhe', text: '下禮拜體育課，記得找我一起練交棒喔！' });
          else if (a5 === 'thanks') out.push({ who: 'zhe', text: '那個……今天我說太重了。我們還是好隊友！' });
          else out.push({ who: 'zhe', text: '謝謝你跟我說你的感覺，我以後會注意說話的方式。' });
          out.push({ who: 'teacher', text: '名次不是今天最重要的事。最重要的是，大家在失誤以後，怎麼互相陪伴、重新站起來。' });
          return out;
        }
      }
    ]
  },

  /* ======================================================
     故事二：考試的一天
     ====================================================== */
  exam: {
    id: 'exam', title: '考試的一天', short: '考試', boardColor: '#7fd3f5',
    bgTheme: 'exam',
    intro: '今天第三節是數學小考，你昨天晚上已經複習過了。',
    events: [
      {
        title: '早上準備考試', time: '07:30', scene: 'classroom',
        cast: [{ who: 'me', expr: 'calm', x: .3 }, { who: 'yu', expr: 'tired', x: .7 }],
        lines: [
          { who: 'narr', text: '今天第三節是數學小考。你的鉛筆盒裡裝著削好的鉛筆和新的橡皮擦。' },
          { who: 'yu', text: '早……你昨天有複習嗎？我複習到好晚，好睏喔。' }
        ],
        emotionPrompt: '想到等一下的考試，你的心情是？',
        emotions: ['有信心', '擔心', '平靜', '緊張'], extra: ['期待', '累', '煩躁', '沒什麼感覺'],
        signals: ['heart', 'tummy', 'sweat', 'yawn', 'relax', 'none'],
        actionPrompt: '考試前的早自習，你想做什麼？',
        actions: [
          { text: '再翻一下筆記，複習最有把握的部分', reply: [{ who: 'narr', text: '看到熟悉的題目，你在心裡默默點了點頭。' }], da: -3 },
          { text: '跟小宇分享自己昨天複習的方法', reply: [{ who: 'yu', text: '原來可以把公式寫成小卡片！我下次也要試試看。' }] },
          { text: '確認文具都準備好，然後喝口水', reply: [{ who: 'narr', text: '鉛筆、橡皮擦、尺都在。準備好的感覺讓人比較安心。' }], da: -4 }
        ]
      },
      {
        title: '同學討論考試範圍', time: '10:00', scene: 'hall',
        cast: [{ who: 'kai', expr: 'surprised', x: .25 }, { who: 'me', expr: 'nervous', x: .5 }, { who: 'yu', expr: 'worried', x: .75 }],
        lines: [
          { who: 'kai', text: '欸欸，你們有練「雞兔同籠」那種題型嗎？聽說今天會考耶！' },
          { who: 'narr', text: '雞兔同籠？你好像沒有特別練過這種題目……' },
          { who: 'yu', text: '真的假的？課本有教嗎？' }
        ],
        emotionPrompt: '突然聽到不熟悉的題型，你的感覺是？',
        emotions: ['緊張', '焦慮', '慌張', '還好'], extra: ['困惑', '生氣', '擔心', '平靜'],
        signals: ['heart', 'blank', 'breath', 'tense', 'tummy', 'relax'],
        skillHint: 'breath',
        skillIntro: '突然聽到不熟悉的東西，身體的警報響了。先用呼吸讓波浪慢下來，再想下一步。',
        actionPrompt: '離考試還有十分鐘，你想怎麼做？',
        actions: [
          { text: '去問老師：「請問考試範圍有這種題型嗎？」', reply: [{ who: 'teacher', text: '好問題！這次只考課本第三、四單元，雞兔同籠是下個單元才會教喔。' }], da: -8 },
          { text: '翻開課本，花幾分鐘看一下相關的例題', reply: [{ who: 'narr', text: '你找到了類似的例題，雖然還不熟，但至少知道它長什麼樣子了。' }], da: -3 },
          { text: '告訴自己：「不會的題目可以先跳過，先寫會的。」', reply: [{ who: 'sprite', text: '先想好遇到困難的計畫，就像衝浪前先看好浪的方向！' }], da: -4 }
        ]
      },
      {
        title: '考試開始', time: '10:40', scene: 'exam',
        cast: [{ who: 'teacher', expr: 'calm', x: .8 }, { who: 'me', expr: 'determined', x: .32 }],
        lines: [
          { who: 'teacher', text: '考卷發下去了，請先寫上班級座號，然後開始作答。' },
          { who: 'narr', text: '教室安靜得只聽得到筆的沙沙聲。接下來是平衡衝浪：用 ← → 方向鍵或畫面兩側的按鈕，讓衝浪板保持平衡，就像讓注意力回到考卷上。' }
        ],
        challenge: { type: 'balance', title: '專注平衡衝浪', duration: 20, words: ['翻考卷的沙沙聲', '時鐘滴答滴答', '「我會不會寫不完？」', '窗外的鳥叫聲', '隔壁同學擦橡皮擦', '「剛剛那題對嗎？」'] },
        emotionPrompt: '寫考卷的時候，你的感覺比較像？',
        emotions: ['專心', '緊張', '焦慮', '累'], extra: ['有信心', '煩躁', '平靜', '困惑'],
        signals: ['heart', 'sweat', 'tense', 'breath', 'relax', 'yawn'],
        actionPrompt: '你想用什麼方式寫考卷？',
        actions: [
          { text: '照順序一題一題寫', reply: [{ who: 'narr', text: '一題、兩題、三題……你穩穩地往前寫。' }] },
          { text: '先把整張考卷看過一遍，再開始寫', reply: [{ who: 'narr', text: '看完整張考卷，你知道哪些題目比較有把握了。' }], da: -3 },
          { text: '每寫完一題，就在心裡說「好，下一題」', reply: [{ who: 'sprite', text: '一次只面對一題，波浪就不會一下子變太大。' }], da: -3 }
        ]
      },
      {
        title: '遇到不會的難題', time: '10:55', scene: 'exam',
        cast: [{ who: 'me', expr: 'nervous', x: .4 }],
        lines: [
          { who: 'narr', text: '寫到第 8 題，你讀了三遍還是看不懂。時鐘的秒針一格一格地走……' },
          { who: 'narr', text: '腦中突然冒出一個聲音：「完了，我一定考不好了！」' }
        ],
        emotionPrompt: '卡在難題上的你，現在的心情是？',
        emotions: ['慌張', '困惑', '挫折', '想放棄'], extra: ['生氣', '害怕', '難過', '平靜'],
        signals: ['heart', 'blank', 'sweat', 'breath', 'weak', 'tears'],
        skillHint: 'harbor',
        skillIntro: '難題像一個大浪打過來。先把衝浪板停靠安全港，暫停一下、觀察身體，再回來面對題目。',
        actionPrompt: '停下來之後，你想怎麼處理這一題？',
        actions: [
          { tag: 'skip', text: '先跳過這題，把會寫的題目寫完再回來', reply: [{ who: 'narr', text: '你在題號旁邊畫了一顆小星星，先往下寫。寫完會的題目後，心裡踏實多了。' }], da: -6 },
          { tag: 'reread', text: '在心裡數 1 到 5，重新把題目慢慢讀一次', reply: [{ who: 'narr', text: '慢慢讀第二次時，你發現題目其實在問「總共多少」。好像有一點頭緒了！' }], da: -5 },
          { tag: 'mark', text: '把題目畫重點，先寫下自己知道的部分', reply: [{ who: 'sprite', text: '就算只寫出一部分，也是在努力面對難題喔。' }], da: -4 }
        ]
      },
      {
        title: '考試結束', time: '11:20', scene: 'hall',
        cast: [{ who: 'kai', expr: 'determined', x: .2 }, { who: 'yu', expr: 'worried', x: .45 }, { who: 'me', expr: 'worried', x: .72 }],
        lines: [
          { who: 'kai', text: '第 8 題答案是 24 吧？我超確定的！' },
          { who: 'yu', text: '咦？我寫 36 耶……' },
          { who: 'narr', text: '你寫的答案跟他們兩個都不一樣。' }
        ],
        emotionPrompt: '發現答案跟別人不一樣，你的感覺是？',
        emotions: ['擔心', '挫折', '好奇', '還好'], extra: ['自責', '生氣', '尷尬', '安心'],
        signals: ['heart', 'tummy', 'tense', 'hot', 'weak', 'none'],
        skillHint: 'puzzle',
        skillIntro: '和別人比較的時候，很容易冒出很重的想法。我們來玩想法拼圖。',
        thought: {
          original: '我的答案跟別人不一樣，我一定是全班最笨的。',
          feelingNote: '擔心是很自然的，因為你在乎自己的學習。我們一起把想法拼得平衡一點。',
          slots: [
            { label: '說出事實', piece: '我的答案跟同學不一樣，' },
            { label: '不過度概括', piece: '但這不代表我很笨，而且還不知道誰算對。' },
            { label: '我可以做的', piece: '等考卷發回來，我可以好好訂正、問老師。' }
          ],
          distractors: [
            { text: '反正我永遠都學不會數學。', why: '「永遠」這兩個字太絕對了，一次考試不能決定以後。' },
            { text: '考試一點都不重要，我才不擔心。', why: '擔心是真實的感受，不用硬說自己不在乎喔。' }
          ]
        },
        actionPrompt: '同學還在對答案，你想怎麼回應？',
        actions: [
          { text: '說：「我們等考卷發下來，再一起看吧！」', reply: [{ who: 'kai', text: '也是啦，現在吵也沒有用，哈哈。' }], da: -4 },
          { text: '說：「我寫的不一樣，可以跟我說你怎麼算的嗎？」', reply: [{ who: 'yu', text: '好啊，我們三個把算法寫出來比比看！' }], da: -2 },
          { text: '說：「我先不想對答案，我去喝個水。」', reply: [{ who: 'narr', text: '你走到飲水機旁，喝了幾口冰涼的水。照顧自己的感受也很重要。' }], da: -5 }
        ]
      },
      {
        title: '放學回顧', time: '16:00', scene: 'dusk',
        cast: [{ who: 'me', expr: 'calm', x: .38 }, { who: 'mom', expr: 'happy', x: .65 }],
        lines: [
          { who: 'mom', text: '你回來啦！今天考試還好嗎？' },
          { who: 'narr', text: '走在回家的路上，你想起今天的波浪：有緊張、有卡住，也有慢慢穩下來的時候。' }
        ],
        emotionPrompt: '回想今天，現在的你感覺？',
        emotions: ['平靜', '累', '安心', '擔心'], extra: ['驕傲', '開心', '失落', '感謝'],
        signals: ['weak', 'yawn', 'relax', 'warm', 'tense', 'none'],
        skillHint: 'island',
        skillIntro: '考完試心裡還有一點牽掛嗎？可以試著跟信任的人說說看。',
        support: {
          situation: '考試後，心裡還有一點擔心',
          helpers: ['mom', 'teacher', 'an', 'counselor'],
          parts: [
            { label: '打招呼', opts: [
              { t: '{call}，我可以跟你說今天考試的事嗎？', ok: true },
              { t: '欸，我跟你講喔，你要聽喔！', ok: false, why: '用詢問的方式開口，對方比較能準備好聽你說。' }] },
            { label: '說出狀況和感受', opts: [
              { t: '我遇到一題不會寫，到現在還有點擔心。', ok: true },
              { t: '還好啦，沒事。', ok: false, why: '如果其實還在擔心，試著把感受說出來，對方才知道怎麼陪你。' }] },
            { label: '說出需要的幫忙', opts: [
              { t: '考卷發回來後，可以陪我一起看看哪裡錯了嗎？', ok: true },
              { t: '你不要再問我考試了！', ok: false, why: '如果不想被追問，可以說「我想先休息一下，晚點再聊」。' }] }
          ]
        },
        actionPrompt: '下一次考試，你想嘗試哪一個策略？',
        actions: [
          { tag: 'next-breath', text: '考前先做三次呼吸光圈', reply: [{ who: 'mom', text: '好主意！要不要現在就一起練習一次？' }] },
          { tag: 'next-skip', text: '遇到難題先跳過，先寫會的', reply: [{ who: 'mom', text: '這個方法很聰明，可以讓你不會卡太久。' }] },
          { tag: 'next-thought', text: '用平衡的想法提醒自己', reply: [{ who: 'mom', text: '「這題還不會，不代表我很笨」，這句話好棒。' }] },
          { tag: 'next-support', text: '有困難時，找人說說看', reply: [{ who: 'mom', text: '隨時都可以來找我聊，我會好好聽。' }] }
        ],
        ending(rec) {
          const out = [];
          const a4 = rec[3] && rec[3].actionTag;
          if (a4 === 'skip') out.push({ who: 'sprite', text: '你今天用了「先寫會的」策略，讓難題不會把你整個捲走。' });
          else if (a4 === 'reread') out.push({ who: 'sprite', text: '你今天試著停一下、重新讀題，這需要很大的勇氣。' });
          else out.push({ who: 'sprite', text: '你今天就算卡住了，也努力寫下自己知道的部分。' });
          out.push({ who: 'mom', text: '分數是一部分，但你今天怎麼面對壓力，我覺得更值得記住。' });
          return out;
        }
      }
    ]
  },

  /* ======================================================
     故事三：校外教學的一天
     ====================================================== */
  trip: {
    id: 'trip', title: '校外教學的一天', short: '校外教學', boardColor: '#7fe0ad',
    bgTheme: 'trip',
    intro: '今天全班要搭遊覽車去自然科學博物館！',
    events: [
      {
        title: '搭車出發', time: '08:00', scene: 'bus',
        cast: [{ who: 'me', expr: 'happy', x: .3 }, { who: 'an', expr: 'excited', x: .55 }, { who: 'teacher', expr: 'happy', x: .82 }],
        lines: [
          { who: 'teacher', text: '大家坐好、繫好安全帶，我們要出發去博物館囉！' },
          { who: 'an', text: '你要不要吃小餅乾？我好想快點看到恐龍喔！' },
          { who: 'narr', text: '車子慢慢開出校門，窗外是你平常很少經過的街道。' }
        ],
        emotionPrompt: '坐在遊覽車上，你的心情是？',
        emotions: ['期待', '興奮', '緊張', '擔心'], extra: ['開心', '好奇', '平靜', '累'],
        signals: ['heart', 'fidget', 'tummy', 'relax', 'yawn', 'none'],
        skillHint: 'breath',
        skillIntro: '去新的地方，興奮和緊張常常會同時出現。要不要用呼吸光圈讓身體準備好？',
        actionPrompt: '車程中，你想做什麼？',
        actions: [
          { text: '跟小安分享自己最想看的展區', reply: [{ who: 'an', text: '昆蟲區？我也想去！我們等一下一起看！' }] },
          { text: '看看窗外，數一數經過幾座橋', reply: [{ who: 'narr', text: '一座、兩座、三座……專心看窗外，讓身體慢慢放鬆下來。' }], da: -4 },
          { text: '跟老師說：「我第一次去，有點緊張。」', reply: [{ who: 'teacher', text: '謝謝你告訴我。等一下大家會一起行動，有問題隨時來找我。' }], da: -6 }
        ]
      },
      {
        title: '抵達參觀地點', time: '09:30', scene: 'museum',
        cast: [{ who: 'staff', expr: 'happy', x: .2 }, { who: 'me', expr: 'excited', x: .45 }, { who: 'kai', expr: 'surprised', x: .7 }],
        lines: [
          { who: 'staff', text: '歡迎來到博物館！今天大家分組參觀，記得要跟緊自己的組員喔。' },
          { who: 'narr', text: '哇！好大的恐龍骨架！接下來是探索衝浪：按空白鍵或點一下畫面跳起來，收集各種展品發現吧！' }
        ],
        challenge: { type: 'collect', title: '探索發現衝浪', duration: 16, words: ['菊石化石', '銀杏葉', '海螺貝殼', '恐龍骨頭'] },
        emotionPrompt: '在博物館裡探索，你的感覺是？',
        emotions: ['好奇', '興奮', '開心', '驚訝'], extra: ['平靜', '期待', '累', '緊張'],
        signals: ['heart', 'fidget', 'hot', 'bright', 'relax', 'none'],
        actionPrompt: '你想怎麼記錄今天的發現？',
        actions: [
          { text: '把最喜歡的展品畫在學習單上', reply: [{ who: 'narr', text: '你畫了一個螺旋形的菊石，越畫越專心。' }], da: -3 },
          { text: '問館員姊姊一個問題', reply: [{ who: 'staff', text: '好問題！菊石是很久很久以前住在海裡的動物喔。' }] },
          { text: '跟組員分享剛剛的發現', reply: [{ who: 'kai', text: '真的嗎？我也要去看！' }] }
        ]
      },
      {
        title: '小組意見不合', time: '10:30', scene: 'garden',
        cast: [{ who: 'mei', expr: 'angry', x: .22 }, { who: 'me', expr: 'worried', x: .5 }, { who: 'kai', expr: 'angry', x: .78, flip: true }],
        lines: [
          { who: 'mei', text: '我們先去海洋區啦！那裡有超大的鯨魚！' },
          { who: 'kai', text: '不要！化石區比較酷，先去化石區！' },
          { who: 'narr', text: '你剛剛提議想去昆蟲區，可是好像沒有人聽到……' }
        ],
        emotionPrompt: '大家意見不合、你的提議沒被聽到，你的感覺是？',
        emotions: ['生氣', '委屈', '困惑', '煩躁'], extra: ['難過', '失落', '尷尬', '平靜'],
        signals: ['hot', 'fist', 'tense', 'heart', 'hide', 'none'],
        skillHint: 'puzzle',
        skillIntro: '被忽略的感覺很不好受。腦中冒出的想法，我們一起來拼成比較平衡的說法。',
        thought: {
          original: '他們都不聽我的，所以沒有人在乎我。',
          feelingNote: '覺得委屈、生氣是可以的，你的感受很重要。我們試著讓想法不要變得太絕對。',
          slots: [
            { label: '說出事實', piece: '剛剛大家意見不一樣，我的提議沒被聽到，' },
            { label: '不過度概括', piece: '但這不代表沒有人在乎我。' },
            { label: '我可以做的', piece: '我可以清楚說出想法，也聽聽別人想去哪裡。' }
          ],
          distractors: [
            { text: '他們每次都這樣，我再也不要跟他們同組。', why: '「每次」「再也不要」讓一次的衝突變成永遠，太絕對了。' },
            { text: '我才不生氣，去哪裡都無所謂。', why: '如果心裡其實不舒服，不需要假裝無所謂喔。' }
          ]
        },
        actionPrompt: '你想怎麼處理小組的意見不合？',
        actions: [
          { tag: 'vote', text: '說：「我們用猜拳或投票決定順序，好嗎？」', reply: [{ who: 'mei', text: '好啊，這樣比較公平！' }], da: -5 },
          { tag: 'speak', text: '說：「我也想去昆蟲區，可以排在第三個嗎？」', reply: [{ who: 'kai', text: '喔！我剛剛真的沒聽到。可以啊，最後去昆蟲區！' }], da: -5 },
          { tag: 'pause', text: '先說：「我需要冷靜一下。」再回來討論', reply: [{ who: 'an', text: '好，我陪你在旁邊坐一下，等一下再一起討論。' }], da: -4 }
        ]
      },
      {
        title: '與隊伍暫時走散', time: '11:15', scene: 'lost',
        cast: [{ who: 'me', expr: 'nervous', x: .25 }, { who: 'staff', expr: 'calm', x: .72 }],
        lines: [
          { who: 'narr', text: '你在昆蟲標本前看得太專心，一抬頭——咦？組員都不見了！' },
          { who: 'narr', text: '四周都是不認識的人，你的心跳越來越快……' }
        ],
        emotionPrompt: '發現自己和隊伍走散了，你的心情是？',
        emotions: ['害怕', '慌張', '擔心', '想哭'], extra: ['困惑', '生氣', '委屈', '平靜'],
        signals: ['heart', 'breath', 'sweat', 'blank', 'shake', 'tears'],
        skillHint: 'harbor',
        skillIntro: '走散時最重要的是：先停下來，不要亂跑。我們先把衝浪板停靠安全港，讓自己穩下來。',
        safetyNote: '🛟 安全小提醒：走散時，留在原地或明顯的地點；找穿制服、掛識別證的工作人員或服務台；說出學校和帶隊老師的名字。不要自己到處跑，也不要跟陌生人離開。',
        actionPrompt: '停下來之後，最安全的做法是？',
        actions: [
          { tag: 'staff', text: '留在附近明顯的地方，找穿制服、掛識別證的館員幫忙', reply: [{ who: 'staff', text: '別擔心，我幫你廣播聯絡老師。你先在服務台旁邊等，好嗎？' }], da: -8 },
          { tag: 'desk', text: '走到看得到的服務台，說出學校和老師的名字', reply: [{ who: 'staff', text: '好的，你是跟林老師一起來的對吧？我馬上聯絡帶隊老師。' }], da: -8 },
          { tag: 'run', retry: true, text: '自己跑去每個展區找同學', reply: [{ who: 'sprite', text: '自己到處跑，可能會離大家越來越遠，老師也更難找到你。我們再想一個更安全的做法吧！' }] }
        ]
      },
      {
        title: '重新與隊伍會合', time: '11:30', scene: 'lost',
        cast: [{ who: 'teacher', expr: 'relieved', x: .22 }, { who: 'me', expr: 'relieved', x: .48 }, { who: 'an', expr: 'sad', x: .72 }, { who: 'staff', expr: 'happy', x: .9 }],
        lines: [
          { who: 'teacher', text: '你在這裡！太好了！你做得很好，知道要找工作人員幫忙。' },
          { who: 'an', text: '嗚嗚，我們剛剛到處找你！' },
          { who: 'narr', text: '看到大家，你鬆了一口氣。可是心裡好像還有一點委屈：剛剛怎麼沒有人發現你不見了？' }
        ],
        emotionPrompt: '回到隊伍裡，你現在的感覺是？',
        emotions: ['安心', '委屈', '緊張', '想哭'], extra: ['開心', '生氣', '感謝', '累'],
        signals: ['slowRelax', 'tears', 'stillFast', 'weak', 'tense', 'none'],
        skillHint: 'island',
        skillIntro: '安心和委屈可以同時存在。我們到支持浮島，練習把感受和需求說清楚。',
        support: {
          situation: '剛剛走散了，現在安心但還有點委屈',
          helpers: ['teacher', 'an', 'staff', 'mom'],
          parts: [
            { label: '打招呼', opts: [
              { t: '{call}，我可以說說我剛剛的感覺嗎？', ok: true },
              { t: '哼，你們都不管我！', ok: false, why: '有委屈很正常！不過用指責的方式開口，對方可能會急著解釋。試試看先說自己的感受。' }] },
            { label: '說出狀況和感受', opts: [
              { t: '剛剛找不到大家，我很害怕，也覺得有點委屈。', ok: true },
              { t: '沒事啦，我根本不在意。', ok: false, why: '如果心裡其實有感覺，可以誠實地說出來，不用假裝不在意。' }] },
            { label: '說出需要的幫忙', opts: [
              { t: '接下來可以走在一起，換展區時互相提醒嗎？', ok: true },
              { t: '以後你們全部都要聽我的！', ok: false, why: '這比較像命令。說出一個具體、大家都做得到的請求，會更容易被接受。' }] }
          ]
        },
        actionPrompt: '接下來，你想怎麼做？',
        actions: [
          { tag: 'buddy', text: '跟組員約定：換展區或轉彎時，大家互相點名', reply: [{ who: 'mei', text: '好主意！我們來當彼此的小隊長！' }], da: -4 },
          { tag: 'thanks', text: '跟小安說：「謝謝你們來找我。」', reply: [{ who: 'an', text: '當然啊！你是我們很重要的組員！' }], da: -4 },
          { tag: 'rest', text: '跟老師說：「我需要先坐一下，再繼續參觀。」', reply: [{ who: 'teacher', text: '沒問題，我們先在這裡休息五分鐘。說出需要很棒喔。' }], da: -6 }
        ]
      },
      {
        title: '返校回顧', time: '15:30', scene: 'busHome',
        cast: [{ who: 'an', expr: 'tired', x: .3 }, { who: 'me', expr: 'relieved', x: .55 }, { who: 'teacher', expr: 'happy', x: .82 }],
        lines: [
          { who: 'an', text: '今天好好玩喔！雖然中間有點驚險……' },
          { who: 'teacher', text: '回到學校前，想一想今天你最想記住的一件事。' }
        ],
        emotionPrompt: '回程的車上，現在的你感覺？',
        emotions: ['開心', '累', '平靜', '感謝'], extra: ['驕傲', '擔心', '安心', '失落'],
        signals: ['weak', 'yawn', 'relax', 'warm', 'sore', 'none'],
        actionPrompt: '今天，你最想記住哪一件事？',
        actions: [
          { text: '恐龍骨架好壯觀，好奇心讓我很開心', reply: [{ who: 'an', text: '下次我們一起去看海洋館！' }] },
          { text: '意見不同的時候，我說出了自己的想法', reply: [{ who: 'teacher', text: '清楚又尊重地表達，是很重要的能力。' }] },
          { text: '走散的時候，我知道怎麼保護自己、找人幫忙', reply: [{ who: 'teacher', text: '你今天真的很勇敢，也很冷靜。' }] },
          { text: '大家一起平安回來的那一刻', reply: [{ who: 'sprite', text: '有人陪伴的感覺，就像找到一座溫暖的浮島。' }] }
        ],
        ending(rec) {
          const out = [];
          const a3 = rec[2] && rec[2].actionTag;
          if (a3 === 'vote') out.push({ who: 'mei', text: '今天猜拳決定順序好公平，下次也這樣吧！' });
          else if (a3 === 'speak') out.push({ who: 'kai', text: '昆蟲區其實超好看的，還好你有說出來！' });
          else out.push({ who: 'an', text: '你冷靜下來以後再討論，大家都聽得比較進去耶。' });
          out.push({ who: 'teacher', text: '今天有快樂、有衝突、也有擔心。你在每一個時刻，都在學習照顧自己和別人。' });
          return out;
        }
      }
    ]
  }
};
