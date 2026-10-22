/* LAW//SHIFT VN educational candidate. Uses only approved essay answers from existing essay-memory.json. */
(function(){'use strict';
 const VNKEY='tb-vn-v2', LEGACY_KEY='tb-vn-v1'; let episodes=null,chosen=null,game=null,mainRoot=null;let selectedId='';
 const VERSION='tb-2026-10-22d';
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
     answers:game.answers,essayDraft:game.essayDraft,phase:game.phase,updatedAt:new Date().toISOString()};
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
 function reset(){game={chapterId:chosen.id,mode:'easy',slide:0,line:0,phase:'dialogue',score:0,answers:{},essayDraft:'',showAnswer:false};saveVN()}
 function goEssayOriginal(){const original=caseFor(chosen);if(!original)return;sceneMode(null);S.subject=original.subject;S.mode='essay';S.essayPick[original.subject]=original.id;document.querySelector('#q').value='';render()}
 function makeTitle(text,extra){const hd=el('div','vn-title');hd.append(el('h2',null,text));if(extra)hd.append(extra);return hd}
 function leaveScene(){saveVN();const last=chosen?.id;chosen=null;game=null;sceneMode(null);selectedId=last||selectedId;startScreen(ESSAY_DATA)}
 function beginOrResume(continued,id){
  const chapter=episodes.chapters.find(c=>c.id===(id||selectedId));if(!chapter)return;
  chosen=chapter;selectedId=chosen.id;
  const old=continued?savedVN(chosen.id):null;
  if(old){game={...old,chapterId:chosen.id,answers:old.answers||{},score:old.score||0,essayDraft:old.essayDraft||''};
   if(!['dialogue','quiz','feedback','final','end'].includes(game.phase)||!Number.isInteger(game.slide)||game.slide<0||game.slide>=chosen.slides.length){reset()}}
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
  action.append(start,resume,open);info.append(action);
  intro.append(info);out.append(intro);
  const foot=el('div','vn-library-shortcut');foot.append(el('h3',null,'劇情玩法與法規資料邊界'),
   el('p','vn-muted','35題皆可進入全畫面劇情、依 Claude 校訂骨架解謎及獨立申論。刑訴第1題保留原創完整對話；其餘34題屬「原題與骨架導向」教學劇本，新增遊戲台詞尚待逐題法學審查，並非34篇已完成客製化法律劇本。'),
   el('p','vn-muted','所有正式答案只從原 data/essay-memory.json 唯讀載入；背景為本套件共用插畫，並不代表題目事實中一定發生於該場景。'));
  out.append(foot);document.querySelector('#main').replaceChildren(out);mainRoot=out;
  const renderSelect=()=>{
   const pool=episodes.chapters.filter(c=>subject.value==='all'||c.subject===subject.value);
   if(!pool.some(x=>x.id===selectedId))selectedId=pool[0]?.id||'';
   select.replaceChildren(...pool.map(c=>{const item=caseFor(c),record=savedVN(c.id),mark=record?.phase==='end'?'✓':record?'◐':'○';const opt=el('option',null,mark+' '+(item?.number||'?')+'｜'+c.title);opt.value=c.id;return opt}));select.value=selectedId;
   updateCard();
  };
  const updateCard=()=>{
    const chapter=episodes.chapters.find(c=>c.id===selectedId);if(!chapter)return;
    const item=caseFor(chapter),resumeState=savedVN(chapter.id);
    const completed=episodes.chapters.filter(c=>savedVN(c.id)?.phase==='end').length;tag.textContent=subjectName(chapter.subject)+' · 第 '+(item?.number||'?')+' 題 · 已完成 '+completed+'/35';title.textContent=chapter.title;
    cover.src=image(chapter.slides.find(s=>s.bg)?.bg||'office');
    desc.textContent=chapter.essayId==='procedure-01'?'完整劇情示範：固定角色對話、法律選擇與最終申論。':'原題導向版：保留題幹與校訂骨架，透過角色問答訓練爭點排序及短答，再進入完整申論。';
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
  heading.append(label,acts);stage.append(heading);if(chosen.contentReviewStatus==='source-bound-draft'){const note=el('div','vn-review-tag','原題骨架情境版｜遊戲台詞待逐題複核');stage.append(note)}
  if(game.phase==='dialogue'){
    const dialog=el('div','vn-dialog'),speaker=el('span','vn-speaker'),speech=el('p');
    const next=btn('下一句 ▶',nextLine,'vn-next');const line=slide.lines[Math.min(game.line,slide.lines.length-1)];speaker.textContent=line.speaker;speech.textContent=line.text;
    next.textContent=game.line<slide.lines.length-1?'下一句 ▶':slide.quiz?'法律判斷 ▶':game.slide===chosen.slides.length-1?'撰寫申論 ▶':'繼續故事 ▶';
    dialog.append(speaker,speech,next);dialog.addEventListener('click',event=>{if(event.target!==next)nextLine()});stage.append(dialog);
  }else{
    const pane=el('section','vn-game-panel');pane.setAttribute('aria-live','polite');stage.append(pane);
    if(game.phase==='quiz')renderQuiz(pane,slide);else if(game.phase==='feedback')renderFeedback(pane,slide);
  }
  const progress=el('div','vn-scene-progress');progress.style.width=((game.slide+1)/chosen.slides.length*100)+'%';stage.append(progress);
  shell.append(stage);out.append(shell);
 }

 function nextLine(){const slide=chosen.slides[game.slide];if(game.line<slide.lines.length-1){game.line++;saveVN();draw()}else{game.phase=slide.quiz?'quiz':game.slide===chosen.slides.length-1?'final':'dialogue';if(game.phase==='dialogue'){game.slide++;game.line=0;}saveVN();draw()}}
 function nextSlide(){game.slide++;game.line=0;game.phase=game.slide>=chosen.slides.length?'final':'dialogue';saveVN();draw()}
 function renderQuiz(pane,slide){
  const test=slide.quiz;pane.append(el('span','vn-panel-tag','⚖ 法律判斷 · '+(game.mode==='easy'?'選擇模式':'自主作答')),
    el('h3',null,test.title),el('p','vn-question',game.mode==='easy'?test.question:test.hardPrompt));
  if(game.mode==='easy'){
    const options=el('div','vn-options');test.options.forEach((opt,ix)=>{
      const b=btn('',()=>{game.answers[test.id]={mode:'easy',choice:ix,valid:opt.valid};game.score=Object.values(game.answers).filter(x=>x.mode==='easy'&&x.valid).length;game.phase='feedback';saveVN();draw()},'vn-answer');
      b.append(el('small',null,String.fromCharCode(65+ix)),document.createTextNode(opt.text));options.append(b)});
    pane.append(options);
  }else{
    const ta=el('textarea','vn-writing vn-quick-answer');ta.rows=3;ta.placeholder='先寫出法源、要件與本案判斷……';ta.value=game.answers[test.id]?.text||'';ta.setAttribute('aria-label',test.hardPrompt);
    ta.addEventListener('focus',()=>{document.body.classList.add('vn-keyboard');screenHeight()});
    ta.addEventListener('blur',()=>{document.body.classList.remove('vn-keyboard');screenHeight()});
    ta.addEventListener('input',()=>{game.answers[test.id]={mode:'hard',text:ta.value};saveVN()});
    const bar=el('div','vn-game-actions');
    const commit=()=>{if(game.phase!=='quiz')return;
      if(ta.value.trim().length<10){showOverlay('尚未完成','請至少寫出一小段法律判斷理由。');return}
      game.answers[test.id]={mode:'hard',text:ta.value};game.phase='feedback';saveVN();ta.blur();draw()};
    const submit=btn('送出核對 ▶',commit,'vn-btn primary');
    // 虛擬鍵盤收合會移動畫面，必須在 pointerdown 時先提交，避免手機 tap 的 click 目標位移而失效。
    submit.addEventListener('pointerdown',event=>{if(document.activeElement===ta){event.preventDefault();commit()}});
    bar.append(btn('檢視題目',()=>showOverlay(test.title,test.hardPrompt)),submit);
    pane.append(ta,bar);
  }
 }

 function renderFeedback(pane,slide){
  const test=slide.quiz, entry=game.answers[test.id];pane.append(el('span','vn-panel-tag','⚖ 本幕回顧'),el('h3',null,test.title));
  if(game.mode==='easy')pane.append(el('p','vn-result',entry?.valid?'✓ 判斷方向正確':'⚠ 這個選項需要重新辨明要件'));
  else pane.append(el('p','vn-result','已記下你的回答；以下是自我檢核提示，並非 AI 評分。'));
  pane.append(el('p','vn-feedback-brief',test.easyExplanation));
  const actions=el('div','vn-game-actions');actions.append(btn('法條／檢核',()=>{
    const body=[test.rubric.map((x,i)=>(i+1)+'、'+x).join('\n'),'',test.laws?.length?'法條提示：'+test.laws.map(x=>subjectName(chosen.subject)+' §'+x).join('、'):'完整法源、例外與涵攝以原版 Claude 校訂參考答案為準。'].join('\n');showOverlay('法律檢核｜'+test.title,body);
  }),btn('繼續劇情 ▶',nextSlide,'vn-btn primary'));pane.append(actions);
 }

 function writingTop(title,exit){const head=el('div','vn-writer-head');head.append(btn('← 返回劇情',()=>{
  game.phase='dialogue';game.slide=chosen.slides.length-1;game.line=chosen.slides.at(-1).lines.length-1;saveVN();draw()},'vn-btn'),el('strong',null,title),btn('案件清單',leaveScene,'vn-btn'));return head;}
 function renderFinal(out){
  const e=ESSAY_DATA.items.find(x=>x.id===chosen.essayId);out.append(writingTop('申論結案 · 原題書寫'));
  const layout=el('div','vn-writer-main');const desk=el('section','vn-writer-sheet');
  desk.append(el('h3',null,'案件報告書｜'+subjectName(e.subject)+'第'+e.number+'題'),el('p','vn-muted','劇情已結束。請依 Claude 校訂題幹獨立作答，完成後再查看完整答案。'));
  const toggle=el('details','vn-prompt');const sum=el('summary',null,'查看完整原始題幹 ▾');toggle.append(sum,el('p',null,e.question));desk.append(toggle);
  const ta=el('textarea','vn-essay-textbox');ta.placeholder='一、破題與法源\n（一）各項搜索合法性\n1、要件與涵攝\n……\n綜上……';ta.value=game.essayDraft||'';ta.setAttribute('aria-label','完整申論作答');
  ta.addEventListener('focus',()=>{document.body.classList.add('vn-keyboard');screenHeight()});ta.addEventListener('blur',()=>{document.body.classList.remove('vn-keyboard');screenHeight()});
  const count=el('span','vn-writer-count','自動儲存 · '+ta.value.length+' 字');ta.addEventListener('input',()=>{game.essayDraft=ta.value;count.textContent='已儲存 · '+ta.value.length+' 字';saveVN()});desk.append(ta);
  const footer=el('div','vn-writer-footer');footer.append(count,btn('答題骨架',()=>showOverlay('原始校訂骨架',e.steps.map((x,i)=>(i+1)+'、'+x).join('\n'))),btn('參考答案',()=>showOverlay('Claude 校訂答案（唯讀）',e.answer)),btn('完成結案',()=>{
    if((game.essayDraft||'').trim().length<15){showOverlay('尚未完成','請先完成至少一段申論作答，再結案。');return}
    ta.blur();game.phase='end';saveVN();draw()},'vn-btn primary'));
  desk.append(footer);layout.append(desk);out.append(layout);
 }
 function renderEnd(out){
  const e=ESSAY_DATA.items.find(x=>x.id===chosen.essayId);out.append(writingTop('結案紀錄'));
  const div=el('div','vn-end-panel');div.append(el('div','vn-end-icon','✓'),el('h2',null,'案件已完成'),
   el('p',null,'你已完成劇情判斷及申論草稿。建議再逐段對照 Claude 校訂答案，記下法條或涵攝的漏點。'),
   el('p','vn-muted','簡易選項正確數：'+Object.values(game.answers||{}).filter(x=>x.mode==='easy'&&x.valid).length+' / '+Object.values(game.answers||{}).filter(x=>x.mode==='easy').length+'（不是升官等考試分數；困難模式不自動評分）。'));
  const a=el('div','vn-controls');a.append(btn('查看校訂答案',()=>showOverlay('完整校訂答案',e.answer)),btn('進入原版申論訓練',goEssayOriginal,'vn-btn primary'),btn('重新遊玩',()=>{reset();draw()}));div.append(a);out.append(div);
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
  const available=new Set(all.items.map(x=>x.id));if(episodes.chapters.some(c=>!available.has(c.essayId)))throw new Error('劇情與申論來源題號不相符');}}
 catch(e){document.querySelector('#main').textContent='劇情資料載入失敗：'+e.message;return}
 if(chosen&&game)draw();else{chosen=null;game=null;startScreen(all)}
 };
 window.vnForgetCurrentUI=function(){chosen=null;game=null;sceneMode(null)};
 window.vnResetForTest=function(){try{localStorage.removeItem(VNKEY);localStorage.removeItem(LEGACY_KEY)}catch(e){}chosen=null;game=null;sceneMode(null)};
})();
