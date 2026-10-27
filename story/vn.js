/* LAW//SHIFT VN educational candidate. Uses only approved essay answers from existing essay-memory.json. */
(function(){'use strict';
 const VNKEY='tb-vn-v2', LEGACY_KEY='tb-vn-v1'; let episodes=null,chosen=null,game=null,mainRoot=null;const LAWIDX={};let selectedId='';
 const VERSION='tb-2026-10-27b',REV=4;
 const screenHeight=()=>{let v=window.visualViewport;document.documentElement.style.setProperty('--vn-screen-h',Math.round(v?.height||window.innerHeight)+'px');};
 window.addEventListener('resize',screenHeight,{passive:true});window.visualViewport?.addEventListener('resize',screenHeight,{passive:true});
 const sceneMode=(kind)=>{document.body.classList.toggle('vn-screen',!!kind);document.body.classList.toggle('vn-writing-mode',kind==='writing');if(kind)screenHeight();else document.body.classList.remove('vn-keyboard');};
 const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x};
 const btn=(label,handler,cls='vn-btn')=>{const b=el('button',cls,label);b.type='button';b.addEventListener('click',handler);return b};
 const savedAll=()=>{
  let cur=null;
  try{cur=JSON.parse(localStorage.getItem(VNKEY)||'null')}catch(e){}
  if(cur&&cur.schema===2&&cur.chapters&&typeof cur.chapters==='object'&&!Array.isArray(cur.chapters))return cur;
  // Only migrate the old chapter-1 single-state object; keep old key untouched.
  try{const legacy=JSON.parse(localStorage.getItem(LEGACY_KEY)||'null');if(legacy&&legacy.chapterId==='vn-procedure-01')return {schema:2,chapters:{[legacy.chapterId]:legacy},lastChapterId:legacy.chapterId}}catch(e){}
  return {schema:2,chapters:{},lastChapterId:null};
 };
 const saveVN=()=>{
  if(!game?.chapterId)return;
  try{
   const collection=savedAll();const state={chapterId:game.chapterId,mode:game.mode,slide:game.slide,line:game.line,score:game.score,
     answers:game.answers,order:game.order,rev:REV,phase:game.phase,updatedAt:new Date().toISOString()};
   collection.chapters[game.chapterId]=state;collection.lastChapterId=game.chapterId;
   localStorage.setItem(VNKEY,JSON.stringify(collection));
  }catch(e){console.warn('劇情進度儲存失敗',e)}
 };
 const savedVN=(id)=>{const data=savedAll();return data.chapters[id||data.lastChapterId]||null};
 const q=(obj,selector)=>obj.querySelector(selector);
 const valSafe=x=>String(x??'');
 const image=(name)=>window.VN_ASSETS?.[name]||'assets/vn/'+name+'.webp';
 const subjectName=id=>({duty:'警察勤務',criminal:'刑法',procedure:'刑事訴訟法'}[id]||id);
 const caseFor=c=>ESSAY_DATA?.items?.find(x=>x.id===c.essayId);
 function reset(){game={chapterId:chosen.id,mode:'easy',slide:0,line:0,phase:'dialogue',score:0,answers:{},order:{}};saveVN()}
 const draftOf=id=>essayDrafts[id]||'';
 const setDraft=(id,v)=>{if(v.trim())essayDrafts[id]=v.slice(0,5000);else delete essayDrafts[id];saveDrafts()};
 function goEssayOriginal(){const original=caseFor(chosen);if(!original)return;sceneMode(null);S.subject=original.subject;S.mode='essay';S.essayPick[original.subject]=original.id;document.querySelector('#q').value='';render()}
 function makeTitle(text,extra){const hd=el('div','vn-title');hd.append(el('h2',null,text));if(extra)hd.append(extra);return hd}
 function leaveScene(){saveVN();const last=chosen?.id;chosen=null;game=null;sceneMode(null);selectedId=last||selectedId;startScreen(ESSAY_DATA)}
 function beginOrResume(continued,id){
  const chapter=episodes.chapters.find(c=>c.id===(id||selectedId));if(!chapter)return;
  chosen=chapter;selectedId=chosen.id;
  const old=continued?savedVN(chosen.id):null;
  if(old&&old.rev===REV){const {essayDraft,selfCheck,...rest}=old;game={...rest,chapterId:chosen.id,answers:old.answers||{},order:old.order||{},score:old.score||0};
   if(!['dialogue','quiz','recall','feedback','final','end'].includes(game.phase)||!Number.isInteger(game.slide)||game.slide<0||game.slide>=chosen.slides.length)reset()}
  else reset();draw();
 }
 function startScreen(all){
  sceneMode(null);
  const out=el('div','vn-root vn-library');out.append(makeTitle('LAW//SHIFT · 35個互動案件',el('span','vn-note',VERSION)));
  const intro=el('section','vn-library-hero'),cover=el('img');cover.alt='案件對應背景插畫';intro.append(cover);
  const info=el('div','vn-library-intro');const tag=el('span','vn-hero-tag'),title=el('h2'),desc=el('p');
  info.append(tag,title,desc);
  const pick=el('div','vn-case-pickers');const subject=el('select','vn-topic-select');subject.setAttribute('aria-label','選擇科目');
  for(const [id,name] of [['all','全部35題'],['duty','警察勤務15題'],['criminal','刑法10題'],['procedure','刑訴10題']]){const opt=el('option',null,name);opt.value=id;subject.append(opt)}
  const select=el('select','vn-topic-select');select.setAttribute('aria-label','選擇互動案件');pick.append(subject,select);info.append(pick);
  const action=el('div','vn-controls');const start=btn('▶ 開始這一章',()=>beginOrResume(false,selectedId),'vn-btn primary');
  const resume=btn('↩ 繼續此章',()=>beginOrResume(true,selectedId));
  const open=btn('開啟原版申論',()=>{const c=episodes.chapters.find(x=>x.id===selectedId);if(!c)return;const item=caseFor(c);if(!item)return;sceneMode(null);S.subject=item.subject;S.mode='essay';S.essayPick[item.subject]=item.id;document.querySelector('#q').value='';render()});
  const mix=btn('🎲 跨科隨機一章',()=>{const pool=episodes.chapters.filter(c=>c.id!==selectedId);selectedId=pool[Math.floor(Math.random()*pool.length)].id;subject.value='all';renderSelect()});
  const drills=el('div','vn-controls');drills.append(btn('⚡ 是非快問',()=>truthQuiz(subject.value)),btn('🔢 數字配對',()=>numberQuiz(subject.value)));
  action.append(start,resume,open,mix);info.append(action,drills);
  intro.append(info);out.append(intro);
  const foot=el('div','vn-library-shortcut');foot.append(el('h3',null,'劇情玩法與法規資料邊界'),
   el('p','vn-muted','35章、120道法律解謎＋20組總整理（分類／排序）：每題先回想、再看隨機排序的選項，選錯會說明錯在哪個要件，可點開法條全文，並連到同條文的其他題。另有「是非快問」「數字配對」跨章練習。標 ⚠ 者為校訂答案仍有待確認事項之題目。'),
   el('p','vn-muted','所有正式答案只從原 data/essay-memory.json 唯讀載入；背景為本套件共用插畫，並不代表題目事實中一定發生於該場景。'));
  out.append(foot);document.querySelector('#main').replaceChildren(out);mainRoot=out;
  const renderSelect=()=>{
   const pool=episodes.chapters.filter(c=>subject.value==='all'||c.subject===subject.value);
   if(!pool.some(x=>x.id===selectedId))selectedId=pool[0]?.id||'';
   select.replaceChildren(...pool.map(c=>{const item=caseFor(c),record=savedVN(c.id),mark=record?.phase==='end'?'✓':record?'◐':'○';const opt=el('option',null,mark+' '+(item?.number||'?')+'｜'+c.title+(item?.hasCaution?' ⚠':''));opt.value=c.id;return opt}));select.value=selectedId;
   updateCard();
  };
  const updateCard=()=>{
    const chapter=episodes.chapters.find(c=>c.id===selectedId);if(!chapter)return;
    const item=caseFor(chapter),resumeState=savedVN(chapter.id);
    const completed=episodes.chapters.filter(c=>savedVN(c.id)?.phase==='end').length;tag.textContent=subjectName(chapter.subject)+' · 第 '+(item?.number||'?')+' 題 · 已完成 '+completed+'/35';title.textContent=chapter.title;
    cover.src=image(chapter.slides.find(s=>s.bg)?.bg||'office');
    desc.textContent=chapter.summary+(item?.hasCaution?'\n⚠ 待確認：'+chapter.caution:'');
    resume.hidden=!resumeState||resumeState.phase==='end';
  };
  const last=savedAll().lastChapterId;selectedId=episodes.chapters.some(c=>c.id===selectedId)?selectedId:(last&&episodes.chapters.some(c=>c.id===last)?last:(episodes.chapters.find(c=>c.essayId==='procedure-01')||episodes.chapters[0]).id);
  subject.value=episodes.chapters.find(c=>c.id===selectedId)?.subject||'all';subject.addEventListener('change',renderSelect);
  select.addEventListener('change',()=>{selectedId=select.value;updateCard()});renderSelect();
 }

 function showStage(){
  const slide=chosen.slides[game.slide]||chosen.slides.at(-1);
  const writing=['final','end'].includes(game.phase);
  sceneMode(writing?'writing':'scene');
  const out=el('div','vn-root '+(writing?'vn-writing-screen':'vn-playing'));out.classList.toggle('vn-eink',!!S.eink);
  document.querySelector('#main').replaceChildren(out);mainRoot=out;
  if(writing){if(game.phase==='final')renderFinal(out);else renderEnd(out);return;}
  const shell=el('div','vn-shell');const stage=el('div','vn-stage');stage.setAttribute('aria-label',slide.label+'劇情畫面');
  const bg=el('img','vn-background');bg.src=image(slide.bg);bg.alt=slide.label+'插畫背景';stage.append(bg);
  slide.chars.forEach((name,i)=>{const pic=el('img','vn-portrait '+(i?'right':'left'));pic.src=image(name);pic.alt=({'senior':'警察學長','player':'承辦警員','reporter':'報案人','suspect':'甲','mother':'甲的母親'}[name]||name)+'立繪';stage.append(pic)});
  const heading=el('div','vn-head');const label=el('span','vn-chapter',(game.slide+1)+'/'+chosen.slides.length+' · '+slide.label);
  const acts=el('div','vn-actions');const toggle=btn(game.mode==='easy'?'簡易 ◇':'困難 ✎',()=>{game.mode=game.mode==='easy'?'hard':'easy';saveVN();draw()},'vn-mini');toggle.setAttribute('aria-label','切換簡易選擇與困難輸入');
  acts.append(toggle,btn('⋯',()=>showTools(slide),'vn-mini'),btn('退出',leaveScene,'vn-mini'));
  heading.append(label,acts);stage.append(heading);if(caseFor(chosen)?.hasCaution){const note=btn('⚠ 待確認題',()=>showOverlay('待確認事項',chosen.caution),'vn-review-tag');stage.append(note)}
  if(game.phase==='dialogue'){
    const dialog=el('div','vn-dialog'),speaker=el('span','vn-speaker'),speech=el('p');
    const next=btn('下一句 ▶',nextLine,'vn-next');const line=slide.lines[Math.min(game.line,slide.lines.length-1)];speaker.textContent=line.speaker;speech.textContent=line.text;
    next.textContent=game.line<slide.lines.length-1?'下一句 ▶':slide.quiz?'法律判斷 ▶':slide.drill?'總整理 ▶':game.slide===chosen.slides.length-1?'撰寫申論 ▶':'繼續故事 ▶';
    dialog.append(speaker,speech,next);dialog.addEventListener('click',event=>{if(event.target!==next)nextLine()});stage.append(dialog);
  }else{
    const pane=el('section','vn-game-panel');pane.setAttribute('aria-live','polite');stage.append(pane);
    if(slide.drill)renderDrill(pane,slide);else if(game.phase==='quiz')renderQuiz(pane,slide);else if(game.phase==='recall')renderRecall(pane,slide);else if(game.phase==='feedback')renderFeedback(pane,slide);
  }
  const progress=el('div','vn-scene-progress');progress.style.width=((game.slide+1)/chosen.slides.length*100)+'%';stage.append(progress);
  shell.append(stage);out.append(shell);
 }

 function nextLine(){const slide=chosen.slides[game.slide];if(game.line<slide.lines.length-1){game.line++;saveVN();draw()}else{game.phase=slide.quiz?(game.mode==='easy'?'recall':'quiz'):slide.drill?'quiz':game.slide===chosen.slides.length-1?'final':'dialogue';if(game.phase==='dialogue'){game.slide++;game.line=0;}saveVN();draw()}}
 function nextSlide(){game.slide++;game.line=0;game.phase=game.slide>=chosen.slides.length?'final':'dialogue';saveVN();draw()}
 function optionOrder(test){let o=game.order[test.id];if(!Array.isArray(o)||o.length!==test.options.length){o=test.options.map(x=>x.id);for(let i=o.length-1;i>0;i--){const k=Math.floor(Math.random()*(i+1));[o[i],o[k]]=[o[k],o[i]]}game.order[test.id]=o}return o.map(id=>test.options.find(x=>x.id===id))}
 function panelBody(pane){const body=el('div','vn-panel-body');pane.append(body);return body}
 function renderRecall(pane,slide){
  const test=slide.quiz;pane.append(el('span','vn-panel-tag','⚖ 先回想 · 不看選項'),el('h3',null,test.title));
  const body=panelBody(pane);body.append(el('p','vn-question',test.question),el('p','vn-feedback-brief','先在心裡說出：法源是哪一條？要件是什麼？本案結論為何？想好再看選項。'));
  const bar=el('div','vn-game-actions');bar.append(btn('想好了，看選項 ▶',()=>{game.phase='quiz';saveVN();draw()},'vn-btn primary'));pane.append(bar);
 }
 function renderQuiz(pane,slide){
  const test=slide.quiz;pane.append(el('span','vn-panel-tag','⚖ 法律判斷 · '+(game.mode==='easy'?'選擇模式':'自主作答')),el('h3',null,test.title));
  const body=panelBody(pane);body.append(el('p','vn-question',game.mode==='easy'?test.question:test.hardPrompt));
  if(game.mode==='easy'){
    const options=el('div','vn-options');optionOrder(test).forEach((opt,ix)=>{
      const b=btn('',()=>{game.answers[test.id]={mode:'easy',opt:opt.id,valid:opt.valid};game.score=Object.values(game.answers).filter(x=>x.mode==='easy'&&x.valid).length;game.phase='feedback';saveVN();draw()},'vn-answer');
      b.append(el('small',null,String.fromCharCode(65+ix)),document.createTextNode(opt.text));options.append(b)});
    body.append(options);
  }else{
    const ta=el('textarea','vn-writing vn-quick-answer');ta.rows=3;ta.placeholder='先寫出法源、要件與本案判斷……';ta.value=game.answers[test.id]?.text||'';ta.setAttribute('aria-label',test.hardPrompt);
    ta.addEventListener('focus',()=>{document.body.classList.add('vn-keyboard');screenHeight()});
    ta.addEventListener('blur',()=>{document.body.classList.remove('vn-keyboard');screenHeight()});
    ta.addEventListener('input',()=>{game.answers[test.id]={mode:'hard',text:ta.value};saveVN()});
    const bar=el('div','vn-game-actions');
    const commit=()=>{if(game.phase!=='quiz')return;
      if(ta.value.trim().length<12){showOverlay('尚未完成','請至少寫出一句完整的法律判斷（12字以上）。');return}
      game.answers[test.id]={mode:'hard',text:ta.value};game.phase='feedback';saveVN();ta.blur();draw()};
    const submit=btn('送出核對 ▶',commit,'vn-btn primary');
    // 虛擬鍵盤收合會移動畫面，必須在 pointerdown 時先提交，避免手機 tap 的 click 目標位移而失效。
    submit.addEventListener('pointerdown',event=>{if(document.activeElement===ta){event.preventDefault();commit()}});
    bar.append(btn('檢視題目',()=>showOverlay(test.title,test.hardPrompt)),submit);
    body.append(ta);pane.append(bar);
  }
 }

 function orderGame(box,items,msg,done){const pool=items.map((t,i)=>({t,i})).sort(()=>Math.random()-.5),list=el('ol'),grid=el('div','vn-options');let next=0,miss=0;
  pool.forEach(x=>{const b=btn(x.t,()=>{if(x.i!==next){miss++;msg.textContent='順序不對，再想想（錯 '+miss+' 次）';return}next++;b.remove();list.append(el('li',null,x.t));
   if(next===items.length){msg.textContent='完成！錯 '+miss+' 次。';done?.(miss)}else msg.textContent='很好，下一個是？'},'vn-answer');grid.append(b)});box.append(list,grid)}
 function renderDrill(pane,slide){
  const d=slide.drill,body=(pane.append(el('span','vn-panel-tag','🧩 總整理 · '+(d.type==='order'?'排序':'分類')),el('h3',null,d.title)),panelBody(pane));body.append(el('p','vn-question',d.prompt));
  const bar=el('div','vn-game-actions'),go=btn('繼續劇情 ▶',nextSlide,'vn-btn primary');go.hidden=true;
  const finish=ok=>{game.answers[d.id]={mode:'drill',valid:ok};saveVN();go.hidden=false};
  if(d.type==='order'){const msg=el('p','vn-feedback-brief','依序點選。');body.append(msg);orderGame(body,d.items,msg,miss=>finish(miss===0))}
  else{const rows=d.items.map(x=>{const r=el('label','vn-drill-row'),sel=el('select','vn-topic-select');sel.append(el('option',null,'—選擇—'),...d.groups.map(g=>{const o=el('option',null,g);o.value=g;return o}));r.append(el('span',null,x.t),sel);body.append(r);return [x,sel,r]});
   const check=btn('核對',()=>{let ok=0;rows.forEach(([x,sel,r])=>{const right=sel.value===x.g;ok+=right;r.dataset.ok=right;if(!right)r.querySelector('span').textContent=x.t+'　→ '+x.g});check.hidden=true;body.append(el('p','vn-result','答對 '+ok+' / '+rows.length));finish(ok===rows.length)},'vn-btn primary');bar.append(check)}
  bar.append(go);pane.append(bar);
 }
 function renderFeedback(pane,slide){
  const test=slide.quiz,entry=game.answers[test.id],right=test.options.find(x=>x.valid),pick=test.options.find(x=>x.id===entry?.opt);
  pane.append(el('span','vn-panel-tag','⚖ 本幕研判 · '+test.law),el('h3',null,test.title));const body=panelBody(pane);
  if(game.mode==='easy'&&pick){body.append(el('p','vn-result',pick.valid?'✓ 判斷正確':'✗ 這個判斷有誤'));
    if(!pick.valid)body.append(el('p','vn-feedback-brief','你選的錯在：'+pick.trap),el('p','vn-feedback-brief','正解：'+right.text));}
  else body.append(el('p','vn-result','已記下你的回答；請對照下列要點自我核對（非 AI 評分）。'));
  body.append(el('p','vn-feedback-brief',test.easyExplanation),el('p','vn-feedback-brief','記憶鏈：'+test.rubric.join(' → ')));
  if(test.refs.length){const refs=el('div','vn-refs');test.refs.forEach(([law,a])=>refs.append(btn('📖 '+(/^\d/.test(a)?law+' §'+a:a),()=>window.openLaw?.(law,a),'vn-mini')));body.append(refs);
   const other=[...new Set(test.refs.flatMap(([law,a])=>[...(LAWIDX[law+'§'+a]||[])]))].filter(id=>id!==chosen.id);
   if(other.length){const links=el('div','vn-refs');links.append(el('span','vn-feedback-brief','同條文也考在：'));other.slice(0,6).forEach(id=>{const c=episodes.chapters.find(x=>x.id===id),it=caseFor(c);
     links.append(btn({procedure:'刑訴',criminal:'刑法',duty:'勤務'}[c.subject]+it.number+'〈'+c.title+'〉',()=>{saveVN();beginOrResume(true,id)},'vn-mini'))});body.append(links)}}
  const actions=el('div','vn-game-actions');actions.append(btn('繼續劇情 ▶',nextSlide,'vn-btn primary'));pane.append(actions);
 }

 function writingTop(title,exit){const head=el('div','vn-writer-head');head.append(btn('← 返回劇情',()=>{
  game.phase='dialogue';game.slide=chosen.slides.length-1;game.line=chosen.slides.at(-1).lines.length-1;saveVN();draw()},'vn-btn'),el('strong',null,title),btn('案件清單',leaveScene,'vn-btn'));return head;}
 function renderFinal(out){
  const e=ESSAY_DATA.items.find(x=>x.id===chosen.essayId);out.append(writingTop('申論結案 · 原題書寫'));
  const layout=el('div','vn-writer-main');const desk=el('section','vn-writer-sheet');
  desk.append(el('h3',null,'案件報告書｜'+subjectName(e.subject)+'第'+e.number+'題'),el('p','vn-muted','劇情已結束。請依 Claude 校訂題幹獨立作答，完成後再查看完整答案。'));
  const toggle=el('details','vn-prompt');const sum=el('summary',null,'查看完整原始題幹 ▾');toggle.append(sum,el('p',null,e.question));desk.append(toggle);
  const ta=el('textarea','vn-essay-textbox');ta.placeholder='一、破題與法源\n（一）各項搜索合法性\n1、要件與涵攝\n……\n綜上……';ta.value=draftOf(e.id);ta.setAttribute('aria-label','完整申論作答');
  ta.addEventListener('focus',()=>{document.body.classList.add('vn-keyboard');screenHeight()});ta.addEventListener('blur',()=>{document.body.classList.remove('vn-keyboard');screenHeight()});
  const count=el('span','vn-writer-count','自動儲存 · '+ta.value.length+' 字');ta.addEventListener('input',()=>{setDraft(e.id,ta.value);count.textContent='已儲存 · '+ta.value.length+' 字（與申論訓練共用）'});desk.append(ta);
  const footer=el('div','vn-writer-footer');footer.append(count,btn('本章筆記',()=>showOverlay('本章筆記｜'+chosen.title,chosen.slides.filter(x=>x.quiz).map(x=>{const r=game.answers[x.quiz.id];return (r?.mode==='easy'?(r.valid?'✓ ':'✗ '):'・')+x.quiz.title+'\n　'+x.quiz.rubric.join(' → ')}).join('\n\n'))),btn('骨架重建',()=>rebuild(e)),btn('答題骨架',()=>showOverlay('原始校訂骨架',e.steps.map((x,i)=>(i+1)+'、'+x).join('\n'))),btn('參考答案',()=>showOverlay('Claude 校訂答案（唯讀）',e.answer)),btn('完成結案',()=>{
    if(draftOf(e.id).trim().length<15){showOverlay('尚未完成','請先寫下至少一段申論，再結案。結案只代表劇情完成，掌握程度請在下一頁自評。');return}
    ta.blur();game.phase='end';saveVN();draw()},'vn-btn primary'));
  desk.append(footer);layout.append(desk);out.append(layout);
 }
 function rebuild(e){
  const dialog=el('dialog','vn-overlay'),inner=el('div','vn-rebuild'),msg=el('p','vn-muted','依答案順序點選小標。');inner.append(el('h3',null,'骨架重建｜'+e.title),msg);
  orderGame(inner,e.steps,msg,()=>{msg.textContent+=' 再用骨架寫出法源、要件、涵攝、結論。'});
  inner.append(btn('關閉',()=>dialog.close(),'vn-btn primary'));dialog.append(inner);dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();
 }
 window.vnRebuild=rebuild;
 function renderEnd(out){
  const e=ESSAY_DATA.items.find(x=>x.id===chosen.essayId);out.append(writingTop('結案紀錄'));
  const easy=Object.values(game.answers||{}).filter(x=>x.mode==='easy');
  const div=el('div','vn-end-panel');div.append(el('div','vn-end-icon','✓'),el('h2',null,'劇情完成'),
   el('p',null,'劇情完成不等於申論已掌握。請對照校訂答案，逐段勾選你能獨立寫出「法源、要件、涵攝、結論」的部分。'),
   el('p','vn-muted','選擇題正確：'+easy.filter(x=>x.valid).length+' / '+easy.length+'（不是考試分數；困難模式不自動評分）。'));
  const check=el('div','vn-selfcheck');e.steps.forEach((x,i)=>{const l=el('label'),c=el('input');c.type='checkbox';const own=()=>S.essaySelf[e.id]||[];c.checked=own().includes(i);c.onchange=()=>{const v=own().filter(x=>x!==i);if(c.checked)v.push(i);S.essaySelf[e.id]=v;save()};l.append(c,document.createTextNode(' '+(i+1)+'、'+x));check.append(l)});
  const grade=el('div','vn-controls');grade.append(el('strong',null,'回想程度：'));
  [[0,'想不起來｜立即重練',0],[1,'有提示才想起｜明天',86400000],[2,'可獨立回想｜3天後',3*86400000]].forEach(([n,label,ms])=>grade.append(btn(label,()=>{
   S.essayRecall[e.id]={grade:n,at:Date.now(),dueAt:Date.now()+ms};if(n===2)S.essayKnown[e.id]=1;else delete S.essayKnown[e.id];save();showOverlay('已排入複習','已記錄到「申論訓練」的複習排程，可用「到期／未作答」篩選。')})));
  const errs=el('div','vn-selfcheck'),cats=['法條記錯','要件遺漏','涵攝不足','結論或實務見解錯誤'],boxes=cats.map(c=>{const l=el('label'),x=el('input');x.type='checkbox';l.append(x,document.createTextNode(' '+c));errs.append(l);return x});
  const note=el('textarea','vn-writing');note.rows=2;note.maxLength=1000;note.placeholder='補充錯漏，例如：漏寫 §158-4 權衡因素';
  const saveErr=btn('存入錯漏註記',()=>{const tags=cats.filter((c,i)=>boxes[i].checked).map(c=>'［'+c+'］').join('');const text=(tags+' '+note.value.trim()).trim();if(!text)return;
   essayErrors[e.id]=((essayErrors[e.id]?essayErrors[e.id]+'\n':'')+text).slice(-1200);const ok=saveErrors();showOverlay(ok?'已儲存':'儲存失敗',ok?'已加入「申論訓練」本題的錯漏註記。':'裝置拒絕儲存，請先備份。')});
  const a=el('div','vn-controls');a.append(btn('查看校訂答案',()=>showOverlay('完整校訂答案',e.answer)),btn('進入原版申論訓練',goEssayOriginal,'vn-btn primary'),btn('重新遊玩',()=>{reset();draw()}));
  div.append(el('h3',null,'自評：能獨立寫出的段落'),check,grade,el('h3',null,'錯漏分項'),errs,note,saveErr,a);out.append(div);
 }

 // 快問：一次10題，題庫由現有資料自動產生（是非＝各題正解與錯誤選項；數字＝三科數字表），不新增法律內容
 function drillDialog(title,qs){
  const dialog=el('dialog','vn-overlay'),inner=el('div','vn-rebuild');let n=0,ok=0;dialog.append(inner);
  const show=()=>{inner.replaceChildren(el('h3',null,title+'｜'+(n+1)+' / '+qs.length));const q=qs[n],box=el('div','vn-options');inner.append(el('p',null,q.text),box);
   q.choices.forEach(c=>box.append(btn(c,()=>{const right=c===q.answer;ok+=right;box.replaceChildren(el('p','vn-result',(right?'✓ 正確':'✗ 錯誤，答案：'+q.answer)),el('p','vn-muted',q.note||''),
     btn(n<qs.length-1?'下一題 ▶':'看結果',()=>{n++;n<qs.length?show():(inner.replaceChildren(el('h3',null,title+'｜'+ok+' / '+qs.length),el('p','vn-muted','錯的題目請回到該章或申論訓練複習。'),btn('關閉',()=>dialog.close(),'vn-btn primary')))},'vn-btn primary'))},'vn-answer')));
   inner.append(btn('結束',()=>dialog.close(),'vn-btn'))};
  dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();show();
 }
 const sample=(a,k)=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).slice(0,k).map(x=>x[1]);
 function truthQuiz(sub){
  const pool=episodes.chapters.filter(c=>sub==='all'||c.subject===sub).flatMap(c=>c.slides.filter(x=>x.quiz).flatMap(x=>x.quiz.options.map(o=>({c,o,q:x.quiz}))));
  drillDialog('是非快問',sample(pool,10).map(({c,o,q})=>({text:'〈'+c.title+'〉'+o.text,choices:['○ 正確','✗ 錯誤'],answer:o.valid?'○ 正確':'✗ 錯誤',note:(o.valid?'':'錯在：'+o.trap+'\n')+'依據：'+q.law})));
 }
 async function numberQuiz(sub){
  const subs=sub==='all'?['criminal','procedure','duty']:[sub],rows=[];
  for(const id of subs){try{(await load(id)).numbers?.forEach(r=>rows.push(r))}catch(e){}}
  if(rows.length<3)return showOverlay('數字配對','數字表載入失敗。');
  drillDialog('數字配對',sample(rows,10).map(r=>({text:r.k+'？',choices:sample([r.v,...sample([...new Set(rows.map(x=>x.v))].filter(v=>v!==r.v),2)],3),answer:r.v,note:'依據：'+r.ref})));
 }
 function showTools(slide){
  const modal=el('dialog','vn-overlay');modal.style.cssText='width:min(450px,calc(100vw - 26px));max-height:80dvh;padding:0;border-radius:14px;border:1px solid #8ba3b8;background:#112438;color:#f4f6fc';
  const inside=el('div');inside.style.cssText='display:grid;gap:9px;padding:18px;';inside.append(el('h3',null,'案件工具｜'+slide.label));
  const item=(label,fn)=>btn(label,()=>{modal.close();fn()},'vn-btn');
  inside.append(item('📜 查看原始題幹',()=>showOverlay('Claude 校訂原題',ESSAY_DATA.items.find(x=>x.id===chosen.essayId).question)),
    item('💬 查看本幕對話',()=>showOverlay('對話紀錄',slide.lines.map(x=>x.speaker+'：'+x.text).join('\n\n'))),
    item('📖 Claude 校訂答題骨架',()=>showOverlay('申論骨架',caseFor(chosen).steps.map((x,i)=>(i+1)+'、'+x).join('\n'))),
    item(S.eink?'◧ 關閉電子紙模式':'◧ 開啟電子紙模式',()=>{S.eink=!S.eink;document.documentElement.toggleAttribute('data-eink',S.eink);save();draw()}),
    item('關閉選單',()=>{}));
  modal.append(inside);modal.addEventListener('close',()=>modal.remove());document.body.append(modal);modal.showModal();
 }
 function showOverlay(title,text){const dialog=el('dialog','vn-overlay');dialog.style.cssText='width:min(700px,calc(100vw - 24px));max-height:min(83dvh,700px);padding:0;border-radius:14px;border:1px solid #7893a8;color:#152438;background:#f9fbff';const inner=el('div');inner.style.cssText='padding:clamp(12px,4vw,22px);';inner.append(el('h3',null,title));const p=el('div');p.style.cssText='white-space:pre-wrap;line-height:1.9;font-size:15px;max-height:60vh;overflow:auto';p.textContent=valSafe(text);inner.append(p);const close=btn('關閉',()=>dialog.close(),'vn-btn primary');close.style.marginTop='14px';inner.append(close);dialog.append(inner);dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal()}
 function draw(){if(!chosen){return}showStage()}
 window.viewVN=async function(_d,all){document.querySelector('.wrap').classList.add('vn-layout');try{if(!episodes){const r=await fetch('story/episodes.json');if(!r.ok)throw new Error('HTTP '+r.status);episodes=await r.json();
  if(episodes.chapters.length!==35)throw new Error('章節數不完整');
  const available=new Set(all.items.map(x=>x.id));if(episodes.chapters.some(c=>!available.has(c.essayId)))throw new Error('劇情與申論來源題號不相符');
  // 22d 以前劇情內的草稿併入記憶樹同題草稿（記憶樹已有草稿者不覆蓋）
  for(const [id,st] of Object.entries(savedAll().chapters))if(st?.essayDraft){const ep=id.replace(/^vn-/,'');if(!essayDrafts[ep])setDraft(ep,st.essayDraft)}
  for(const c of episodes.chapters)for(const sl of c.slides)for(const [law,a] of sl.quiz?.refs||[])(LAWIDX[law+'§'+a]??=new Set).add(c.id);}}
 catch(e){document.querySelector('#main').textContent='劇情資料載入失敗：'+e.message;return}
 if(chosen&&game)draw();else{chosen=null;game=null;startScreen(all)}
 };
 window.vnForgetCurrentUI=function(){chosen=null;game=null;sceneMode(null)};
 window.vnResetForTest=function(){try{localStorage.removeItem(VNKEY);localStorage.removeItem(LEGACY_KEY)}catch(e){}chosen=null;game=null;sceneMode(null)};
})();
