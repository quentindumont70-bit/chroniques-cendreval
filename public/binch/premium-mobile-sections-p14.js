/* La Binch P14 — compact real navigation on iPhone.
   The original navigation and its working handlers stay untouched.
   Not a new routing system; the mobile button just opens/closes original tabs.
 */
(()=>{'use strict';
 const MAX=760;
 const $=s=>document.querySelector(s);
 function init(){
  const app=$('#app'),nav=$('#app nav.nav');
  if(!app||!nav||$('#binch-p14-sections'))return;
  if(!nav.id)nav.id='binch-primary-navigation';
  const button=document.createElement('button');
  button.type='button';
  button.id='binch-p14-sections';
  button.setAttribute('aria-controls',nav.id);
  button.setAttribute('aria-expanded','false');
  button.setAttribute('aria-label','Afficher toutes les rubriques de La Binch');
  const count=nav.querySelectorAll('button[data-page]').length;
  button.textContent='☷ Toutes les rubriques · '+count;
  nav.parentNode.insertBefore(button,nav);
  nav.classList.add('p14-nav-managed');
  // The real visual editor ships as a fixed body-level control. Park its
  // *existing* button in the full navigation on phones, preserving its
  // original listener and keyboard semantics. Restore it on desktop.
  const editor=$('#binch-editor-toggle');
  const editorParent=editor?.parentElement||null;
  const editorNext=editor?.nextSibling||null;
  function placeEditor(){
   if(!editor)return;
   if(window.matchMedia('(max-width:'+MAX+'px)').matches){
    if(editor.parentElement!==nav){nav.prepend(editor);editor.classList.add('p15-nav-editor')}
   }else if(editor.parentElement===nav){
    editor.classList.remove('p15-nav-editor');
    if(editorParent?.isConnected)editorParent.insertBefore(editor,editorNext?.parentElement===editorParent?editorNext:null);
    else document.body.append(editor);
   }
  }

  // Original search palette and original OST stay fully functional: move their
  // actual DOM nodes, including attached handlers, into the mobile drawer.
  const moved=new Map();
  function placeUtility(node,cssClass,position){
   if(!node)return;
   if(compact()){
    if(node.parentElement!==nav){
     if(!moved.has(node))moved.set(node,{parent:node.parentElement,next:node.nextSibling});
     if(position==='first')nav.prepend(node);else nav.append(node);
     node.classList.add(cssClass);
    }
   }else if(node.parentElement===nav){
    node.classList.remove(cssClass);
    const original=moved.get(node),parent=original?.parent;
    if(parent?.isConnected)parent.insertBefore(node,original.next?.parentElement===parent?original.next:null);
    else document.body.append(node);
   }
  }
  function placeUtilities(){
   // Put the quick-search button first, the real editor next; OST is accessible
   // within the scrollable menu, not permanently above the artwork.
   placeUtility($('#binch-quicknav-launch'),'p16-nav-search','first');
   placeUtility($('#binch-ost'),'p16-nav-ost','last');
   // Move the original character-switch and performance-details controls too.
   // Reparenting retains their attached listeners, native details state and focus.
   placeUtility($('#app .profile-switch'),'p16-nav-switch','last');
   placeUtility($('#binch-display-comfort'),'p16-nav-comfort','last');
  }
  function compact(){return window.matchMedia('(max-width:'+MAX+'px)').matches}
  function close(refocus){
   nav.classList.remove('p14-nav-open');
   update();
   if(refocus&&compact())button.focus({preventScroll:true});
  }
  function update(){
   placeEditor();
   placeUtilities();
   const mobile=compact(),expanded=mobile&&nav.classList.contains('p14-nav-open');
   button.hidden=!mobile;
   button.setAttribute('aria-expanded',String(expanded));
   button.setAttribute('aria-label',expanded?'Masquer les rubriques de La Binch':'Afficher toutes les rubriques de La Binch');
   // Hidden links must not become invisible keyboard-focus traps.
   // CSS display:none excludes collapsed links from tab order while preserving
   // programmatic .click() from the existing bottom dock.
   if(mobile&&!expanded)nav.setAttribute('aria-hidden','true');
   else nav.removeAttribute('aria-hidden');
  }
  button.addEventListener('click',()=>{
   if(!compact())return;
   const opening=!nav.classList.contains('p14-nav-open');
   nav.classList.toggle('p14-nav-open',opening);
   update();
   if(opening)button.scrollIntoView({block:'start',behavior:'auto'});
  });
  // Existing tabs continue to navigate; close only after a real user selection
  // when our own top menu is open. Programmatic dock clicks still work.
  nav.addEventListener('click',event=>{
   if(nav.classList.contains('p14-nav-open')&&event.target.closest('button[data-page]'))close(false);
  });
  document.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&nav.classList.contains('p14-nav-open')){event.preventDefault();close(true)}
  });
  window.addEventListener('resize',()=>{
   if(!compact())nav.classList.remove('p14-nav-open');
   update();
  },{passive:true});
  update();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();