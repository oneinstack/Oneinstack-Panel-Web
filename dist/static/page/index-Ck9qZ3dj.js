/* empty css             */import{d as e,x as r,a1 as t,W as a,b as i,o as l,X as s,a3 as o,J as p,a5 as n,ac as u,i as m,h as c,ae as d,n as v,e as b,a4 as f,$ as h,an as g,F as j,H as w,I as y}from"./index-B0-DY18Y.js";import _ from"./file-list-JWyQRmIA.js";import{_ as P,a as E}from"./custom-form.vue_vue_type_script_setup_true_lang-GSSM9JND.js";import{A as R}from"./Api-BE344Hwh.js";import{_ as k}from"./_plugin-vue_export-helper-BCo6x5W8.js";import"./file-panel.vue_vue_type_script_setup_true_lang-DXqMVLax.js";/* empty css                   */import"./el-checkbox-DQDwETtM.js";import"./el-input-CCiT4Pw-.js";import"./isEqual-C6HWhcNO.js";import"./_Uint8Array-D0RYPAnJ.js";import"./el-select-Diq8nzxA.js";import"./el-popper-CgqLQvxz.js";import"./index-DSCusJxK.js";import"./castArray-DHQk_f1a.js";import"./index-C1yhuRum.js";import"./el-form-item-DBl2iH2x.js";import"./_initCloneObject-B_s4quhu.js";import"./el-alert-BsCz6eZd.js";import"./el-button-C6SlJWJv.js";/* empty css                        */import"./el-dropdown-item-Dl8qfR11.js";import"./refs-CtMAnl62.js";import"./el-space-D4lKLniW.js";import"./vnode-C-JGoUos.js";import"./custom-dialog-DSPOWQq5.js";import"./el-dialog-DHwsIdVc.js";import"./index-B8-5ocmZ.js";import"./el-overlay-n5HYZiIu.js";import"./index-DxVUW8ik.js";import"./custom-table.vue_vue_type_script_setup_true_lang-Sl4-m6yg.js";import"./el-pagination-BAvsU8LK.js";import"./el-table-column-DufQ25bx.js";import"./el-tooltip-l0sNRNKZ.js";import"./el-drawer-qVVuOe4K.js";/* empty css                          */const x={class:"file-container relative"},U={class:"absolute fit-width",style:{"padding-bottom":"30px"}},D={class:"box1"},T=["onClick"],C={class:"path-tab-text"},A=k(e({__name:"index",setup(e){const k={owner:["0400","0200","0100"],group:["0040","0020","0010"],public:["0004","0002","0001"]},A=e=>{const r=[];for(let t=0;t<8;t++){const a=[];4&t&&a.push(e[0]),2&t&&a.push(e[1]),1&t&&a.push(e[2]),r.push(a)}return r},$=(e,r,t="0000")=>{let a=t.split("");const i=e.reduce(((e,t)=>e+parseInt(t[r])),0);return a[r]=i.toString(),a.join("")},q=r({theme:{light:["#626262"],dark:["#DBDBDB"]},tab:{list:[{path:["/"],active:!0,instance:null}],handleAddTab:()=>{if(q.tab.list.length>=10)return t.warning("最多只能打开10个文件夹");q.tab.list.push({path:["/"],active:!0,instance:null})},handleCloseTab:e=>{1!==q.tab.list.length&&(q.tab.list[e-1].active=!0,q.tab.list.splice(e,1))}},handleUpdatePath:(e,r)=>{q.tab.list.forEach(((e,t)=>e.active=t===r)),q.tab.list[r].path=e},drawer:{visible:!1,openType:"create",type:"file",title:"创建",open:(e,r,t)=>{switch(q.drawer.openType=e,e){case"create":q.drawer.title="创建";break;case"editPER":case"editUser":q.form.editPER.value.isDir=t.isDir,q.form.editPER.value.perm=t.permissions.padEnd(4,"0"),q.form.editPER.value.recursive=t.recursive,q.form.editPER.value.owner=A(k.owner)[t.permissions[1]],q.form.editPER.value.group=A(k.group)[t.permissions[2]],q.form.editPER.value.public=A(k.public)[t.permissions[3]],q.form.editPER.value.name=t.name,q.form.editUser.value.isDir=t.isDir,q.form.editUser.value.user=t.user,q.form.editUser.value.group=t.group,q.drawer.title="editPER"===e?"编辑权限":"修改用户和用户组"}q.drawer.type=r,q.drawer.visible=!0},close:()=>{var e,r;q.drawer.visible=!1,null==(e=q.form.instance)||e.resetFields(),null==(r=q.form.instance)||r.clearValidate()},confirm:()=>{var e;null==(e=q.form.instance)||e.validate((async e=>{var r;if(!e)return;const a=q.tab.list.find((e=>e.active)),i=null==a?void 0:a.path.join("/").replace(/\/\//g,"/");let l,s=R.createFile;switch(q.drawer.openType){case"create":s=R.createFile,l={path:`${"/"===i?"":i}/${q.form.create.value.name}`,type:q.drawer.type};break;case"editPER":case"editUser":s=R.updateFilePerm,l={path:`${"/"===i?"":i}/${q.form.editPER.value.name}`,perm:q.form.editPER.value.perm,user:q.form.editUser.value.user,group:q.form.editUser.value.group,recursive:q.form.editPER.value.recursive||q.form.editUser.value.recursive}}const{data:o}=await s(l);null==(r=null==a?void 0:a.instance)||r.refresh(),t.success(o),q.drawer.close()}))}},form:{instance:null,create:{value:{type:"file",name:""},items:[{label:"名称",type:"input",prop:"name",rules:[{required:!0,message:"请输入名称",trigger:"blur"}]}]},editPER:{value:{owner:[],group:[],public:[],perm:"",recursive:!1},items:[{label:"所有者",type:"checkbox-group",prop:"owner",options:[{label:"读取",value:"0400"},{label:"写入",value:"0200"},{label:"可执行",value:"0100"}],change:e=>{q.form.editPER.value.perm=$(e,1,q.form.editPER.value.perm)}},{label:"用户组",type:"checkbox-group",prop:"group",options:[{label:"读取",value:"0040"},{label:"写入",value:"0020"},{label:"可执行",value:"0010"}],change:e=>{q.form.editPER.value.perm=$(e,2,q.form.editPER.value.perm)}},{label:"公共",type:"checkbox-group",prop:"public",options:[{label:"读取",value:"0004"},{label:"写入",value:"0002"},{label:"可执行",value:"0001"}],change:e=>{q.form.editPER.value.perm=$(e,3,q.form.editPER.value.perm)}},{label:"权限",type:"input",prop:"perm",rules:[{required:!0,message:"请输入权限",trigger:"blur"},{pattern:/^[0-7]{4}$/,message:"权限错误",trigger:"blur"}],change:e=>{4===e.length&&(q.form.editPER.value.owner=A(k.owner)[+e[1]],q.form.editPER.value.group=A(k.group)[+e[2]],q.form.editPER.value.public=A(k.public)[+e[3]])}},{ifShow:e=>e.isDir,label:"同时修改子文件属性",type:"checkbox",prop:"recursive"}]},editUser:{value:{user:"",group:""},items:[{label:"用户",type:"input",prop:"user",rules:[{required:!0,message:"请输入用户",trigger:"blur"}]},{label:"用户组",type:"input",prop:"group",rules:[{required:!0,message:"请输入用户组",trigger:"blur"}]}]}}});return(e,r)=>{const t=a("v-s-icon"),R=j;return l(),i("div",x,[s("div",U,[s("div",D,[(l(!0),i(p,null,n(q.tab.list,((e,r)=>(l(),i("div",{key:r,class:v(["path-tab",{active:e.active}]),onClick:t=>q.handleUpdatePath(e.path,r)},[o(t,{name:"folder",size:"24",color:q.theme[b(f).theme],style:{transform:"rotateY(180deg)","margin-right":"14px"}},null,8,["color"]),s("span",C,h("/"===e.path[e.path.length-1]?"根目录":e.path[e.path.length-1]),1),r>0?(l(),c(R,{key:0,class:"hover-opacity",onClick:u((e=>q.tab.handleCloseTab(r)),["stop"])},{default:m((()=>[o(b(g))])),_:2},1032,["onClick"])):d("",!0)],10,T)))),128)),s("div",{class:"add-btn hover-opacity",onClick:r[0]||(r[0]=u(((...e)=>q.tab.handleAddTab&&q.tab.handleAddTab(...e)),["stop"]))},"+")]),(l(!0),i(p,null,n(q.tab.list,((e,r)=>w((l(),c(_,{ref_for:!0,ref:e=>e&&(q.tab.list[r].instance=e),key:r,"onUpdate:path":e=>q.handleUpdatePath(e,r),onOpenDrawer:q.drawer.open},null,8,["onUpdate:path","onOpenDrawer"])),[[y,q.tab.list[r].active]]))),128))]),o(E,{visible:q.drawer.visible,title:q.drawer.title,"on-close":q.drawer.close,"on-confirm":q.drawer.confirm},{default:m((()=>[q.drawer.visible?(l(),c(P,{key:0,data:q.form[q.drawer.openType],"on-init":e=>q.form.instance=e},null,8,["data","on-init"])):d("",!0)])),_:1},8,["visible","title","on-close","on-confirm"])])}}}),[["__scopeId","data-v-e4e23a1a"]]);export{A as default};
