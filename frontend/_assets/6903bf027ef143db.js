(globalThis["webpackChunk_canva_web"] = globalThis["webpackChunk_canva_web"] || []).push([[59427],{

/***/ 248032:
function(_,__,__webpack_require__){__webpack_require__.n_x=__webpack_require__.n;const __web_req__=__webpack_require__;__web_req__(765703);globalThis._5f74ec40302898c5a55451c9fbd04240=globalThis._5f74ec40302898c5a55451c9fbd04240||{};(function(__c){var DDd;DDd=function(a,b){if(a===""||b.length===0)return[];var c=[],d=0;for(let e of b)b=a.slice(d,d+e),c.push(b),d+=e;return c};
__c.P_=class{sg({store:a,text:b,ob:c,textAlign:d,constraint:e}){var f=__c.Lva({fontFamily:a.bx,fontSize:a.fontSize,fontWeight:a.fontWeight,fontStyle:a.fontStyle},b);d={fontSize:a.fontSize,fontFamily:a.Yh,fontWeight:a.fontWeight,textAlign:d,textBaseline:"alphabetic"};a=this.Db.wa.KG(a.mc.config.ref)?.O2a()??!1;if(c==null||b!==""&&c.length===0||a){switch(e.type){case "size":c=e.maxWidth;break;case "aspectRatio":c=this.Xa.measureText({text:b,...d});if(c.width/c.height<=e.kAb)return{lines:[b],sg:[c],
lineHeight:c.fontBoundingBoxAscent+c.fontBoundingBoxDescent};c=Math.sqrt(c.width*c.height*e.lOb);break;default:throw new __c.E(e);}c=this.Db.text.YS(f,c)}f=c.length;if(f===0)return{lines:[],sg:[],lineHeight:0};b=f>1?DDd(b,c):[b];c=b.map(l=>l.trimEnd());a=this.Xa.wl({Lu:c,...d});var g=a[0].fontBoundingBoxAscent+a[0].fontBoundingBoxDescent;if(e.type!=="size"||e.maxHeight==null||f===1||g*f<=e.maxHeight)return{lines:c,sg:a,lineHeight:g};f=Math.max(0,Math.floor(e.maxHeight/g)-1);var {text:h,...k}=this.Xa.Wg({text:`${b[f]}${c[f+
1]}`,...d,maxWidth:e.maxWidth});return{lines:[...c.slice(0,f),h],sg:[...a.slice(0,f),k],lineHeight:g}}constructor(a,b){this.Xa=a;this.Db=b}};
}).call(globalThis,globalThis._5f74ec40302898c5a55451c9fbd04240);}

}])
//# sourceMappingURL=sourcemaps/6903bf027ef143db.js.map