const t="https://bfer.land/#contact";function a(){if(document.querySelector(".demo-cta-overlay"))return;const e=document.createElement("div");e.className="demo-cta-overlay",e.innerHTML=`
    <div class="demo-cta-overlay__card">
      <h2 class="demo-cta-overlay__headline">Your event could run like this.</h2>
      <p class="demo-cta-overlay__sub">
        QR-code check-in, offline visit logging, ranked peer voting,
        live results — no email signups, no per-attendee fees.
      </p>
      <ul class="demo-cta-overlay__list">
        <li>Pre-printed cards for registered attendees &middot; on-screen QR for walk-ups</li>
        <li>Offline-first — absorbed 106 Wi-Fi flips at Spring 2026 with zero data loss</li>
        <li>Two parallel award tracks (industry panel + peer impact)</li>
        <li>Post-event spotlight that drove 43 return visitors in the following weeks</li>
      </ul>
      <div class="demo-cta-overlay__actions">
        <a class="demo-cta-overlay__primary" href="${t}" target="_blank" rel="noopener">Get in touch</a>
        <button type="button" class="demo-cta-overlay__secondary" data-action="dismiss">Keep watching</button>
      </div>
      <p class="demo-cta-overlay__footnote">Built by <a href="https://bfer.land" target="_blank" rel="noopener">Brenden Ferland</a>. NERPG replay shown in accelerated time.</p>
    </div>
  `,document.body.appendChild(e),requestAnimationFrame(()=>e.classList.add("demo-cta-overlay--visible")),e.querySelector('[data-action="dismiss"]').addEventListener("click",()=>{e.classList.remove("demo-cta-overlay--visible"),setTimeout(()=>e.remove(),250)})}export{a as showCtaOverlay};
