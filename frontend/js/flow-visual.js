/* =========================================================
   FinTrack — hero signature visual
   An animated fund-flow tree: a budget at the top, splitting
   down through implementing tiers to end workers, with pulses
   travelling the links to represent traceable, live disbursement.
   Renders into any element with id="flowStage".
   ========================================================= */
(function(){
  const stage = document.getElementById('flowStage');
  if (!stage) return;

  const W = 520, H = 520;
  const nodes = [
    { id:'gov',  x:260, y:46,  r:22, label:'Budget',        sub:'₹12.4Cr',   tier:0 },
    { id:'a',    x:120, y:196, r:16, label:'Dept A',        sub:'₹4.1Cr',    tier:1 },
    { id:'b',    x:260, y:196, r:16, label:'Dept B',        sub:'₹5.0Cr',    tier:1 },
    { id:'c',    x:400, y:196, r:16, label:'Dept C',        sub:'₹3.3Cr',    tier:1 },
    { id:'a1',   x:60,  y:340, r:11, label:'Contractor',    sub:'',          tier:2 },
    { id:'a2',   x:170, y:340, r:11, label:'Contractor',    sub:'',          tier:2 },
    { id:'b1',   x:260, y:340, r:11, label:'Institution',   sub:'',          tier:2 },
    { id:'c1',   x:350, y:340, r:11, label:'Institution',   sub:'',          tier:2 },
    { id:'c2',   x:450, y:340, r:11, label:'Contractor',    sub:'',          tier:2 },
    { id:'w1',   x:100, y:470, r:8,  label:'Worker',        sub:'',          tier:3 },
    { id:'w2',   x:220, y:470, r:8,  label:'Teacher',       sub:'',          tier:3 },
    { id:'w3',   x:330, y:470, r:8,  label:'Supplier',      sub:'',          tier:3 },
    { id:'w4',   x:430, y:470, r:8,  label:'Worker',        sub:'',          tier:3 },
  ];
  const links = [
    ['gov','a'], ['gov','b'], ['gov','c'],
    ['a','a1'], ['a','a2'], ['b','b1'], ['c','c1'], ['c','c2'],
    ['a2','w1'], ['b1','w2'], ['c1','w3'], ['c2','w4'],
  ];
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));

  function path(n1, n2){
    const midY = (n1.y + n2.y) / 2;
    return `M ${n1.x} ${n1.y} C ${n1.x} ${midY}, ${n2.x} ${midY}, ${n2.x} ${n2.y}`;
  }

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.overflow = 'visible';

  const defs = document.createElementNS(svgNS, 'defs');
  defs.innerHTML = `
    <linearGradient id="fv-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7C5CFC"/>
      <stop offset="100%" stop-color="#35E1E0"/>
    </linearGradient>
    <radialGradient id="fv-node-grad" cx="35%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#232A4E"/>
      <stop offset="100%" stop-color="#151A33"/>
    </radialGradient>
    <filter id="fv-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="3.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`;
  svg.appendChild(defs);

  const linkLayer = document.createElementNS(svgNS, 'g');
  const pulseLayer = document.createElementNS(svgNS, 'g');
  const nodeLayer = document.createElementNS(svgNS, 'g');
  svg.appendChild(linkLayer); svg.appendChild(pulseLayer); svg.appendChild(nodeLayer);

  links.forEach(([from, to], i) => {
    const n1 = byId[from], n2 = byId[to];
    const d = path(n1, n2);

    const line = document.createElementNS(svgNS, 'path');
    line.setAttribute('d', d);
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', 'rgba(124,92,252,0.22)');
    line.setAttribute('stroke-width', '1.6');
    linkLayer.appendChild(line);

    const pulse = document.createElementNS(svgNS, 'circle');
    pulse.setAttribute('r', '3.2');
    pulse.setAttribute('fill', 'url(#fv-grad)');
    pulse.setAttribute('filter', 'url(#fv-glow)');
    const anim = document.createElementNS(svgNS, 'animateMotion');
    anim.setAttribute('dur', (3.4 + (i % 4) * 0.6) + 's');
    anim.setAttribute('repeatCount', 'indefinite');
    anim.setAttribute('begin', (i * 0.35) + 's');
    anim.setAttribute('path', d);
    pulse.appendChild(anim);
    const fadeIn = document.createElementNS(svgNS, 'animate');
    fadeIn.setAttribute('attributeName', 'opacity');
    fadeIn.setAttribute('values', '0;1;1;0');
    fadeIn.setAttribute('keyTimes', '0;0.08;0.85;1');
    fadeIn.setAttribute('dur', (3.4 + (i % 4) * 0.6) + 's');
    fadeIn.setAttribute('repeatCount', 'indefinite');
    fadeIn.setAttribute('begin', (i * 0.35) + 's');
    pulse.appendChild(fadeIn);
    pulseLayer.appendChild(pulse);
  });

  nodes.forEach(n => {
    const g = document.createElementNS(svgNS, 'g');
    g.style.opacity = '0';
    g.style.animation = `fv-in .6s ease forwards`;
    g.style.animationDelay = (n.tier * 0.22) + 's';

    const ring = document.createElementNS(svgNS, 'circle');
    ring.setAttribute('cx', n.x); ring.setAttribute('cy', n.y); ring.setAttribute('r', n.r + 5);
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', n.tier === 0 ? 'rgba(53,225,224,0.35)' : 'rgba(124,92,252,0.18)');
    ring.setAttribute('stroke-width', '1');
    g.appendChild(ring);

    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', n.x); circle.setAttribute('cy', n.y); circle.setAttribute('r', n.r);
    circle.setAttribute('fill', 'url(#fv-node-grad)');
    circle.setAttribute('stroke', n.tier === 0 ? '#35E1E0' : 'rgba(255,255,255,0.15)');
    circle.setAttribute('stroke-width', n.tier === 0 ? '1.6' : '1');
    g.appendChild(circle);

    if (n.sub){
      const sub = document.createElementNS(svgNS, 'text');
      sub.setAttribute('x', n.x); sub.setAttribute('y', n.y + n.r + 30);
      sub.setAttribute('text-anchor', 'middle');
      sub.setAttribute('font-family', 'IBM Plex Mono, monospace');
      sub.setAttribute('font-size', n.tier === 0 ? '13' : '11');
      sub.setAttribute('fill', '#35E1E0');
      sub.textContent = n.sub;
      g.appendChild(sub);
    }

    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', n.x); label.setAttribute('y', n.y + n.r + (n.sub ? 16 : 18));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-family', 'Inter, sans-serif');
    label.setAttribute('font-size', n.tier === 0 ? '12.5' : '10.5');
    label.setAttribute('font-weight', n.tier === 0 ? '700' : '500');
    label.setAttribute('fill', n.tier === 0 ? '#F4F6FC' : '#8B93AC');
    label.textContent = n.label;
    g.appendChild(label);

    nodeLayer.appendChild(g);
  });

  const style = document.createElementNS(svgNS, 'style');
  style.textContent = `@keyframes fv-in{ from{opacity:0; transform:scale(0.6);} to{opacity:1; transform:scale(1);} } g{ transform-box: fill-box; transform-origin: center; }`;
  svg.appendChild(style);

  stage.appendChild(svg);
})();
