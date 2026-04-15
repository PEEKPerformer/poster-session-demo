const c=[{src:"brand/thankyou-a.png",caption:'Florence — "12 ballots, the most of anyone." Yasmin — "highest vote conversion at the event."'},{src:"brand/thankyou-b.png",caption:'Calvin — "longest engagement time of any presenter." Mahdad — "great conversations + led building tours."'},{src:"brand/thankyou-c.png",caption:'Zhiming — "every single person who stopped by your poster voted for it."'}];function h(d=9500){if(document.querySelector(".thankyou-reel"))return;const e=document.createElement("div");e.className="thankyou-reel design-dna",e.innerHTML=`
    <div class="design-dna__backdrop"></div>
    <div class="design-dna__stage">
      <div class="design-dna__header">
        <div class="design-dna__eyebrow">Within the week after</div>
        <h2 class="design-dna__headline">Personal thank-yous. Handwritten.</h2>
      </div>
      <div class="design-dna__slides">
        ${c.map((t,n)=>`
          <figure class="design-dna__slide" data-idx="${n}">
            <div class="design-dna__frame"><img src="${t.src}" alt="Thank-you card sample ${n+1}" loading="eager"></div>
            <figcaption>${t.caption}</figcaption>
          </figure>
        `).join("")}
      </div>
      <p class="design-dna__footer">
        Every card: stats pulled from the event data + <strong>a handwritten note I add myself</strong> before it goes in the mail.
      </p>
    </div>
  `,document.body.appendChild(e),requestAnimationFrame(()=>e.classList.add("design-dna--visible"));const a=Array.from(e.querySelectorAll(".design-dna__slide")),l=e.querySelector(".design-dna__footer"),i=600,o=Math.max(1400,Math.floor((d-i-1700)/a.length)),s=[];return a.forEach((t,n)=>{const r=i+n*o;s.push(setTimeout(()=>t.classList.add("design-dna__slide--active"),r)),n>0&&s.push(setTimeout(()=>a[n-1].classList.remove("design-dna__slide--active"),r-80))}),s.push(setTimeout(()=>l.classList.add("design-dna__footer--visible"),i+a.length*o-400)),s.push(setTimeout(()=>{e.classList.remove("design-dna--visible"),setTimeout(()=>e.remove(),500)},d)),()=>{s.forEach(clearTimeout),e.remove()}}export{h as showThankYouReel};
