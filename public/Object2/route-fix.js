(() => {
  const ACTIVE_PATH='/Object2/play.html?v=20261009-precision4';
  function joinUrl(){return `${location.origin}${ACTIVE_PATH}&room=${encodeURIComponent(room)}`}

  updateQR=function(){
    const code=document.getElementById('hostRoomCode');
    const text=document.getElementById('joinUrl');
    const box=document.getElementById('qrCode');
    if(code)code.textContent=room;
    const url=joinUrl();
    if(text)text.textContent=url;
    if(box){
      box.replaceChildren();
      if(window.QRCode)new QRCode(box,{text:url,width:230,height:230,colorDark:'#102016',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
      else box.textContent='Use room '+room;
    }
  };

  const copy=document.getElementById('copyLink');
  if(copy)copy.onclick=async()=>{
    const url=joinUrl();
    try{await navigator.clipboard.writeText(url);copy.textContent='COPIED!';setTimeout(()=>copy.textContent='COPY JOIN LINK',1400)}
    catch{prompt('Copy this join link:',url)}
  };
})();