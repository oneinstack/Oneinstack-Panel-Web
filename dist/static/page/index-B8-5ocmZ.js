import{at as e,d as o,p as t,a as s,a3 as n,D as a,r as u,R as d,aM as l,c,aS as r,k as i,y as m,bB as p,bC as y,j as v,l as f}from"./index-B0-DY18Y.js";import{P as b}from"./vnode-C-JGoUos.js";import{t as x}from"./el-input-CCiT4Pw-.js";import{g as M}from"./index-DSCusJxK.js";const k=o=>{if(!o)return{onClick:e,onMousedown:e,onMouseup:e};let t=!1,s=!1;return{onClick:e=>{t&&s&&o(e),t=s=!1},onMousedown:e=>{t=e.target===e.currentTarget},onMouseup:e=>{s=e.target===e.currentTarget}}},g=t({mask:{type:Boolean,default:!0},customMaskEvent:Boolean,overlayClass:{type:d([String,Array,Object])},zIndex:{type:d([String,Number])}});const C=o({name:"ElOverlay",props:g,emits:{click:e=>e instanceof MouseEvent},setup(e,{slots:o,emit:t}){const d=s("overlay"),{onClick:l,onMousedown:c,onMouseup:r}=k(e.customMaskEvent?void 0:e=>{t("click",e)});return()=>e.mask?n("div",{class:[d.b(),e.overlayClass],style:{zIndex:e.zIndex},onClick:l,onMousedown:c,onMouseup:r},[u(o,"default")],b.STYLE|b.CLASS|b.PROPS,["onClick","onMouseup","onMousedown"]):a("div",{class:e.overlayClass,style:{zIndex:e.zIndex,position:"fixed",top:"0px",right:"0px",bottom:"0px",left:"0px"}},[u(o,"default")])}}),w=(e,o={})=>{l(e)||x("[useLockscreen]","You need to pass a ref param to this function");const t=o.ns||s("popup"),n=c((()=>t.bm("parent","hidden")));if(!r||i(document.body,n.value))return;let a=0,u=!1,d="0";const b=()=>{setTimeout((()=>{"undefined"!=typeof document&&(f(null==document?void 0:document.body,n.value),u&&document&&(document.body.style.width=d))}),200)};m(e,(e=>{if(!e)return void b();u=!i(document.body,n.value),u&&(d=document.body.style.width),a=M(t.namespace.value);const o=document.documentElement.clientHeight<document.body.scrollHeight,s=y(document.body,"overflowY");a>0&&(o||"scroll"===s)&&u&&(document.body.style.width=`calc(100% - ${a}px)`),v(document.body,n.value)})),p((()=>b()))};export{C as E,k as a,w as u};
