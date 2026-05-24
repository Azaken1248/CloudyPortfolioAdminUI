import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import http from 'node:http'

const PORTFOLIO_ORIGIN = 'https://cloudy.azaken.com'
const PORTFOLIO_API = 'https://cloudyadminapi.azaken.com/api/portfolio'
const PREVIEW_PORT = 5176

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


function ogAbsoluteUrlPlugin(): Plugin {
  return {
    name: 'og-absolute-url',
    transformIndexHtml(html) {
      const siteUrl = (
        process.env.VITE_SITE_URL ||
        (process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
          : '')
      ).replace(/\/$/, '')

      if (!siteUrl) return html

      return html.replace(
        /(<meta\s[^>]*(?:property="og:image"|name="twitter:image")[^>]*content=")\/([^"]*")/g,
        `$1${siteUrl}/$2`
      )
    },
  }
}

function portfolioPreviewPlugin(): Plugin {
  return {
    name: 'portfolio-preview-proxy',
    configureServer() {
      const proxy = http.createServer(async (req, res) => {
        const path = req.url || '/'
        try {
          const resp = await fetch(`${PORTFOLIO_ORIGIN}${path}`)
          const ct = resp.headers.get('content-type') || 'application/octet-stream'
          if (ct.includes('text/html')) {
            let html = await resp.text()
            html = html.replace('<head>', '<head>' + PREVIEW_SCRIPT)
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
            res.end(html)
          } else {
            const buf = Buffer.from(await resp.arrayBuffer())
            res.writeHead(resp.status, { 'Content-Type': ct })
            res.end(buf)
          }
        } catch {
          res.writeHead(502, { 'Content-Type': 'text/plain' })
          res.end('Portfolio dev server not reachable at ' + PORTFOLIO_ORIGIN)
        }
      })
      proxy.on('error', (e: NodeJS.ErrnoException) => {
        if (e.code === 'EADDRINUSE') {
          console.warn(`[preview] Port ${PREVIEW_PORT} in use, trying ${PREVIEW_PORT + 1}`)
          proxy.listen(PREVIEW_PORT + 1)
        }
      })
      proxy.listen(PREVIEW_PORT, () => {
        console.log(`  ➜  Preview:  http://localhost:${PREVIEW_PORT}/`)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), ogAbsoluteUrlPlugin(), portfolioPreviewPlugin()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'https://cloudyadminapi.azaken.com',
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin');
          });
        },
      },
    },
  },
})
