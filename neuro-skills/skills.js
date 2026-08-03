const APP_BASE=new URL("./",window.location.href);
const HUB_ROOT=new URL("../",APP_BASE);
const state={manifest:null,interactions:[],index:0,selected:null,submitted:false,score:0};
const $=id=>document.getElementById(id);

function resolveAsset(path){
  if(!path)return "";
  if(/^https?:\/\//i.test(path))return path;
  return new URL(path,HUB_ROOT).href;
}
async function loadJson(path){
  const response=await fetch(new URL(path,APP_BASE),{cache:"no-store"});
  if(!response.ok)throw new Error(`Could not load ${path} (${response.status})`);
  return response.json();
}
function escapeHtml(value){
  return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
async function boot(){
  try{
    state.manifest=await loadJson("content/module-manifest.json");
    state.interactions=await Promise.all(state.manifest.interactions.map(item=>loadJson(item.path)));
    $("progressText").textContent=`0 / ${state.interactions.length}`;
  }catch(error){
    $("startScreen").innerHTML=`<div class="hero-icon">⚠️</div><h2>Unable to load</h2><p>${escapeHtml(error.message)}</p>`;
  }
}
function renderMedia(item,phase="beforeAnswer"){
  if(!item.image)return "";
  const overlays=(item.overlays||[]).filter(o=>o.showOn===phase);
  return `<div class="interaction-image-wrap"><img class="interaction-image" src="${resolveAsset(item.image)}" alt="">${overlays.map(o=>`<img class="interaction-overlay" src="${resolveAsset(o.image)}" alt="">`).join("")}</div>`;
}
function renderMeta(item){return `<div class="question-meta"><span class="pill">${escapeHtml(item.topic)}</span><span class="pill">${escapeHtml(item.subtopic)}</span><span class="pill">${escapeHtml(item.difficulty)}</span></div>`;}
function startModule(){
  state.index=0;state.score=0;
  $("startScreen").classList.add("hidden");
  $("completeScreen").classList.add("hidden");
  $("learningScreen").classList.remove("hidden");
  renderCurrent();
}
function renderCurrent(){
  state.selected=null;state.submitted=false;
  $("submitButton").classList.remove("hidden");$("nextButton").classList.add("hidden");
  const item=state.interactions[state.index];
  $("progressText").textContent=`${state.index+1} / ${state.interactions.length}`;
  $("progressBar").style.width=`${(state.index/state.interactions.length)*100}%`;
  renderers[item.type].render(item);
}
const renderers={
  mcq:{
    render(item){
      $("interactionHost").innerHTML=`<article class="interaction">${renderMedia(item)}${renderMeta(item)}<h2 class="question">${escapeHtml(item.prompt)}</h2><div class="options">${item.content.options.map((o,i)=>`<button class="option" data-option="${i}">${escapeHtml(o)}</button>`).join("")}</div><div id="feedbackHost"></div></article>`;
      document.querySelectorAll("[data-option]").forEach(btn=>btn.onclick=()=>{if(state.submitted)return;state.selected=Number(btn.dataset.option);document.querySelectorAll(".option").forEach(x=>x.classList.remove("selected"));btn.classList.add("selected");});
    },
    submit(item){
      if(state.selected===null)return{error:"Choose an answer first."};
      const correct=state.selected===item.content.correctIndex;
      document.querySelectorAll("[data-option]").forEach(btn=>{const i=Number(btn.dataset.option);if(i===item.content.correctIndex)btn.classList.add("correct");else if(i===state.selected)btn.classList.add("incorrect");});
      return{correct};
    }
  },
  true_false:{
    render(item){
      $("interactionHost").innerHTML=`<article class="interaction">${renderMedia(item)}${renderMeta(item)}<h2 class="question">${escapeHtml(item.prompt)}</h2><div class="options"><button class="option" data-tf="true">True</button><button class="option" data-tf="false">False</button></div><div id="feedbackHost"></div></article>`;
      document.querySelectorAll("[data-tf]").forEach(btn=>btn.onclick=()=>{if(state.submitted)return;state.selected=btn.dataset.tf==="true";document.querySelectorAll(".option").forEach(x=>x.classList.remove("selected"));btn.classList.add("selected");});
    },
    submit(item){
      if(state.selected===null)return{error:"Choose True or False first."};
      const correct=state.selected===item.content.correctAnswer;
      document.querySelectorAll("[data-tf]").forEach(btn=>{const v=btn.dataset.tf==="true";if(v===item.content.correctAnswer)btn.classList.add("correct");else if(v===state.selected)btn.classList.add("incorrect");});
      return{correct};
    }
  },
  matching:{
    render(item){
      const pairs=item.content.pairs,rights=[...pairs.map(p=>p.right)].sort(()=>Math.random()-.5);
      $("interactionHost").innerHTML=`<article class="interaction">${renderMedia(item)}${renderMeta(item)}<h2 class="question">${escapeHtml(item.prompt)}</h2><div class="matching-grid"><div class="match-column">${pairs.map(p=>`<div class="match-item">${escapeHtml(p.left)}</div>`).join("")}</div><div class="match-column">${pairs.map((p,i)=>`<select class="match-select" data-match="${i}"><option value="">Choose match</option>${rights.map(r=>`<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join("")}</select>`).join("")}</div></div><div id="feedbackHost"></div></article>`;
    },
    submit(item){
      const values=[...document.querySelectorAll("[data-match]")].map(s=>s.value);
      if(values.some(v=>!v))return{error:"Complete every match first."};
      const correct=values.every((v,i)=>v===item.content.pairs[i].right);
      document.querySelectorAll("[data-match]").forEach((s,i)=>s.style.borderColor=values[i]===item.content.pairs[i].right?"var(--green)":"var(--red)");
      return{correct};
    }
  }
};
function submitCurrent(){
  const item=state.interactions[state.index],result=renderers[item.type].submit(item);
  if(result.error){alert(result.error);return;}
  state.submitted=true;if(result.correct)state.score++;
  $("feedbackHost").innerHTML=`${renderMedia(item,"afterAnswer")}<div class="feedback"><strong>${result.correct?"Correct":"Not quite"}</strong><div style="margin-top:7px">${escapeHtml(item.feedback?.explanation||"")}</div></div>`;
  $("submitButton").classList.add("hidden");$("nextButton").classList.remove("hidden");
}
function nextInteraction(){
  if(state.index>=state.interactions.length-1){completeModule();return;}
  state.index++;renderCurrent();
}
function completeModule(){
  $("learningScreen").classList.add("hidden");$("completeScreen").classList.remove("hidden");
  $("progressText").textContent=`${state.interactions.length} / ${state.interactions.length}`;
  $("scoreSummary").textContent=`You scored ${state.score} out of ${state.interactions.length} in this test module.`;
}
$("startButton").onclick=startModule;$("submitButton").onclick=submitCurrent;$("nextButton").onclick=nextInteraction;$("restartButton").onclick=startModule;
boot();