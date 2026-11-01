/* 三科遊戲模式（11-01b）：勤務派遣台、刑法論證牌組、刑訴程序迷宮。
   題目、選項、錯因、法源一律取自 story/episodes.json 已校訂內容，不新增法律內容；遊戲分數獨立存放，不影響學習紀錄。 */
(function(){'use strict';
const KEY='tb-game-v1';
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const btn=(x,f,c='lg-btn')=>{const b=el('button',c,x);b.type='button';b.onclick=f;return b};
const best=k=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')[k]||0}catch(e){return 0}};
const keep=(k,v)=>{try{const b=JSON.parse(localStorage.getItem(KEY)||'{}');if(!(b[k]>=v)){b[k]=v;localStorage.setItem(KEY,JSON.stringify(b))}}catch(e){}};
const quizzes=chs=>chs.flatMap(c=>c.slides.filter(s=>s.quiz).map(s=>({c,q:s.quiz})));
const refs=q=>{const r=el('div','lg-refs');q.refs.forEach(([law,a])=>r.append(btn('📖 '+(/^\d+(-\d+)?$/.test(a)?law+' §'+a:a),()=>window.openLaw?.(law,a),'lg-mini')));return r};
const right=q=>q.options.find(o=>o.valid);

// 共用外框：全螢幕對話框、抬頭數值列、主畫面
function frame(kind,title,sub){
  const d=el('dialog','lg lg-'+kind),top=el('header','lg-top'),hud=el('div','lg-hud'),body=el('main','lg-body');
  const h=el('div','lg-name');h.append(el('b',null,title),el('small',null,sub));
  top.append(h,hud,btn('離開',()=>d.close(),'lg-btn ghost'));d.append(top,body);
  d.addEventListener('close',()=>{clearInterval(d.timer);d.remove()});document.body.append(d);d.showModal();
  return {d,hud,body,stat:(...xs)=>hud.replaceChildren(...xs.map(([k,v])=>{const s=el('span','lg-stat');s.append(el('i',null,k),el('b',null,String(v)));return s}))};
}
// 判定說明：選對簡述，選錯說明錯在哪裡並附正解
function verdict(q,o){
  const w=el('div','lg-verdict '+(o?.valid?'ok':'bad'));
  w.append(el('p','lg-v-hd',o?.valid?'✓ 判斷正確':o?'✗ 判斷有誤':'✗ 未完成（逾時或出牌用盡）'));
  if(o&&!o.valid)w.append(el('p',null,'錯在：'+o.trap));
  if(!o?.valid)w.append(el('p',null,'正解：'+right(q).text));
  const more=el('details');more.append(el('summary',null,'解析與記憶鏈'),el('p',null,q.easyExplanation),el('p','lg-chain','記憶鏈：'+q.rubric.join(' → ')));
  w.append(more,refs(q));return w;
}
// 結算：逐題回顧，錯題可回到劇情章節
function debrief(g,head,log,onChapter){
  const box=el('section','lg-debrief');box.append(head);
  log.forEach(({c,q,o})=>{const r=el('details','lg-log '+(o?.valid?'ok':'bad'));
    r.append(el('summary',null,(o?.valid?'✓ ':'✗ ')+c.title+'｜'+q.title),verdict(q,o));
    if(!o?.valid)r.append(btn('回到本章劇情',()=>{g.d.close();onChapter(c.id)},'lg-mini'));box.append(r)});
  box.append(el('p','lg-note','遊戲分數只是練習回饋；掌握程度請以申論訓練的無提示回想與自評為準。'));
  g.body.replaceChildren(box);
}

// ── 勤務派遣台：同時有兩件報案在倒數，自己判斷先處理哪件 ──
const ZONES=['北區','車站','商圈','學區','分局','河濱','工業區','山區','市場'];
function dispatch(chs,onChapter){
  const g=frame('dispatch','勤務派遣台','警察勤務 · 同時兩案倒數，選對處置方案');
  const pool=shuffle(quizzes(chs)).slice(0,6),log=[];let trust=3,score=0,combo=0,open=null,paused=false;
  const calls=[],free=shuffle(ZONES.filter(z=>z!=='分局'));
  const map=el('div','lg-map'),side=el('div','lg-side'),stage=el('div','lg-desk');
  const spawn=()=>{while(calls.length<2&&pool.length)calls.push({...pool.shift(),zone:free.pop(),left:60})};
  const stat=()=>g.stat(['民眾信任','♥'.repeat(trust)||'—'],['分數',score],['連續',combo],['待處理',calls.length+pool.length]);
  const drawMap=()=>{map.replaceChildren(...ZONES.map(z=>{const c=calls.find(x=>x.zone===z),done=log.find(x=>x.zone===z),t=el('button','lg-zone'+(c?' alert':done?(done.o?.valid?' safe':' fail'):'')+(z==='分局'?' hq':''));
    t.type='button';t.append(el('b',null,z),el('small',null,c?c.left+' 秒':done?(done.o?.valid?'已處置':'未妥處'):z==='分局'?'指揮中心':''));if(c)t.onclick=()=>show(c);return t}))};
  const drawQueue=()=>{side.replaceChildren(el('h4',null,'報案中'),...calls.map(c=>{const b=btn('',()=>show(c),'lg-call'+(c===open?' on':''));
    b.append(el('b',null,c.zone+'｜'+c.c.title),el('span',null,c.q.title),el('i',null,c.left+'s'));return b}))};
  function show(c){if(paused)return;open=c;const q=c.q;stage.replaceChildren(el('p','lg-tag','📻 '+c.zone+' 報案 · '+q.title),el('p','lg-q',q.question));
    const opts=el('div','lg-units');shuffle([...q.options]).forEach((o,i)=>opts.append(btn('方案 '+'ABC'[i]+'｜'+o.text,()=>decide(c,o),'lg-unit')));stage.append(opts);drawQueue()}
  function decide(c,o){calls.splice(calls.indexOf(c),1);log.push({...c,o});open=null;
    if(o?.valid){combo++;score+=100+c.left*2+combo*20}else{combo=0;trust--}
    paused=true;stage.replaceChildren(verdict(c.q,o),btn(trust>0&&(calls.length||pool.length)?'繼續值勤 ▶':'結束勤務 ▶',()=>{paused=false;next()},'lg-btn primary'));stat();drawMap();drawQueue()}
  function next(){spawn();stat();drawMap();drawQueue();
    if(trust<=0||!calls.length){clearInterval(g.d.timer);keep('dispatch',score);const h=el('div','lg-end');
      h.append(el('h3',null,trust>0?'勤務結束 · 轄區平安':'民眾信任歸零 · 勤務中止'),el('p',null,'分數 '+score+'（最佳 '+best('dispatch')+'）　正確 '+log.filter(x=>x.o?.valid).length+' / '+log.length));
      return debrief(g,h,log,onChapter)}
    if(!open||!calls.includes(open))show(calls[0])}
  g.d.timer=setInterval(()=>{if(paused)return;for(const c of [...calls])if(--c.left<=0){decide(c,null);return}drawMap();drawQueue()},1000);
  const wrap=el('div','lg-dwrap');wrap.append(map,side,stage);g.body.append(wrap);next();
}

// ── 刑法論證牌組：手牌是本案所有論證，依序把正確論證打進卡槽 ──
const JOKERS=[['穩健辯護','每案第一次失誤不重置倍率','steady'],['法條之眼','卡槽顯示本爭點法源','eye'],['加碼論證','正確論證籌碼 +25','chips'],['多一手','每案可出牌數 +1','hand']];
function cards(chs,onChapter){
  const g=frame('cards','刑法論證牌組','刑法 · 依爭點順序打出正確論證，識破陷阱牌');
  const cases=shuffle([...chs]).slice(0,3),BL=['地方法院','高等法院','最高法院（Boss）'],J=new Set(),log=[];let total=0,ci=0;
  function round(){
    const c=cases[ci],boss=ci===2&&cases.length===3,slots=quizzes([c]),hand=shuffle(slots.flatMap(s=>s.q.options.map(o=>({o,s}))));
    let k=0,mult=1,chips=0,hands=slots.length+(boss?1:2)+(J.has('hand')?1:0),discards=boss?1:3,slip=J.has('steady'),pick=null;
    const msg=el('p','lg-msg','點一張牌，再按「出牌」放進目前卡槽；認為是陷阱就「棄牌」。');
    const stat=()=>g.stat(['案件',(ci+1)+'/'+cases.length+' '+BL[ci]],['籌碼×倍率',chips+'×'+mult],['出牌',hands],['棄牌',discards],['總分',total]);
    const board=el('div','lg-slots'),handBox=el('div','lg-hand'),acts=el('div','lg-acts');
    const draw=()=>{stat();board.replaceChildren(...slots.map((s,i)=>{const d=el('div','lg-slot'+(i<k?' done':i===k?' now':''));d.append(el('b',null,(i+1)+'｜'+s.q.title),el('p',null,i<k?right(s.q).text:i===k?s.q.question:'？'));
      if(i===k&&J.has('eye'))d.append(el('small',null,'法源：'+s.q.law));return d}));
      handBox.replaceChildren(...hand.map(h=>{const b=btn(h.o.text,()=>{pick=h;draw()},'lg-card'+(h===pick?' pick':''));return b}))};
    const fail=(h,why)=>{if(slip)slip=false;else mult=1;hands--;msg.textContent=why;if(h.o.valid)return;hand.splice(hand.indexOf(h),1);log.push({c,q:h.s.q,o:h.o})};
    const play=()=>{if(!pick)return;const h=pick;pick=null;
      if(h.s===slots[k]&&h.o.valid){chips+=50+(J.has('chips')?25:0);mult++;hand.splice(hand.indexOf(h),1);log.push({c,q:h.s.q,o:h.o});k++;msg.textContent='✓ 論證成立：倍率 +1'}
      else if(h.o.valid)fail(h,'順序不對：這張是〈'+h.s.q.title+'〉的論證，先處理目前卡槽。');
      else fail(h,'✗ 陷阱牌（〈'+h.s.q.title+'〉）：'+h.o.trap);end()};
    const toss=()=>{if(!pick||!discards)return;const h=pick;pick=null;discards--;
      if(h.o.valid){hands--;msg.textContent='這張是正確論證，不能棄：出牌數 −1。'}else{mult++;hand.splice(hand.indexOf(h),1);msg.textContent='識破陷阱：倍率 +1（'+h.o.trap+'）'}end()};
    const end=()=>{if(k<slots.length&&hands>0)return draw();
      const won=k===slots.length,pts=chips*mult;if(won)total+=pts;
      slots.slice(k).forEach(s=>log.push({c,q:s.q,o:null}));
      const box=el('div','lg-end');box.append(el('h3',null,won?'✓ '+BL[ci]+' 論證成立 +'+pts:'✗ 出牌用盡，論證不完整'),el('p',null,c.title+'｜'+chips+' × '+mult));
      if(won&&ci<cases.length-1){const left=JOKERS.filter(j=>!J.has(j[2]));box.append(el('p',null,'選一張輔助牌帶到下一案：'));
        const row=el('div','lg-jokers');shuffle([...left]).slice(0,2).forEach(([n,t,id])=>{const b=btn('',()=>{J.add(id);ci++;round()},'lg-joker');b.append(el('b',null,n),el('span',null,t));row.append(b)});box.append(row)}
      else{keep('cards',total);box.append(el('p',null,'總分 '+total+'（最佳 '+best('cards')+'）'));const h=el('div');h.append(box);return debrief(g,h,log,onChapter)}
      g.body.replaceChildren(box)};
    acts.append(btn('出牌',play,'lg-btn primary'),btn('棄牌',toss,'lg-btn'));
    const intro=el('p','lg-case',c.summary);g.body.replaceChildren(el('h3','lg-casehd',BL[ci]+'｜'+c.title),intro,board,msg,acts,handBox);draw();
  }
  round();
}

// ── 刑訴程序迷宮：每個房間三道門，選的門決定下一間房的位置；走錯門是瑕疵房 ──
function maze(chs,onChapter){
  const g=frame('maze','刑訴程序迷宮','刑事訴訟法 · 選對程序之門，把合法證據帶進法庭');
  const rooms=chs.length===1?quizzes(chs):shuffle(quizzes(chs)).slice(0,6),log=[],path=[];let hp=3,col=1,i=0;
  const grid=el('div','lg-grid'),view=el('div','lg-room');
  const stat=()=>g.stat(['程序正義','⚖'.repeat(hp)||'—'],['房間',Math.min(i+1,rooms.length)+'/'+rooms.length],['合法證據',log.filter(x=>x.o?.valid).length]);
  const drawGrid=()=>{grid.style.setProperty('--r',rooms.length+2);const cells=[];
    for(let r=rooms.length+1;r>=0;r--)for(let c=0;c<3;c++){const p=path.find(x=>x.r===r&&x.c===c),t=el('div','lg-tile'+(r===rooms.length+1&&c===1?' court':r===0&&c===1?' start':p?(p.ok?' ok':' flaw'):'')+(r===i+1&&c===col&&i<rooms.length?' here':''));
      t.textContent=r===rooms.length+1&&c===1?'法庭':r===0&&c===1?'偵查開始':p?p.name:'';cells.push(t)}
    grid.replaceChildren(...cells)};
  function enter(){stat();drawGrid();
    if(i>=rooms.length||hp<=0){const ok=log.filter(x=>x.o?.valid).length,score=ok*100+hp*50;keep('maze',score);const h=el('div','lg-end');
      h.append(el('h3',null,hp>0?'抵達法庭 · 合法證據 '+ok+' / '+rooms.length:'程序正義耗盡 · 證據遭排除'),el('p',null,'分數 '+score+'（最佳 '+best('maze')+'）'));
      return debrief(g,h,log,onChapter)}
    const {c,q}=rooms[i];view.replaceChildren(el('p','lg-tag','🚪 '+c.title+'｜'+q.title),el('p','lg-q',q.question));
    const doors=el('div','lg-doors');shuffle([...q.options]).forEach((o,n)=>doors.append(btn(o.text,()=>pass(o,n),'lg-door')));view.append(doors)}
  function pass(o,n){const {c,q}=rooms[i];log.push({c,q,o});col=n;i++;path.push({r:i,c:col,ok:o.valid,name:o.valid?q.title:'瑕疵'});if(!o.valid)hp--;
    stat();drawGrid();view.replaceChildren(verdict(q,o),btn(i<rooms.length&&hp>0?'進入下一間 ▶':'前往法庭 ▶',enter,'lg-btn primary'))}
  const wrap=el('div','lg-mazewrap');wrap.append(grid,view);g.body.append(wrap);enter();
}

window.LawGames={dispatch,cards,maze,kindOf:s=>({duty:'dispatch',criminal:'cards',procedure:'maze'}[s])};
})();
