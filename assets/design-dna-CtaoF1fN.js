const c=[{src:"brand/poster.png",label:"Event poster"},{src:"brand/polymer-art.png",label:"Recap cover"},{src:"brand/checkin-card.png",label:"Check-in cards"},{src:"brand/ballot.png",label:"Award ballot"},{src:"brand/nametag.png",label:"Organizer name tags"},{src:"brand/poster-id.png",label:"Presenter poster IDs"},{src:"brand/certificate.png",label:"Winner certificate"},{src:"brand/logo.png",label:"Brand mark"}];function m(d=11e3){if(document.querySelector(".design-dna"))return;const e=document.createElement("div");e.className="design-dna",e.innerHTML=`
    <div class="design-dna__backdrop"></div>
    <div class="design-dna__stage">
      <div class="design-dna__header">
        <div class="design-dna__eyebrow">One brand system</div>
        <h2 class="design-dna__headline">Every piece, on purpose.</h2>
      </div>
      <div class="design-dna__slides">
        ${c.map((n,a)=>`
          <figure class="design-dna__slide" data-idx="${a}">
            <div class="design-dna__frame"><img src="${n.src}" alt="${n.label}" loading="eager"></div>
            <figcaption>${n.label}</figcaption>
          </figure>
        `).join("")}
      </div>
      <p class="design-dna__footer">
        I designed every pixel for NERPG. <strong>I'll design yours too.</strong>
      </p>
    </div>
  `,document.body.appendChild(e),requestAnimationFrame(()=>e.classList.add("design-dna--visible"));const i=Array.from(e.querySelectorAll(".design-dna__slide")),o=e.querySelector(".design-dna__footer"),r=700,t=Math.max(700,Math.floor((d-r-1500)/i.length)),s=[];return i.forEach((n,a)=>{const l=r+a*t;s.push(setTimeout(()=>n.classList.add("design-dna__slide--active"),l)),a>0&&s.push(setTimeout(()=>i[a-1].classList.remove("design-dna__slide--active"),l-80))}),s.push(setTimeout(()=>o.classList.add("design-dna__footer--visible"),r+i.length*t-600)),s.push(setTimeout(()=>{e.classList.remove("design-dna--visible"),setTimeout(()=>e.remove(),500)},d)),()=>{s.forEach(clearTimeout),e.remove()}}function p(){document.querySelectorAll(".design-dna").forEach(d=>d.remove())}export{p as hideDesignDna,m as showDesignDna};
