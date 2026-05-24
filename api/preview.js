const PORTFOLIO_ORIGIN = 'https://cloudy.azaken.com'
const PORTFOLIO_API = 'https://cloudyadminapi.azaken.com/api/portfolio'

const PREVIEW_SCRIPT = `<script>
(function(){
  var API='${PORTFOLIO_API}';
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
</script>`

export default async function handler(req, res) {
  const path = req.url.replace(/^\/api\/preview/, '') || '/'

  try {
    const resp = await fetch(`${PORTFOLIO_ORIGIN}${path}`)
    const ct = resp.headers.get('content-type') || 'application/octet-stream'

    if (ct.includes('text/html')) {
      let html = await resp.text()
      html = html.replace(
        '<head>',
        `<head><base href="${PORTFOLIO_ORIGIN}/" />` + PREVIEW_SCRIPT
      )
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.status(200).send(html)
    } else {
      const buf = Buffer.from(await resp.arrayBuffer())
      res.setHeader('Content-Type', ct)
      res.status(resp.status).send(buf)
    }
  } catch {
    res.status(502).send('Portfolio site not reachable at ' + PORTFOLIO_ORIGIN)
  }
}
