import{n as L,r as w,g as l,a as k,s as v,b as x,u as C,t as S,c as T,d as $,e as q,f as M,h as A,i as N,j as H,k as P,l as V,m as R,o as D}from"./index-B3fAQ_H-.js";const F=["session","results"];let p=new Map,h=new Map;function B(a,t,n){const e=t||a;return`${n==="presenter"||n==="student"?`[${n}] `:""}${e}`}function Q(a){const t=l();if(!t.attendee||t.attendee.role!=="admin"){L("#/auth");return}p=new Map,h=new Map;const n=document.createElement("div");n.className="view",n.style.maxWidth="720px",w(n,{title:"Admin",subtitle:"Event Control",showLogo:!1});const e=document.createElement("div");e.className="w-full",e.innerHTML=`
    <p class="label-tracked mb-1">Event Phase</p>
    <div class="phase-toggle" id="phase-toggle"></div>
  `,n.appendChild(e);const s=document.createElement("div");s.className="w-full",s.innerHTML=`
    <p class="label-tracked mb-1 mt-3">Schedule</p>
    <div id="schedule-editor"></div>
    <button class="btn btn--outline btn--full mt-1" id="add-schedule-item">+ Add Item</button>
    <button class="btn btn--gold btn--full mt-1" id="save-schedule">Save Schedule</button>
  `,n.appendChild(s);const c=document.createElement("div");c.className="w-full",c.innerHTML=`
    <p class="label-tracked mb-1 mt-3">Posters</p>
    <div id="poster-toggle-container">
      <p class="text-muted text-sm">Loading...</p>
    </div>
  `,n.appendChild(c);const o=document.createElement("div");o.className="w-full",o.innerHTML=`
    <p class="label-tracked mb-1 mt-3">Live Stats</p>
    <div class="stat-grid" id="stats-grid">
      <div class="card stat-card">
        <div class="stat-card__value" id="stat-checkins">—</div>
        <div class="stat-card__label">Check-ins</div>
      </div>
      <div class="card stat-card">
        <div class="stat-card__value" id="stat-visits">—</div>
        <div class="stat-card__label">Total Visits</div>
      </div>
      <div class="card stat-card">
        <div class="stat-card__value" id="stat-voters">—</div>
        <div class="stat-card__label">Voters</div>
      </div>
    </div>
  `,n.appendChild(o);const r=document.createElement("div");r.className="w-full",r.innerHTML=`
    <p class="label-tracked mb-1 mt-3">Attendees</p>
    <div id="attendee-list-container">
      <p class="text-muted text-sm">Loading...</p>
    </div>
  `,n.appendChild(r);const d=document.createElement("div");d.className="w-full",d.innerHTML=`
    <p class="label-tracked mb-1 mt-3">Poster Traffic</p>
    <div id="visit-counts-container">
      <p class="text-muted text-sm">Loading...</p>
    </div>
  `,n.appendChild(d);const i=document.createElement("div");i.className="w-full",i.innerHTML=`
    <p class="label-tracked mb-1 mt-3">Results</p>
    <div id="results-container">
      <p class="text-muted text-sm">Loading...</p>
    </div>
    <button class="btn btn--danger btn--full mt-1" id="reset-votes-btn">Reset All Votes</button>
  `,n.appendChild(i),i.querySelector("#reset-votes-btn").addEventListener("click",()=>{G(n)});const u=document.createElement("div");u.className="w-full",u.innerHTML=`
    <p class="label-tracked mb-1 mt-3">Live Feed</p>
    <div class="admin-feed" id="admin-feed">
      <p class="text-muted text-sm">Waiting for activity...</p>
    </div>
  `,n.appendChild(u);const m=document.createElement("button");return m.className="btn btn--outline btn--full mt-3",m.textContent="Refresh All",m.addEventListener("click",()=>g(n)),n.appendChild(m),a.appendChild(n),E(n),z(n),g(n),I(n),()=>{}}function E(a){const t=a.querySelector("#phase-toggle");if(!t)return;t.innerHTML="";const n=l().eventPhase;for(const e of F){const s=document.createElement("button");s.className=`phase-btn${e===n?" phase-btn--active":""}`,s.textContent=e,s.addEventListener("click",()=>{e!==n&&j(e,n,a)}),t.appendChild(s)}}function j(a,t,n){if(document.querySelector(".vote-confirm-overlay"))return;const e=document.createElement("div");e.className="vote-confirm-overlay",e.innerHTML=`
    <div class="vote-confirm-overlay__backdrop"></div>
    <div class="vote-confirm-card card">
      <h3 style="font-size:1.1rem; font-weight:700; text-align:center; margin-bottom:0.75rem;">Change Event Phase?</h3>
      <p class="text-sm text-center mb-1">
        <span class="text-muted">${t}</span>
        <span class="text-gold" style="font-weight:700"> → ${a}</span>
      </p>
      <p class="text-muted text-xs text-center mb-1">This affects all attendees immediately.</p>
      <div class="vote-confirm__actions">
        <button class="btn btn--outline" id="phase-cancel">Cancel</button>
        <button class="btn btn--gold" id="phase-confirm">Switch</button>
      </div>
    </div>
  `,e.querySelector("#phase-cancel").addEventListener("click",()=>e.remove()),e.querySelector(".vote-confirm-overlay__backdrop").addEventListener("click",()=>e.remove()),e.querySelector("#phase-confirm").addEventListener("click",async()=>{const s=e.querySelector("#phase-confirm");s.disabled=!0,s.textContent="...";const c=await V(l().attendee.code);e.remove(),c&&(v({eventPhase:a,phaseUpdatedAt:new Date().toISOString()}),E(n))}),document.body.appendChild(e),requestAnimationFrame(()=>e.classList.add("vote-confirm-overlay--open"))}function z(a){const t=a.querySelector("#schedule-editor");if(!t)return;const n=l(),e=n.schedule?.length?n.schedule:[{time:"2:30 PM",label:"Prof. Anson Ma — Rheology & Additive Manufacturing"},{time:"3:15 PM",label:"Prof. Mihai Duduta — Silicones for Extreme Environments"},{time:"4:00 PM",label:"Awards Ceremony"}];t.innerHTML="",e.forEach((s,c)=>{const o=document.createElement("div");o.className="schedule-row",o.innerHTML=`
      <input class="schedule-row__time" value="${s.time}" placeholder="Time">
      <input class="schedule-row__label" value="${s.label}" placeholder="Description">
      <button class="schedule-row__remove" data-index="${c}">&times;</button>
    `,t.appendChild(o)}),t.querySelectorAll(".schedule-row__remove").forEach(s=>{s.addEventListener("click",()=>{s.closest(".schedule-row").remove()})}),a.querySelector("#add-schedule-item")?.addEventListener("click",()=>{const s=document.createElement("div");s.className="schedule-row",s.innerHTML=`
      <input class="schedule-row__time" value="" placeholder="Time">
      <input class="schedule-row__label" value="" placeholder="Description">
      <button class="schedule-row__remove">&times;</button>
    `,s.querySelector(".schedule-row__remove").addEventListener("click",()=>s.remove()),t.appendChild(s)}),a.querySelector("#save-schedule")?.addEventListener("click",async()=>{const s=t.querySelectorAll(".schedule-row"),c=Array.from(s).map(d=>({time:d.querySelector(".schedule-row__time").value.trim(),label:d.querySelector(".schedule-row__label").value.trim()})).filter(d=>d.time&&d.label),o=a.querySelector("#save-schedule");o.disabled=!0,o.textContent="Saving...";const r=await C(l().attendee.code);o.disabled=!1,o.textContent=r?"Saved!":"Error",r&&(S("admin_schedule_saved",{item_count:c.length}),v({schedule:c})),setTimeout(()=>{o.textContent="Save Schedule"},2e3)})}async function I(a){const t=a.querySelector("#admin-feed");if(t)try{const n=await T(20);if(!n.length)return;t.innerHTML="";for(const e of n){const s=B(e.attendee_code,e.attendee_name||p.get(e.attendee_code)?.name,e.attendee_role||p.get(e.attendee_code)?.role);let c;if(e.type==="visit"){const i=h.get(e.poster_number),u=i?` — ${i}`:"";c=`${s} visited #${e.poster_number}${u}`}else{const i=["1st","2nd","3rd"],u=(e.ranks||[]).map(m=>`${i[m.rank-1]||`#${m.rank}`} #${m.poster_number}`);c=`${s} voted: ${u.join(", ")}`}const o=document.createElement("div");o.className=`feed-item feed-item--${e.type}`;const r=new Date(e.time).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"}),d=document.createElement("span");d.className="feed-item__time",d.textContent=r,o.appendChild(d),o.appendChild(document.createTextNode(` ${c}`)),t.appendChild(o)}}catch{}}async function g(a){await Promise.all([f(a),b(a),W(a),J(a),y(a)]);try{const n=await x();p=new Map(n.map(e=>[e.code,{name:e.name,role:e.role}]))}catch{}const t=l().posters;t?.length&&(h=new Map(t.map(n=>[n.number,n.student_name])))}async function f(a){try{const t=await $(),n=a.querySelector("#stat-checkins"),e=a.querySelector("#stat-visits"),s=a.querySelector("#stat-voters");n&&(n.textContent=t.checkins),e&&(e.textContent=t.totalVisits),s&&(s.textContent=t.voters)}catch{}}async function W(a){const t=a.querySelector("#poster-toggle-container");if(t)try{const n=await N();if(!n.length){t.innerHTML='<p class="text-muted text-sm">No posters found.</p>';return}t.innerHTML="";for(const e of n){const s=document.createElement("div");s.className=`poster-toggle-row${e.active?"":" poster-toggle-row--inactive"}`,s.innerHTML=`
        <span class="text-gold" style="font-weight:800; min-width:2rem">#${e.number}</span>
        <div class="poster-toggle-row__info">
          <div class="poster-toggle-row__title">${e.title}</div>
          <div class="poster-toggle-row__student">${e.student_name}</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${e.active?"checked":""}>
          <span class="toggle-switch__slider"></span>
        </label>
      `;const c=s.querySelector("input");c.addEventListener("change",async()=>{const o=c.checked;c.disabled=!0;const r=await H(l().attendee.code,e.number,o);c.disabled=!1,r?(S("admin_poster_toggled",{poster_number:e.number,active:o}),e.active=o,s.classList.toggle("poster-toggle-row--inactive",!o)):c.checked=!o}),t.appendChild(s)}}catch{t.innerHTML='<p class="text-muted text-sm">Error loading posters.</p>'}}async function b(a){const t=a.querySelector("#attendee-list-container");if(t)try{const[n,e]=await Promise.all([x(),A()]);if(!n.length){t.innerHTML='<p class="text-muted text-sm">No attendees found.</p>';return}const s={admin:[],presenter:[],student:[],attendee:[]};for(const r of n)(s[r.role]||s.attendee).push(r);const c={admin:"Admins",presenter:"Presenters",student:"Students",attendee:"Voters"};let o='<div class="attendee-list">';for(const r of["presenter","student","attendee","admin"]){const d=s[r];if(d.length){o+=`<p class="text-xs text-muted mt-1 mb-0" style="font-weight:600; text-transform:uppercase; letter-spacing:0.05em">${c[r]} (${d.length})</p>`;for(const i of d){const u=i.name.startsWith("Voter "),m=e.has(i.code);o+=`
          <div class="attendee-row" data-code="${i.code}">
            <span class="attendee-row__code">${i.code}</span>
            <span class="attendee-row__name ${u?"text-muted":""}">${i.name}</span>
            ${m?`<button class="attendee-row__reset btn--text" data-code="${i.code}" data-name="${i.name.replace(/"/g,"&quot;")}" style="color:var(--error)">Reset Votes</button>`:""}
            <button class="attendee-row__edit btn--text" data-code="${i.code}" data-name="${i.name.replace(/"/g,"&quot;")}">Edit</button>
          </div>
        `}}}o+="</div>",t.innerHTML=o,t.querySelectorAll(".attendee-row__edit").forEach(r=>{r.addEventListener("click",()=>{const d=r.dataset.code,i=r.dataset.name;O(d,i,a)})}),t.querySelectorAll(".attendee-row__reset").forEach(r=>{r.addEventListener("click",()=>{U(r.dataset.code,r.dataset.name,a)})})}catch{t.innerHTML='<p class="text-muted text-sm">Error loading attendees.</p>'}}function O(a,t,n){if(document.querySelector(".vote-confirm-overlay"))return;const e=document.createElement("div");e.className="vote-confirm-overlay",e.innerHTML=`
    <div class="vote-confirm-overlay__backdrop"></div>
    <div class="vote-confirm-card card">
      <h3 style="font-size:1.1rem; font-weight:700; text-align:center; margin-bottom:0.75rem;">Edit Name</h3>
      <p class="text-muted text-xs text-center mb-1">Code: <strong>${a}</strong></p>
      <input type="text" class="input" id="edit-name-input" value="${t.replace(/"/g,"&quot;")}" placeholder="Attendee name" style="margin-bottom:0.75rem">
      <div class="vote-confirm__actions">
        <button class="btn btn--outline" id="edit-cancel">Cancel</button>
        <button class="btn btn--gold" id="edit-save">Save</button>
      </div>
    </div>
  `,e.querySelector("#edit-cancel").addEventListener("click",()=>e.remove()),e.querySelector(".vote-confirm-overlay__backdrop").addEventListener("click",()=>e.remove()),e.querySelector("#edit-save").addEventListener("click",async()=>{if(!e.querySelector("#edit-name-input").value.trim())return;const o=e.querySelector("#edit-save");o.disabled=!0,o.textContent="...";const r=await R(l().attendee.code);e.remove(),r&&b(n)}),document.body.appendChild(e),requestAnimationFrame(()=>{e.classList.add("vote-confirm-overlay--open"),e.querySelector("#edit-name-input")?.focus()})}function U(a,t,n){if(document.querySelector(".vote-confirm-overlay"))return;const e=document.createElement("div");e.className="vote-confirm-overlay",e.innerHTML=`
    <div class="vote-confirm-overlay__backdrop"></div>
    <div class="vote-confirm-card card">
      <h3 style="font-size:1.1rem; font-weight:700; text-align:center; margin-bottom:0.75rem; color:var(--error)">Reset Votes?</h3>
      <p class="text-sm text-center mb-1">Delete all votes for <strong>${t}</strong> (${a})?</p>
      <p class="text-muted text-xs text-center mb-1">They'll be able to vote again.</p>
      <div class="vote-confirm__actions">
        <button class="btn btn--outline" id="reset-attendee-cancel">Cancel</button>
        <button class="btn btn--danger" id="reset-attendee-confirm">Reset Votes</button>
      </div>
    </div>
  `,e.querySelector("#reset-attendee-cancel").addEventListener("click",()=>e.remove()),e.querySelector(".vote-confirm-overlay__backdrop").addEventListener("click",()=>e.remove()),e.querySelector("#reset-attendee-confirm").addEventListener("click",async()=>{const s=e.querySelector("#reset-attendee-confirm");s.disabled=!0,s.textContent="...";const c=await D(l().attendee.code);e.remove(),c&&(a===l().attendee.code&&v({myVotes:[]}),f(n),y(n),b(n))}),document.body.appendChild(e),requestAnimationFrame(()=>e.classList.add("vote-confirm-overlay--open"))}function G(a){if(document.querySelector(".vote-confirm-overlay"))return;const t=document.createElement("div");t.className="vote-confirm-overlay",t.innerHTML=`
    <div class="vote-confirm-overlay__backdrop"></div>
    <div class="vote-confirm-card card">
      <h3 style="font-size:1.1rem; font-weight:700; text-align:center; margin-bottom:0.75rem; color:var(--error)">Reset All Votes?</h3>
      <p class="text-muted text-xs text-center mb-1">This permanently deletes every submitted vote. This action cannot be undone.</p>
      <p class="text-sm text-center mb-1">Type <strong style="color:var(--error)">RESET</strong> to confirm</p>
      <input type="text" class="input" id="reset-confirm-input" placeholder="Type RESET" autocomplete="off" style="margin-bottom:0.75rem; text-align:center">
      <div class="vote-confirm__actions">
        <button class="btn btn--outline" id="reset-cancel">Cancel</button>
        <button class="btn btn--danger" id="reset-confirm" disabled>Reset All Votes</button>
      </div>
    </div>
  `;const n=t.querySelector("#reset-confirm-input"),e=t.querySelector("#reset-confirm");n.addEventListener("input",()=>{e.disabled=n.value.trim()!=="RESET"}),t.querySelector("#reset-cancel").addEventListener("click",()=>t.remove()),t.querySelector(".vote-confirm-overlay__backdrop").addEventListener("click",()=>t.remove()),e.addEventListener("click",async()=>{e.disabled=!0,e.textContent="...";const s=await k(l().attendee.code);t.remove(),s&&(v({myVotes:[]}),f(a),y(a))}),document.body.appendChild(t),requestAnimationFrame(()=>{t.classList.add("vote-confirm-overlay--open"),n.focus()})}async function J(a){const t=a.querySelector("#visit-counts-container");if(t)try{const n=await P(),e=l().posters;if(!n.length){t.innerHTML='<p class="text-muted text-sm">No visits yet.</p>';return}const s=Math.max(...n.map(o=>o.count)),c=n.map(o=>{const r=e.find(i=>i.number===o.poster_number),d=s?o.count/s*100:0;return`
        <div class="visit-bar">
          <div class="visit-bar__label">#${o.poster_number}</div>
          <div class="visit-bar__track">
            <div class="visit-bar__fill" style="width: ${d}%"></div>
          </div>
          <div class="visit-bar__count">${o.count}</div>
        </div>
      `}).join("");t.innerHTML=`<div class="visit-bars">${c}</div>`}catch{t.innerHTML='<p class="text-muted text-sm">Error loading visit counts.</p>'}}async function y(a){const t=a.querySelector("#results-container");if(t)try{const[n,e]=await Promise.all([q(),M()]);if(!n.length&&!e.length){t.innerHTML='<p class="text-muted text-sm">No votes yet.</p>';return}if(t.innerHTML="",n.length){const s=document.createElement("p");s.className="text-xs text-muted mt-1 mb-0",s.style.cssText="font-weight:600; text-transform:uppercase; letter-spacing:0.05em",s.textContent="Distinguished Poster (attendee votes)",t.appendChild(s),t.appendChild(_(n))}if(e.length){const s=document.createElement("p");s.className="text-xs text-muted mt-1 mb-0",s.style.cssText="font-weight:600; text-transform:uppercase; letter-spacing:0.05em",s.textContent="Peer Impact Award (presenter/student votes)",t.appendChild(s),t.appendChild(_(e))}}catch{t.innerHTML='<p class="text-muted text-sm">Error loading results.</p>'}}function _(a){const t=document.createElement("table");return t.className="results-table",t.innerHTML=`
    <thead>
      <tr>
        <th>#</th>
        <th>Poster</th>
        <th>Score</th>
        <th>1st</th>
        <th>2nd</th>
        <th>3rd</th>
      </tr>
    </thead>
    <tbody>
      ${a.map((n,e)=>`
        <tr>
          <td class="results-table__rank">${e+1}</td>
          <td>
            <strong>#${n.poster_number}</strong>
            <span class="text-muted text-xs"> ${n.student_name}</span>
            <br><span class="text-sm">${n.poster_title}</span>
          </td>
          <td class="text-gold" style="font-weight:800">${n.weighted_score}</td>
          <td>${n.first_place_count}</td>
          <td>${n.second_place_count}</td>
          <td>${n.third_place_count}</td>
        </tr>
      `).join("")}
    </tbody>
  `,t}export{Q as renderAdmin};
