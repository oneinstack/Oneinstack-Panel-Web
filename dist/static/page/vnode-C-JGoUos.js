import{bh as E,J as T,M as n,aY as S}from"./index-B0-DY18Y.js";var r=(E=>(E[E.TEXT=1]="TEXT",E[E.CLASS=2]="CLASS",E[E.STYLE=4]="STYLE",E[E.PROPS=8]="PROPS",E[E.FULL_PROPS=16]="FULL_PROPS",E[E.HYDRATE_EVENTS=32]="HYDRATE_EVENTS",E[E.STABLE_FRAGMENT=64]="STABLE_FRAGMENT",E[E.KEYED_FRAGMENT=128]="KEYED_FRAGMENT",E[E.UNKEYED_FRAGMENT=256]="UNKEYED_FRAGMENT",E[E.NEED_PATCH=512]="NEED_PATCH",E[E.DYNAMIC_SLOTS=1024]="DYNAMIC_SLOTS",E[E.HOISTED=-1]="HOISTED",E[E.BAIL=-2]="BAIL",E))(r||{});function A(n){return E(n)&&n.type===T}function s(T){return E(T)&&!A(T)&&!function(T){return E(T)&&T.type===S}(T)}const e=T=>{const S=n(T)?T:[T],r=[];return S.forEach((T=>{var S;n(T)?r.push(...e(T)):E(T)&&(null==(S=T.component)?void 0:S.subTree)?r.push(T,...e(T.component.subTree)):E(T)&&n(T.children)?r.push(...e(T.children)):r.push(T)})),r};export{r as P,s as a,e as f,A as i};
