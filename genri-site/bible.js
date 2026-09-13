/* Local Bible quotations. No network requests or external dependencies. */
(() => {
  'use strict';
  const aliases = {
    '創':'創世記','出エジプト':'出エジプト記','出エジ':'出エジプト記','出エ':'出エジプト記','出':'出エジプト記',
    'レビ':'レビ記','民数':'民数記','申命':'申命記','ヨシュア':'ヨシュア記','士師':'士師記',
    'サムエル上':'サムエル記上','サムエル下':'サムエル記下','列王上':'列王紀上','列王下':'列王紀下',
    'ヨブ':'ヨブ記','詩篇':'詩篇','詩':'詩篇','箴言':'箴言','伝道':'伝道の書',
    'イザヤ':'イザヤ書','エレミヤ':'エレミヤ書','エゼキエル':'エゼキエル書','ダニエル':'ダニエル書',
    'ホセア':'ホセア書','ヨエル':'ヨエル書','アモス':'アモス書','ミカ':'ミカ書','マラキ':'マラキ書',
    'マタイ':'マタイによる福音書','マルコ':'マルコによる福音書','ルカ':'ルカによる福音書','ヨハネ':'ヨハネによる福音書',
    '使徒':'使徒行伝','ロマ':'ローマ人への手紙','ローマ':'ローマ人への手紙',
    'コリントⅠ':'コリント人への第一の手紙','コリントⅡ':'コリント人への第二の手紙',
    'テサロニケⅠ':'テサロニケ人への第一の手紙','テサロニケⅡ':'テサロニケ人への第二の手紙',
    'テモテⅠ':'テモテヘの第一の手紙','テモテⅡ':'テモテヘの第二の手紙',
    'エペソ':'エペソ人への手紙','ピリピ':'ピリピ人への手紙','ガラテヤ':'ガラテヤ人への手紙','ヘブル':'ヘブル人への手紙',
    'ペテロⅠ':'ペテロの第一の手紙','ペテロⅡ':'ペテロの第二の手紙','ヤコブ':'ヤコブの手紙',
    'ヨハネⅠ':'ヨハネの第一の手紙','ヨハネⅡ':'ヨハネの第二の手紙','ヨハネⅢ':'ヨハネの第三の手紙',
    'ユダ':'ユダの手紙','黙':'ヨハネの黙示録','黙示録':'ヨハネの黙示録'
  };
  const digits='〇零一二三四五六七八九';
  function number(s) {
    s=s.replace(/ニ/g,'二');
    s=s.replace(/[０-９]/g,c=>String(c.charCodeAt(0)-0xff10));
    if (/^\d+$/.test(s)) return Number(s);
    if (s.includes('百') || s.includes('十')) {
      let result=0, part=0;
      for (const c of s) {
        if(c==='十'||c==='百') {result+=(part||1)*(c==='十'?10:100);part=0;}
        else part=c==='〇'||c==='零'?0:digits.indexOf(c)-1;
      }
      return result+part;
    }
    return Number([...s].map(c=>c==='〇'||c==='零'?'0':String(digits.indexOf(c)-1)).join(''));
  }
  for(const book of Object.values(aliases)) aliases[book]=book;
  const chars='0-9０-９〇零一二ニ三四五六七八九十百';
  const n=`[${chars}]+`;
  const bookPattern=Object.keys(aliases).sort((a,b)=>b.length-a.length).join('|');
  const item=`${n}(?:[〜～~―－–—-]${n})?`;
  const pattern=new RegExp(`(?:(${bookPattern}|同)(?:書|福音書)?\\s*|(?<=[、,]))(${n})(?:[・･:：]|章)(${item}(?:[、,]${item}(?![${chars}・･:：章]))*)(?:節)?`,'g');
  function references(text) {
    let previous=null, previousEnd=0;
    return [...text.matchAll(pattern)].flatMap(m=>{
      if(!m[1] && (!previous || !/^[、,\s]+$/.test(text.slice(previousEnd,m.index)))) return [];
      const book=!m[1]||m[1]==='同'?previous:aliases[m[1]];
      if(!book) return [];
      previous=book;
      previousEnd=m.index+m[0].length;
      const verses=[];
      for(const piece of m[3].split(/[、,]/)) {
        const range=piece.split(/[〜～~―－–—-]/).map(number);
        if(range[0]<1 || (range[1]||range[0])-range[0]>200) continue;
        for(let v=range[0];v<=(range[1]||range[0]);v++) verses.push(v);
      }
      return [{label:m[0],start:m.index,end:m.index+m[0].length,book,chapter:number(m[2]),verses}];
    });
  }
  if(typeof module!=='undefined'&&module.exports) {module.exports={number,references};return;}
  const article=document.querySelector('article');
  if(!article) return;
  const all=[];
  for(const block of article.querySelectorAll('p,h1,h2')) {
    const found=references(block.textContent);
    // Reverse order keeps earlier offsets valid after wrapping a later reference.
    const indexed=found.map(ref=>{const id=all.length;all.push(ref);return {ref,id};});
    for(const {ref,id} of indexed.reverse()) {
      const walker=document.createTreeWalker(block,NodeFilter.SHOW_TEXT);
      let offset=0,startNode,endNode,startOffset,endOffset;
      while(walker.nextNode()) {
        const node=walker.currentNode, end=offset+node.length;
        if(!startNode && ref.start>=offset && ref.start<end) {startNode=node;startOffset=ref.start-offset;}
        if(ref.end>offset && ref.end<=end) {endNode=node;endOffset=ref.end-offset;break;}
        offset=end;
      }
      if(!startNode||!endNode) continue;
      const range=document.createRange();range.setStart(startNode,startOffset);range.setEnd(endNode,endOffset);
      const link=document.createElement('a');link.href='#bible';link.className='bible-reference';
      link.dataset.bibleId=id;link.setAttribute('aria-haspopup','dialog');link.setAttribute('aria-label',ref.label+'の聖書本文を読む');
      link.append(range.extractContents());range.insertNode(link);
    }
  }
  const dialog=document.createElement('dialog');dialog.className='bible-dialog';dialog.setAttribute('aria-labelledby','bible-title');
  dialog.innerHTML='<div class="bible-dialog-head"><h2 id="bible-title">聖書引用</h2><button type="button" class="bible-close" aria-label="閉じる">閉じる</button></div><div class="bible-dialog-content"></div>';
  document.body.append(dialog);
  const title=dialog.querySelector('h2'), content=dialog.querySelector('.bible-dialog-content');
  const opener=document.createElement('button');opener.type='button';opener.className='bible-menu';opener.textContent='聖書引用';opener.setAttribute('aria-haspopup','dialog');
  document.querySelector('header').append(opener);
  let returnFocus=null;
  function open() {if(!dialog.open){returnFocus=document.activeElement;dialog.showModal();} content.scrollTop=0;}
  function list() {
    title.textContent='このページの聖書引用';content.replaceChildren();
    if(!all.length){const p=document.createElement('p');p.textContent='このページには聖書引用がありません。';content.append(p);}
    const seen=new Set();
    all.forEach((ref,id)=>{
      const key=JSON.stringify([ref.book,ref.chapter,ref.verses]);if(seen.has(key))return;seen.add(key);
      const button=document.createElement('button');button.type='button';button.className='bible-list-item';button.textContent=ref.label;button.onclick=()=>show(id);content.append(button);
    });open();
  }
  function show(id) {
    const ref=all[id];if(!ref)return;
    title.textContent=ref.book+' '+ref.chapter+'章';content.replaceChildren();
    const back=document.createElement('button');back.className='bible-back';back.textContent='引用一覧';back.onclick=list;content.append(back);
    const label=document.createElement('p');label.className='bible-label';label.textContent=ref.label;content.append(label);
    for(const verse of ref.verses) {
      const p=document.createElement('p');p.className='bible-verse';
      const num=document.createElement('span');num.className='bible-verse-number';num.textContent=verse+'節';
      const text=document.createElement('span');const value=window.BIBLE_DATA?.[ref.book]?.[ref.chapter+':'+verse];
      text.textContent=value||'この節の本文は付属の聖書データに収録されていません。';if(!value)p.classList.add('bible-missing');
      p.append(num,text);content.append(p);
    }
    open();
  }
  opener.onclick=list;
  article.addEventListener('click',e=>{const link=e.target.closest('[data-bible-id]');if(link){e.preventDefault();show(Number(link.dataset.bibleId));}});
  dialog.querySelector('.bible-close').onclick=()=>dialog.close();
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>returnFocus?.focus());
})();
