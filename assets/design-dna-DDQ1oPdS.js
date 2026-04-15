const i=[{src:"brand/logo.png",label:"Brand mark",span:"wide"},{src:"brand/polymer-art.png",label:"Event recap cover",span:"tall"},{src:"brand/poster.png",label:"Event poster",span:"tall"},{src:"brand/checkin-card.png",label:"Check-in cards",span:"normal"},{src:"brand/nametag.png",label:"Name tags",span:"normal"},{src:"brand/ballot.png",label:"Paper ballot",span:"normal"},{src:"brand/poster-id.png",label:"Poster IDs",span:"normal"},{src:"brand/certificate.png",label:"Winner certificate",span:"wide"}];function d(a=11e3){if(document.querySelector(".design-dna"))return;const e=document.createElement("div");e.className="design-dna",e.innerHTML=`
    <div class="design-dna__backdrop"></div>
    <div class="design-dna__inner">
      <div class="design-dna__eyebrow">One brand system</div>
      <h2 class="design-dna__headline">Every piece, on purpose.</h2>
      <div class="design-dna__grid">
        ${i.map((n,r)=>`
          <figure class="design-dna__tile design-dna__tile--${n.span}" style="--i: ${r}">
            <img src="${n.src}" alt="${n.label}" loading="eager">
            <figcaption>${n.label}</figcaption>
          </figure>
        `).join("")}
      </div>
      <p class="design-dna__footer">
        I designed every pixel for NERPG. <strong>I'll design yours too.</strong>
      </p>
    </div>
  `,document.body.appendChild(e),requestAnimationFrame(()=>e.classList.add("design-dna--visible"));const s=setTimeout(()=>{e.classList.remove("design-dna--visible"),setTimeout(()=>e.remove(),600)},a);return()=>{clearTimeout(s),e.remove()}}function l(){document.querySelectorAll(".design-dna").forEach(a=>a.remove())}export{l as hideDesignDna,d as showDesignDna};
