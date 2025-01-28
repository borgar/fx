"use strict";const e="operator",t="error",n="range_beam",l="range_ternary",r="range_named",o="structured",s="unknown",u="UnaryExpression",i="BinaryExpression",c="ReferenceIdentifier",a="CallExpression",f="LetExpression";function p(e){let t=arguments.length>1&&void 0!==arguments[1]&&arguments[1],n=!1,l="";const r=[],o=()=>{l&&r.push(t?l:{value:l,braced:n}),l=""};for(let t=0;t<e.length;t++){const r=e[t];"["===r?(o(),n=!0):"]"===r?(o(),n=!1):l+=r}return o(),r}function h(e){return{context:p(e,!0)}}function g(e){const t={},n=p(e);if(n.length>1)t.workbookName=n[n.length-2].value,t.sheetName=n[n.length-1].value;else if(1===n.length){const e=n[0];e.braced?t.workbookName=e.value:t.sheetName=e.value}return t}const d=e=>e&&":"===e.value&&{},x=e=>e&&"range"===e.type&&{r0:e.value},y=e=>e&&e.type===l&&{r0:e.value},m=e=>e&&"range"===e.type&&{r1:e.value},v=t=>t&&t.type===e&&"!"===t.value&&{},$=e=>e&&e.type===n&&{r0:e.value},E=e=>e&&e.type===o&&{struct:e.value},w=(e,t)=>{const n=t.xlsx?g:h;return e&&"context"===e.type?n(e.value):e&&"context_quote"===e.type?n(e.value.slice(1,-1).replace(/''/g,"'")):void 0},R=e=>e&&e.type===r&&{name:e.value},N=[[y],[x,d,m],[x],[$],[w,v,y],[w,v,x,d,m],[w,v,x],[w,v,$]],b=N.concat([[R],[w,v,R],[E],[R,E],[w,v,R,E]]);function A(e,t){const n={withLocation:!1,mergeRefs:!1,allowTernary:!1,allowNamed:!0,r1c1:!1,xlsx:!1,...t},l=Me(e,Ce,n),r=n.xlsx?{workbookName:"",sheetName:"",r0:"",r1:"",name:""}:{context:[],r0:"",r1:"",name:""};l.length&&"fx_prefix"===l[0].type&&l.shift();const o=n.allowNamed?b:N;for(let e=0;e<o.length;e++){const t={...r};if(o[e].length===l.length){const r=o[e].every(((e,r)=>{const o=e(l[r],n);return Object.assign(t,o),o}));if(r)return t}}return null}const C=/[^0-9A-Za-z._¡¤§¨ª\u00ad¯-\uffff]/;function T(e){let t="",n=0,l=0;const r=e.context||[];for(let e=r.length;e>-1;e--){const o=r[e];if(o){t=(l%2?"["+o+"]":o)+t,n+=C.test(o),l++}}return n&&(t="'"+t.replace(/'/g,"''")+"'"),t?t+"!":t}function L(e){let t="",n=0;const{workbookName:l,sheetName:r}=e;return l&&(t+="["+l+"]",n+=C.test(l)),r&&(t+=r,n+=C.test(r)),n&&(t="'"+t.replace(/'/g,"''")+"'"),t?t+"!":t}const I=(e,t,n)=>Math.min(Math.max(t,e),n),k=(e,t)=>(t?"$":"")+F(e),O=(e,t)=>(t?"$":"")+String(e+1),_=String.fromCharCode;function U(e){const t=e||"",n=t.length;let l=0;if(n>2){const e=t.charCodeAt(n-3);l+=676*(1+e-(e>95?32:0)-65)}if(n>1){const e=t.charCodeAt(n-2);l+=26*(1+e-(e>95?32:0)-65)}if(n){const e=t.charCodeAt(n-1);l+=e-(e>95?32:0)-65}return l}function F(e){return(e>=702?_(((e-702)/676-0)%26+65):"")+(e>=26?_((e/26-1)%26+65):"")+_(e%26+65)}function S(e){let{top:t,left:n,bottom:l,right:r}=e;const{$left:o,$right:s,$top:u,$bottom:i}=e,c=null==n,a=null==r,f=null==t,p=null==l;t=I(0,0|t,1048575),n=I(0,0|n,16383),!c&&!f&&a&&p?(l=t,r=n):(l=I(0,0|l,1048575),r=I(0,0|r,16383));if(0===t&&l>=1048575&&!c&&!a&&(!(o&&!c||s&&!a)||n===r)||f&&p)return k(n,o)+":"+k(r,s);return 0===n&&r>=16383&&!f&&!p&&(!(u&&!f||i&&!p)||t===l)||c&&a?O(t,u)+":"+O(l,i):c||f||a||!p?c||!f||a||p?c||f||!a||p?!c||f||a||p?r!==n||l!==t||s!==o||i!==u?k(n,o)+O(t,u)+":"+k(r,s)+O(l,i):k(n,o)+O(t,u):k(r,s)+O(t,u)+":"+O(l,i):k(n,o)+O(t,u)+":"+O(l,i):k(n,o)+O(l,i)+":"+k(r,s):k(n,o)+O(t,u)+":"+k(r,s)}function M(e){const t=/^(?=.)(\$(?=\D))?([A-Za-z]{0,3})?(\$)?([1-9][0-9]{0,6})?$/.exec(e);return t&&(t[2]||t[4])?[t[4]?(n=t[4],+n-1):null,t[2]?U(t[2]):null,!!t[3],!!t[1]]:null;var n}function D(e){let t=null,n=null,l=null,r=null,o=!1,s=!1,u=!1,i=!1;const[c,a,f]=e.split(":");if(f)return null;const p=M(c),h=a?M(a):null;if(!p||a&&!h)return null;if(null!=p[0]&&null!=p[1]?[t,n,o,s]=p:null==p[0]&&null!=p[1]?[,n,,s]=p:null!=p[0]&&null==p[1]&&([t,,o]=p),a)null!=h[0]&&null!=h[1]?[l,r,u,i]=h:null==h[0]&&null!=h[1]?[,r,,i]=h:null!=h[0]&&null==h[1]&&([l,,u]=h);else{if(null==t||null==n)return null;l=t,r=n,u=o,i=s}return null!=r&&(null==n||null!=n&&r<n)&&([n,r,s,i]=[r,n,i,s]),null!=l&&(null==t||null!=t&&l<t)&&([t,l,o,u]=[l,t,u,o]),{top:t,left:n,bottom:l,right:r,$top:o,$left:s,$bottom:u,$right:i}}function z(e){let{allowNamed:t=!0,allowTernary:n=!1,xlsx:l=!1}=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};const r=A(e,{allowNamed:t,allowTernary:n,xlsx:l,r1c1:!1});if(r&&(r.r0||r.name)){let e=null;return r.r0&&(e=D(r.r1?r.r0+":"+r.r1:r.r0)),r.name||e?(r.range=e,delete r.r0,delete r.r1,r):null}return null}function j(e){let{xlsx:t=!1}=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};const n=t?L(e):T(e);return n+(e.name?e.name:S(e.range))}function B(e){return null==e.top&&(e.top=0,e.$top=!1),null==e.bottom&&(e.bottom=1048575,e.$bottom=!1),null==e.left&&(e.left=0,e.$left=!1),null==e.right&&(e.right=16383,e.$right=!1),e}const Z=/^\[('['#@[\]]|[^'#@[\]])+\]/i,q=/^([^#@[\]:]+)/i,P={headers:1,data:2,totals:4,all:8,"this row":16,"@":16},X=function(){for(var e=arguments.length,t=new Array(e),n=0;n<e;n++)t[n]=arguments[n];return Object.freeze(t)},W={0:X(),1:X("headers"),2:X("data"),4:X("totals"),8:X("all"),16:X("this row"),3:X("headers","data"),6:X("data","totals")},H=function(e){let t=!(arguments.length>1&&void 0!==arguments[1])||arguments[1],n=Z.exec(e);if(n){const e=n[0].slice(1,-1).replace(/'(['#@[\]])/g,"$1");return[n[0],e]}return t&&(n=q.exec(e),n)?[n[0],n[0]]:null};function Y(e){const t=[];let n,l,r=0,o=e,s=0;if(!(n=/^(\[\s*)/.exec(o)))return null;if(l=/^\[#([a-z ]+)\]/i.exec(o)){const e=l[1].toLowerCase();if(r+=l[0].length,!P[e])return null;s|=P[e]}else if(l=H(o,!1))r+=l[0].length,t.push(l[1]);else{let l=!0;for(o=o.slice(n[1].length),r+=n[1].length;l&&(n=/^\[#([a-z ]+)\](\s*,\s*)?/i.exec(o));){const e=n[1].toLowerCase();if(!P[e])return null;s|=P[e],o=o.slice(n[0].length),r+=n[0].length,l=!!n[2]}if(l&&(n=/^@/.exec(o))&&(s|=P["@"],o=o.slice(1),r+=1,l="]"!==o[0]),!(s in W))return null;const u=l?H(e.slice(r)):null;if(u){if(r+=u[0].length,t.push(u[1]),o=e.slice(r),":"===o[0]){o=o.slice(1),r++;const e=H(o);if(!e)return null;r+=e[0].length,t.push(e[1])}l=!1}for(;" "===e[r];)r++;if(l||"]"!==e[r])return null;r++}const u=W[s];return{columns:t,sections:u?u.concat():u,length:r,token:e.slice(0,r)}}function G(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{xlsx:!1};const n=A(e,t);if(n&&n.struct){const e=Y(n.struct);if(e&&e.length===n.struct.length)return t.xlsx?{workbookName:n.workbookName,sheetName:n.sheetName,table:n.name,columns:e.columns,sections:e.sections}:{context:n.context,table:n.name,columns:e.columns,sections:e.sections}}return null}function K(e){return e.replace(/([[\]#'@])/g,"'$1")}function V(e){return!/^[a-zA-Z0-9\u00a1-\uffff]+$/.test(e)}function Q(e){return e[0].toUpperCase()+e.slice(1).toLowerCase()}function J(e){let{xlsx:t=!1}=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},n=t?L(e):T(e);e.table&&(n+=e.table);const l=e.columns?.length??0,r=e.sections?.length??0;if(1!==r||l)if(r||1!==l){n+="[";const t=1===r&&"this row"===e.sections[0].toLowerCase();t?n+="@":r&&(n+=e.sections.map((e=>`[#${Q(e)}]`)).join(","),l&&(n+=",")),t&&1===e.columns.length&&!V(e.columns[0])?n+=K(e.columns[0]):l&&(n+=e.columns.slice(0,2).map((e=>`[${K(e)}]`)).join(":")),n+="]"}else n+=`[${K(e.columns[0])}]`;else n+=`[#${Q(e.sections[0])}]`;return n}const ee=/^(?!!)(\[(?:[^\]])+\])?([0-9A-Za-z._¡¤§¨ª\u00ad¯-\uffff]+)?(?=!)/,te=/^'(?:''|[^'])*('|$)(?=!)/,ne="\\$?[A-Z]{1,3}\\$?[1-9][0-9]{0,6}",le="\\$?[A-Z]{1,3}",re="\\$?[1-9][0-9]{0,6}",oe="(?![a-z0-9_\\u00a1-\\uffff])",se=new RegExp(`^${le}:${le}${oe}`,"i"),ue=new RegExp(`^${re}:${re}${oe}`,"i"),ie=new RegExp(`^${ne}${oe}`,"i"),ce=new RegExp(`^((${le}|${re}):${ne}|${ne}:(${le}|${re}))(?![\\w($.])`,"i"),ae="(?:R(?:\\[[+-]?\\d+\\]|[1-9][0-9]{0,6})?)",fe="(?:C(?:\\[[+-]?\\d+\\]|[1-9][0-9]{0,4})?)",pe=new RegExp(`^${fe}(:${fe})?${oe}`,"i"),he=new RegExp(`^${ae}(:${ae})?${oe}`,"i"),ge=new RegExp(`^(?:(?=[RC])${ae}${fe})${oe}`,"i"),de=new RegExp(`^(${ae}${fe}(:${fe}|:${ae})(?![[\\d])|(${ae}|${fe})(:${ae}${fe}))${oe}`,"i"),xe=/^[a-zA-Z\\_\u00a1-\uffff][a-zA-Z0-9\\_.?\u00a1-\uffff]{0,254}/i;function ye(e,t){return n=>{const l=t.exec(n);if(l)return{type:e,value:l[0]}}}function me(e){const t=xe.exec(e);if(t){const e=t[0].toLowerCase();return"\\"===e[0]&&t[0].length<3||("r"===e||"c"===e)?null:{type:r,value:t[0]}}}const ve=/^'(?:[^[\]]+?)?(?:\[(.+?)\])?(?:[^[\]]+?)'$/,$e=/^'\[(.+?)\]'$/;function Ee(e,t){const n=te.exec(e);if(n){const e=n[0];if(t.xlsx&&$e.test(e)||ve.test(e))return{type:"context_quote",value:e}}const l=ee.exec(e);if(l){const[,e,n]=l;if(e&&n||n||e&&!n&&t.xlsx)return{type:"context",value:l[0]}}}function we(e){const t=Y(e);if(t){let n=t.length;for(;" "===e[n];)n++;if("!"!==e[n])return{type:o,value:t.token}}return null}const Re=/([RC])(\[?)(-?\d+)/gi,Ne=/(\d+|[a-zA-Z]+)/gi;function be(e,t){let r,o;if(t.r1c1){if(t.allowTernary&&(r=de.exec(e))?o={type:l,value:r[0]}:(r=ge.exec(e))?o={type:"range",value:r[0]}:((r=he.exec(e))||(r=pe.exec(e)))&&(o={type:n,value:r[0]}),o){for(Re.lastIndex=0;null!==(r=Re.exec(o.value));){const e=("R"===r[1]?1048575:16383)+(r[2]?0:1),t=parseInt(r[3],10);if(t>e||t<-e)return null}return o}}else if(t.allowTernary&&(r=ce.exec(e))?o={type:l,value:r[0]}:(r=se.exec(e))||(r=ue.exec(e))?o={type:n,value:r[0]}:(r=ie.exec(e))&&(o={type:"range",value:r[0]}),o){for(Ne.lastIndex=0;null!==(r=Ne.exec(o.value));)if(/^\d/.test(r[1])){if(parseInt(r[1],10)-1>1048575)return null}else if(U(r[1])>16383)return null;return o}}const Ae=[ye(t,/^#(NAME\?|FIELD!|CALC!|VALUE!|REF!|DIV\/0!|NULL!|NUM!|N\/A|GETTING_DATA\b|SPILL!|UNKNOWN!|FIELD\b|CALC\b|SYNTAX\?|ERROR!|CONNECT!|BLOCKED!|EXTERNAL!)/i),ye(e,/^(<=|>=|<>|[-+/*^%&<>=]|[{},;]|[()]|@|:|!|#)/),ye("func",/^[A-Z_]+[A-Z\d_.]*(?=\()/i),ye("bool",/^(TRUE|FALSE)\b/i),ye("newline",/^\n+/),ye("whitespace",/^[ \f\r\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/),ye("string",/^"(?:""|[^"])*("|$)/),Ee,be,we,ye("number",/^(?:\d+(\.\d+)?(?:[eE][+-]?\d+)?|\d+)/),me],Ce=[function(t,n){return n.r1c1?"!"===t[0]?{type:e,value:t[0]}:null:"!"===t[0]||":"===t[0]?{type:e,value:t[0]}:null},Ee,be,we,me],Te={};function Le(e,t){if(e.length){const n=e[0];t[n]=t[n]||{},Le(e.slice(1),t[n])}else t.$=!0}[["range",":","range"],["range"],[n],[l],["context","!","range",":","range"],["context","!","range"],["context","!",n],["context","!",l],["context_quote","!","range",":","range"],["context_quote","!","range"],["context_quote","!",n],["context_quote","!",l],[r],["context","!",r],["context_quote","!",r],[o],[r,o],["context","!",r,o],["context_quote","!",r,o]].forEach((e=>Le(e.concat().reverse(),Te)));const Ie=function(t,n,l){let r=arguments.length>3&&void 0!==arguments[3]?arguments[3]:0;const o=t[l-r];if(o){const s=o.type===e?o.value:o.type;if(s in n)return Ie(t,n[s],l,r+1)}return n.$?r:0};function ke(e){const t=[];for(let n=e.length-1;n>=0;n--){let l=e[n];const r=Ie(e,Te,n);if(r){const t=e.slice(n-r+1,n+1);l={...l},l.value=t.map((e=>e.value)).join(""),l.loc&&t[0].loc&&(l.loc[0]=t[0].loc[0]),n-=r-1}t.unshift(l)}return t}const Oe=(e,t)=>e&&e.type===t,_e={withLocation:!1,mergeRefs:!0,allowTernary:!1,negativeNumbers:!0,r1c1:!1},Ue=e=>e.type===r||"func"===e.type,Fe=t=>!Oe(t,e)||"%"===t.value||"}"===t.value||")"===t.value||"#"===t.value;function Se(t){let n,l=0,o=0;for(const u of t){if(u.type===e)if("("===u.value){if(o++,"func"===n.type){const e=n.value.toLowerCase();"lambda"!==e&&"let"!==e||(l=o)}}else")"===u.value&&(o--,o<l&&(l=0));else l&&u.type===s&&/^[rc]$/.test(u.value)&&(u.type=r);n=u}return t}function Me(t,n){let l=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};const r=Object.assign({},_e,l),{withLocation:o,mergeRefs:u,negativeNumbers:i}=r,c=[];let a=0,f=0,p=0,h=null,g=null,d=null;const x=e=>{const t=e.type===s,n=d&&d.type===s;d&&(t&&n||t&&Ue(d)||n&&Ue(e))?(d.value+=e.value,d.type=s,o&&(d.loc[1]=e.loc[1])):(c.push(e),d=e,"whitespace"!==e.type&&"newline"!==e.type&&(g=h,h=e))};if(/^=/.test(t)){a++,x({type:"fx_prefix",value:"=",...o?{loc:[0,1]}:{}})}for(;a<t.length;){const l=a,u=t.slice(a);let y="",m="";for(let e=0;e<n.length;e++){const t=n[e](u,r);if(t){y=t.type,m=t.value,a+=m.length;break}}y||(y=s,m=t[a],a++);const v={type:y,value:m,...o?{loc:[l,a]}:{}};if(d&&"func"===d.type&&"("===m){const e=d.value.toLowerCase();"lambda"!==e&&"let"!==e||f++}if(y===s){const e=m.toLowerCase();p+="r"===e||"c"===e?1:0}if("string"===y){const e=m.length;if('""'===m);else if('"'===m||'"'!==m[e-1])v.unterminated=!0;else if('""'!==m&&'"'===m[e-2]){let t=e-1;for(;'"'===m[t];)t--;!(t+1)^(e-t+1)%2==0&&(v.unterminated=!0)}}if(i&&"number"===y){const t=d;if(t&&Oe(t,e)&&"-"===t.value&&(!g||Oe(g,"fx_prefix")||!Fe(g))){const e=c.pop();v.value="-"+m,o&&(v.loc[0]=e.loc[0]),h=g,d=c[c.length-1]}}x(v)}return p&&f&&Se(c),u?ke(c):c}function De(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return Me(e,Ae,t)}function ze(e){return!!e&&("range"===e.type||e.type===n||e.type===l)}function je(e){return!!e&&("range"===e.type||e.type===n||e.type===l||e.type===o||e.type===r)}function Be(e){return!!e&&("bool"===e.type||e.type===t||"number"===e.type||"string"===e.type)}function Ze(e){return!!e&&e.type===t}function qe(e){return!!e&&("whitespace"===e.type||"newline"===e.type)}function Pe(e){return!!e&&"func"===e.type}function Xe(e){return!!e&&"fx_prefix"===e.type}function We(t){return!!t&&t.type===e}const He="(END)",Ye=["ANCHORARRAY","CHOOSE","DROP","IF","IFS","INDEX","INDIRECT","LAMBDA","LET","OFFSET","REDUCE","SINGLE","SWITCH","TAKE","XLOOKUP"],Ge=e=>Ye.includes(e.toUpperCase()),Ke=function(e){let t=arguments.length>1&&void 0!==arguments[1]&&arguments[1];const n=(e&&e.value)+"";return!!je(e)||(!(!t||!We(e)||":"!==n&&","!==n&&n.trim())||(!(!Pe(e)||!Ge(n))||!(!Ze(e)||"#REF!"!==n)))},Ve=e=>!!e&&(e.type===c||("ErrorLiteral"===e.type||e.type===t)&&"#REF!"===e.value||e.type===i&&(":"===e.operator||" "===e.operator||","===e.operator)||je(e)||e.type===a&&Ge(e.callee.name)),Qe={};let Je,et,tt,nt=!1,lt=!1;function rt(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null;const n=new Error(e);throw n.source=et.map((e=>e.value)).join(""),n.sourceOffset=et.slice(0,t??tt).reduce(((e,t)=>e+t.value.length),0),n}function ot(){let e,t=arguments.length>0&&void 0!==arguments[0]&&arguments[0],n=tt;do{e=et[++n]}while(e&&(qe(e)||We(e)&&"("===e.value));return Ke(e,t)}function st(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null,t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null;if(e&&e!==Je.id&&rt(`Expected ${e} but got ${Je.id}`),qe(et[tt])){const e=Ve(t),n=e&&ot(!1),l=e&&"("===et[tt+1].value;if(!n&&!l)for(;qe(et[tt]);)tt++}if(tt>=et.length)return void(Je=Qe[He]);const n=et[tt];let l;return tt+=1,n.unterminated&&rt("Encountered an unterminated token"),We(n)?(l=Qe[n.value],l||rt(`Unknown operator ${n.value}`)):qe(n)?l=Qe["(WHITESPACE)"]:Be(n)?l=Qe.Literal:je(n)?l=Qe[c]:Pe(n)?l=Qe["(FUNCTION)"]:rt(`Unexpected ${n.type} token: ${n.value}`),Je=Object.create(l),Je.type=n.type,Je.value=n.value,n.loc&&(Je.loc=[...n.loc]),Je}function ut(e){let t=Je;st(null,t);let n=t.nud();for(;e<Je.lbp;)t=Je,st(null,t),n=t.led(n);return n}const it={nud:()=>rt("Invalid syntax"),led:()=>rt("Missing operator")};function ct(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,n=Qe[e];return n?t>=n.lbp&&(n.lbp=t):(n={...it},n.id=e,n.value=e,n.lbp=t,Qe[e]=n),n}function at(e,t,n){const l=ct(e,t);return l.led=n||function(e){this.type=i,this.operator=this.value,delete this.value;const n=ut(t);return this.arguments=[e,n],this.loc&&(this.loc=[e.loc[0],n.loc[1]]),this},l}function ft(e,t){const n=ct(e,0);return n.lbp=70,n.led=t||function(e){return this.type=u,this.operator=this.value,delete this.value,this.arguments=[e],this.loc&&(this.loc[0]=e.loc[0]),this},n}function pt(e,t){const n=ct(e);return n.nud=t||function(){this.type=u,this.operator=this.value,delete this.value;const e=ut(70);return this.arguments=[e],this.loc&&(this.loc[1]=e.loc[1]),this},n}function ht(e,t){return at(e,t,(function(n){Ve(n)||rt(`Unexpected ${e} operator`);const l=ut(t);return Ve(l)||rt(`Unexpected ${Je.type} following ${this.id}`),this.type=i,this.operator=this.value.trim()?this.value:" ",delete this.value,this.arguments=[n,l],this.loc&&(this.loc=[n.loc[0],l.loc[1]]),this}))}ct(He),ht(":",80);const gt=ht(",",80);ht("(WHITESPACE)",80);const dt=e=>{const t=gt.lbp>0;return null!=e&&(gt.lbp=e?80:0),t};function xt(e){const t=[],n={};let l,r=!1;const o=dt(!1);if(")"!==Je.id)for(;!r;){qe(Je)&&st();const e=tt,o=ut(0);if(","===Je.id){if(o.type===c&&"name"===o.kind){const e=o.value.toLowerCase();e in n&&rt("Duplicate name: "+o.value),n[e]=1;const l={type:"Identifier",name:o.value};o.loc&&(l.loc=o.loc),t.push(l)}else tt=e,rt("LAMBDA argument is not a name");st(",")}else l=o,r=!0}return dt(o),delete this.value,this.type="LambdaExpression",this.params=t,this.body=l||null,e.loc&&(this.loc=[e.loc[0],Je.loc[1]]),st(")",this),this}function yt(e){const t=[],n=[],l={};let r,o=0;const s=(e,s)=>{if(r&&rt("Unexpected argument following calculation"),s&&o>=2)r=e;else{if(!(o%2))if(e&&e.type===c&&"name"===e.kind){const n=e.value.toLowerCase();n in l&&rt("Duplicate name: "+e.value),l[n]=1,t.push({type:"Identifier",name:e.value,loc:e.loc})}else o>=2?r=e:rt("Argument is not a name");else n.push(e)}o++},u=dt(!1);let i=!1;if(")"!==Je.id){for(;")"!==Je.id;)if(qe(Je)&&st(),","===Je.id)s(null),i=!0,st();else{s(ut(0),","!==Je.id),i=!1,","===Je.id&&(st(","),i=!0)}dt(u)}i&&s(null,!0),void 0===r&&rt("Unexpected end of arguments"),dt(u),delete this.value,this.type=f,this.declarations=[],t.length||rt("Unexpected end of arguments");for(let e=0;e<t.length;e++){const l={type:"LetDeclarator",id:t[e],init:n[e],loc:t[e].loc&&[t[e].loc[0],n[e].loc[1]]};this.declarations.push(l)}return this.body=r,e.loc&&(this.loc=[e.loc[0],Je.loc[1]]),st(")",this),this}function mt(){let e=1;return()=>"fxg"+e++}function vt(e,t){return null==e&&null==t||e===t}function $t(e,t){if(Array.isArray(e)!==Array.isArray(t)||e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(!vt(e[n],t[n]))return!1;return!0}function Et(e,t){return!e&&!t||String(e).toLowerCase()===String(t).toLowerCase()}function wt(e,t){if((e.name||t.name)&&e.name!==t.name)return!1;if(e.columns||t.columns){if(e.table!==t.table)return!1;if(!$t(e.columns,t.columns))return!1;if(!$t(e.sections,t.sections))return!1}return!!(!e.range&&!t.range||vt(e.range.top,t.range.top)&&vt(e.range.bottom,t.range.bottom)&&vt(e.range.left,t.range.left)&&vt(e.range.right,t.range.right))&&!(!Et(e.workbookName,t.workbookName)||!Et(e.sheetName,t.sheetName))}function Rt(e,t,n){return e.sheetName||(e.sheetName=t),e.workbookName||(e.workbookName=n),e}ft("%"),ft("#",(function(e){return Ve(e)||rt("# expects a reference"),this.type=u,this.operator=this.value,delete this.value,this.arguments=[e],this})),pt("+"),pt("-"),pt("@"),at("^",50),at("*",40),at("/",40),at("+",30),at("-",30),at("&",20),at("=",10),at("<",10),at(">",10),at("<=",10),at(">=",10),at("<>",10),ct("Literal").nud=function(){const{type:e,value:n}=this;if(this.type="Literal",this.raw=n,"number"===e)this.value=+n;else if("bool"===e)this.value="TRUE"===n.toUpperCase();else if(e===t)this.type="ErrorLiteral",this.value=n.toUpperCase();else{if("string"!==e)throw new Error("Unsupported literal type: "+e);this.value=n.slice(1,-1).replace(/""/g,'"')}return this},ct(c).nud=function(){return this.type===r?this.kind="name":this.type===o?this.kind="table":this.type===n?this.kind="beam":this.kind="range",this.type=c,this},ct(")"),pt("(",(function(){const e=dt(!0),t=ut(0);return st(")",t),dt(e),t})),ct("(FUNCTION)").nud=function(){return this},at("(",90,(function(e){let t={type:"Identifier",name:e.value};"(FUNCTION)"!==e.id&&("LambdaExpression"===e.type||e.type===a||e.type===f||e.type===c||e.type===u&&"#"===e.value||"ErrorLiteral"===e.type&&"#REF!"===e.value?t=e:rt("Unexpected call",tt-1));const n=e.value.toLowerCase();if("lambda"===n)return xt.call(this,e);if("let"===n)return yt.call(this,e);const l=[];let r=!1;if(")"!==Je.id){const e=dt(!1);for(;")"!==Je.id;)if(qe(Je)&&st(),","===Je.id)l.push(null),r=!0,st();else{const e=ut(0);l.push(e),r=!1,","===Je.id&&(st(","),r=!0)}dt(e)}r&&l.push(null);const o=Je;return delete this.value,this.type=a,this.callee=t,e.loc&&(this.callee.loc=[...e.loc]),this.arguments=l,e.loc&&(this.loc=[e.loc[0],o.loc[1]]),st(")",this),this})),ct("}"),ct(";"),pt("{",(function(){"}"===Je.id&&rt("Unexpected empty array");let e=[],t=!1;const n=[e],l=dt(!1);for(;!t;){if(qe(Je)&&st(),Be(Je))e.push(Qe.Literal.nud.call(Je)),st();else if(nt&&Ve(Je))e.push(Qe[c].nud.call(Je)),st();else if(lt&&Pe(Je)){const t=ut(0);e.push(t)}else rt(`Unexpected ${Je.type} in array: ${Je.value}`);","===Je.id?st(","):";"===Je.id?(st(";"),e=[],n.push(e)):t=!0}const r=Je;return st("}"),dt(l),this.type="ArrayExpression",this.elements=n,this.loc&&(this.loc[1]=r.loc[1]),delete this.value,this}));const Nt=(e,t,n)=>Math.min(Math.max(t,e),n);function bt(e,t){return t?String(e+1):e?"["+e+"]":""}function At(e){let{r0:t,c0:n,r1:l,c1:r}=e;const{$c0:o,$c1:s,$r0:u,$r1:i}=e,c=null==t,a=null==n;let f=null==l,p=null==r;t=Nt(u?0:-1048575,0|t,1048575),n=Nt(o?0:-16383,0|n,16383),!c&&f&&!a&&p?(l=t,f=!1,r=n,p=!1):(l=Nt(i?0:-1048575,0|l,1048575),r=Nt(s?0:-16383,0|r,16383));if(0===t&&l>=1048575&&!a&&!p||c&&f){const e=bt(n,o),t=bt(r,s);return"C"+(e===t?e:e+":C"+t)}if(0===n&&r>=16383&&!c&&!f||a&&p){const e=bt(t,u),n=bt(l,i);return"R"+(e===n?e:e+":R"+n)}const h=bt(t,u),g=bt(l,i),d=bt(n,o),x=bt(r,s);return c||f||a||p?(c?"":"R"+h)+(a?"":"C"+d)+":"+(f?"":"R"+g)+(p?"":"C"+x):h!==g||d!==x?"R"+h+"C"+d+":R"+g+"C"+x:"R"+h+"C"+d}function Ct(e){let t=null,n=null,l=null,r=null;const o=/^R(?:\[([+-]?\d+)\]|(\d+))?/.exec(e);o&&(o[1]?(t=parseInt(o[1],10),l=!1):o[2]?(t=parseInt(o[2],10)-1,l=!0):(t=0,l=!1),e=e.slice(o[0].length));const s=/^C(?:\[([+-]?\d+)\]|(\d+))?/.exec(e);return s&&(s[1]?(n=parseInt(s[1],10),r=!1):s[2]?(n=parseInt(s[2],10)-1,r=!0):(n=0,r=!1),e=e.slice(s[0].length)),!o&&!s||e.length?null:[t,n,l,r]}function Tt(e){let t=null;const[n,l]=e.split(":",2),r=Ct(n);if(r){const[e,n,o,s]=r;if(!l)return null!=e&&null==n?{r0:e,c0:null,r1:e,c1:null,$r0:o,$c0:!1,$r1:o,$c1:!1}:null==e&&null!=n?{r0:null,c0:n,r1:null,c1:n,$r0:!1,$c0:s,$r1:!1,$c1:s}:{r0:e||0,c0:n||0,r1:e||0,c1:n||0,$r0:o||!1,$c0:s||!1,$r1:o||!1,$c1:s||!1};{const r=Ct(l);if(!r)return null;{t={};const[l,u,i,c]=r;null!=e&&null!=l?(t.r0=o===i?Math.min(e,l):e,t.$r0=o,t.r1=o===i?Math.max(e,l):l,t.$r1=i):null!=e&&null==l?(t.r0=e,t.$r0=o,t.r1=null,t.$r1=o):null==e&&null!=l?(t.r0=l,t.$r0=i,t.r1=null,t.$r1=i):null==e&&null==l&&(t.r0=null,t.$r0=!1,t.r1=null,t.$r1=!1),null!=n&&null!=u?(t.c0=s===c?Math.min(n,u):n,t.$c0=s,t.c1=s===c?Math.max(n,u):u,t.$c1=c):null!=n&&null==u?(t.c0=n,t.$c0=s,t.c1=null,t.$c1=s):null==n&&null!=u?(t.c0=u,t.$c0=c,t.c1=null,t.$c1=c):null==n&&null==u&&(t.c0=null,t.$c0=!1,t.c1=null,t.$c1=!1)}}}return t}function Lt(e){let{allowNamed:t=!0,allowTernary:n=!1,xlsx:l=!1}=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};const r=A(e,{allowNamed:t,allowTernary:n,xlsx:l,r1c1:!0});if(r&&(r.r0||r.name)){const e=r.r1?Tt(r.r0+":"+r.r1):Tt(r.r0);return r.name||e?(r.range=e,delete r.r0,delete r.r1,r):null}return null}function It(e){let{xlsx:t=!1}=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};const n=t?L(e):T(e);return n+(e.name?e.name:At(e.range))}const kt=(e,t,n)=>null==t?null:e?t:t-n,Ot={withLocation:!1,mergeRefs:!1,allowTernary:!0,r1c1:!1};function _t(e,t,n,l){let r=!(arguments.length>4&&void 0!==arguments[4])||arguments[4],o=e;if(null!=o&&!t){if(o=n+e,o<0){if(!r)return NaN;o=l+o+1}if(o>l){if(!r)return NaN;o-=l+1}}return o}const Ut={wrapEdges:!0,mergeRefs:!0,allowTernary:!0,xlsx:!1};const Ft=Object.freeze({OPERATOR:e,BOOLEAN:"bool",ERROR:t,NUMBER:"number",FUNCTION:"func",NEWLINE:"newline",WHITESPACE:"whitespace",STRING:"string",CONTEXT:"context",CONTEXT_QUOTE:"context_quote",REF_RANGE:"range",REF_BEAM:n,REF_TERNARY:l,REF_NAMED:r,REF_STRUCT:o,FX_PREFIX:"fx_prefix",UNKNOWN:s}),St=Object.freeze({UNARY:u,BINARY:i,REFERENCE:c,LITERAL:"Literal",ERROR:"ErrorLiteral",CALL:a,ARRAY:"ArrayExpression",IDENTIFIER:"Identifier"});exports.MAX_COLS=16383,exports.MAX_ROWS=1048575,exports.addA1RangeBounds=B,exports.addTokenMeta=function(e){let{sheetName:t="",workbookName:r=""}=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};const u=[];let i=null;const c=mt(),a=[],f=()=>u.length+(i?1:0);return e.forEach(((e,p)=>{if(e.index=p,e.depth=f(),"("===e.value)u.push(e),e.depth=f();else if(")"===e.value){const t=u.pop();if(t){const n=c();e.groupId=n,e.depth=t.depth,t.groupId=n}else e.error=!0}else if("{"===e.value)i?e.error=!0:(i=e,e.depth=f());else if("}"===e.value){if(i){const t=c();e.groupId=t,e.depth=i.depth,i.groupId=t}else e.error=!0;i=null}else if("range"===e.type||e.type===n||e.type===l||e.type===o){const n=e.type===o?G(e.value,{allowTernary:!0,xlsx:!0}):z(e.value,{allowTernary:!0,xlsx:!0});if(n&&(n.range||n.columns)){n.source=e.value,Rt(n,t,r);const l=a.find((e=>wt(e,n)));l?e.groupId=l.groupId:(n.groupId=c(),e.groupId=n.groupId,a.push(n))}}else e.type===s&&(e.error=!0)})),e},exports.fixRanges=function e(t){let n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{addBounds:!1};if("string"==typeof t)return e(De(t,n),n).map((e=>e.value)).join("");if(!Array.isArray(t))throw new Error("fixRanges expects an array of tokens");const{addBounds:l,r1c1:r,xlsx:s}=n;if(r)throw new Error("fixRanges does not have an R1C1 mode");let u=0;return t.map((e=>{const t={...e};e.loc&&(t.loc=[...e.loc]);let n=0;if(t.type===o){const e=J(G(t.value,{xlsx:s}),{xlsx:s});n=e.length-t.value.length,t.value=e}else if(ze(t)){const e=z(t.value,{xlsx:s,allowTernary:!0}),r=e.range;l&&B(r);const o=j(e,{xlsx:s});n=o.length-t.value.length,t.value=o}return u||n?(t.loc&&(t.loc[0]+=u),u+=n,t.loc&&(t.loc[1]+=u)):u+=n,t}))},exports.fromCol=U,exports.isError=Ze,exports.isFunction=Pe,exports.isFxPrefix=Xe,exports.isLiteral=Be,exports.isOperator=We,exports.isRange=ze,exports.isReference=je,exports.isWhitespace=qe,exports.mergeRefTokens=ke,exports.nodeTypes=St,exports.parse=function(e,t){if("string"==typeof e)et=De(e,{withLocation:!1,...t,mergeRefs:!0});else{if(!Array.isArray(e))throw new Error("Parse requires a string or array of tokens.");et=e}for(nt=t?.permitArrayRanges,lt=t?.permitArrayCalls,tt=0;qe(et[tt])||Xe(et[tt]);)tt++;st(),dt(!0);const n=ut(0);return st(He),n},exports.parseA1Ref=z,exports.parseR1C1Ref=Lt,exports.parseStructRef=G,exports.stringifyA1Ref=j,exports.stringifyR1C1Ref=It,exports.stringifyStructRef=J,exports.toCol=F,exports.tokenTypes=Ft,exports.tokenize=De,exports.translateToA1=function(e,n){let l=arguments.length>2&&void 0!==arguments[2]?arguments[2]:Ut;const r=D(n),o="string"==typeof e,s={...Ut,...l},u=o?De(e,{withLocation:!1,mergeRefs:s.mergeRefs,xlsx:s.xlsx,allowTernary:s.allowTernary,r1c1:!0}):e;let i=0;const c={xlsx:s.xlsx,allowTernary:s.allowTernary};return u.forEach((e=>{if(ze(e)){const n=e.value,l=Lt(n,c),o=l.range,u={},a=_t(o.r0,o.$r0,r.top,1048575,s.wrapEdges),f=_t(o.r1,o.$r1,r.top,1048575,s.wrapEdges);a>f?(u.top=f,u.$top=o.$r1,u.bottom=a,u.$bottom=o.$r0):(u.top=a,u.$top=o.$r0,u.bottom=f,u.$bottom=o.$r1);const p=_t(o.c0,o.$c0,r.left,16383,s.wrapEdges),h=_t(o.c1,o.$c1,r.left,16383,s.wrapEdges);p>h?(u.left=h,u.$left=o.$c1,u.right=p,u.$right=o.$c0):(u.left=p,u.$left=o.$c0,u.right=h,u.$right=o.$c1),isNaN(a)||isNaN(f)||isNaN(p)||isNaN(h)?(e.type=t,e.value="#REF!",delete e.groupId):(l.range=u,e.value=j(l,c)),e.loc&&(e.loc[0]+=i,i+=e.value.length-n.length,e.loc[1]+=i)}else i&&e.loc&&(e.loc[0]+=i,e.loc[1]+=i)})),o?u.map((e=>e.value)).join(""):u},exports.translateToR1C1=function(e,t){let{xlsx:n=!1,allowTernary:l=!0}=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};const{top:r,left:o}=D(t),s="string"==typeof e,u=s?De(e,{...Ot,xlsx:n,allowTernary:l}):e;let i=0;const c={xlsx:n,allowTernary:l};return u.forEach((e=>{if(ze(e)){const t=e.value,n=z(t,c),l=n.range,s={};s.r0=kt(l.$top,l.top,r),s.r1=kt(l.$bottom,l.bottom,r),s.c0=kt(l.$left,l.left,o),s.c1=kt(l.$right,l.right,o),s.$r0=l.$top,s.$r1=l.$bottom,s.$c0=l.$left,s.$c1=l.$right,n.range=s,e.value=It(n,c),e.loc&&(e.loc[0]+=i,i+=e.value.length-t.length,e.loc[1]+=i)}else i&&e.loc&&(e.loc[0]+=i,e.loc[1]+=i)})),s?u.map((e=>e.value)).join(""):u};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnguanMiLCJzb3VyY2VzIjpbXSwic291cmNlc0NvbnRlbnQiOltdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIn0=
