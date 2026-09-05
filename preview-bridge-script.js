/**
 * Script injected into the previewed portfolio page.
 *
 * It intercepts the portfolio's own call to the public portfolio API and answers
 * it with the admin's unsaved draft, so the preview shows pending edits without
 * anything being published.
 *
 * Shared by the Vercel function (api/preview.js) and the dev proxy in
 * vite.config.ts. It previously existed as two hand-maintained copies which had
 * already drifted — only one of them injected the <base> tag.
 *
 * @param {string} portfolioApi Absolute URL of the portfolio API endpoint.
 * @returns {string} A <script> tag to inject into <head>.
 */
export function buildPreviewScript(portfolioApi) {
  return `<script>
(function(){
  var API=${JSON.stringify(portfolioApi)};
  var _fetch=window.fetch;
  var draftData=null;
  var lastHash='';
  var pendingResolvers=[];

  window.$RefreshReg$=window.$RefreshReg$||function(){};
  window.$RefreshSig$=window.$RefreshSig$||function(){return function(t){return t}};

  function makeDraftResponse(data){
    return new Response(
      JSON.stringify({success:true,data:data}),
      {status:200,headers:{'Content-Type':'application/json'}}
    );
  }

  window.fetch=function(input,init){
    var u=typeof input==='string'?input:(input instanceof Request?input.url:'');
    if(u.indexOf(API)!==-1 && (!init || !init.method || init.method==='GET')){
      if(draftData){
        return Promise.resolve(makeDraftResponse(draftData));
      }
      return new Promise(function(resolve){
        pendingResolvers.push(resolve);
      });
    }
    return _fetch.apply(this,arguments);
  };

  function flushPending(){
    while(pendingResolvers.length){
      var resolve=pendingResolvers.shift();
      resolve(makeDraftResponse(draftData));
    }
  }

  function signalReady(){
    if(window.parent && window.parent!==window){
      window.parent.postMessage({type:'CLOUDY_PREVIEW_READY'},'*');
    }
  }

  var readyAttempts=0;
  var readyInterval=setInterval(function(){
    if(draftData||readyAttempts>20){clearInterval(readyInterval);return;}
    readyAttempts++;
    signalReady();
  },500);
  signalReady();

  window.addEventListener('message',function(e){
    // Only accept instructions from the window that framed us.
    if(e.source!==window.parent)return;
    if(!e.data||typeof e.data!=='object')return;

    if(e.data.type==='CLOUDY_PREVIEW_CLEAR'){
      draftData=null;lastHash='';pendingResolvers=[];
      window.location.reload();
      return;
    }

    if(e.data.type!=='CLOUDY_PREVIEW_UPDATE')return;
    var payload=e.data.payload;
    if(!payload||typeof payload!=='object')return;

    var newHash=JSON.stringify(payload);
    if(newHash===lastHash)return;
    lastHash=newHash;

    var isFirstData=!draftData;
    draftData=payload;
    clearInterval(readyInterval);

    if(isFirstData){
      flushPending();
    } else {
      window.location.reload();
    }
  });

})();
<\/script>`
}

/** Inject the bridge and a <base> so the portfolio's relative assets still resolve. */
export function injectPreviewBridge(html, portfolioOrigin, portfolioApi) {
  // Tolerates <head>, <head > and attributes, unlike a literal '<head>' match.
  return html.replace(
    /<head(\s[^>]*)?>/i,
    (match) => `${match}<base href="${portfolioOrigin}/" />${buildPreviewScript(portfolioApi)}`,
  )
}
