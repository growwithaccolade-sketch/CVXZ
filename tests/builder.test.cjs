const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('builder.html','utf8');
function boot(saved='{}',blocked=false){
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',innerHTML:'',hidden:false,style:{setProperty(){}},querySelectorAll(){return []}});return nodes.get(id)};
 const context=vm.createContext({document:{getElementById:node,body:{classList:{add(){}}}},window:{scrollTo(){},location:{}},location:{hash:'',pathname:'/builder.html'},history:{replaceState(){}},localStorage:{getItem(){return saved},setItem(){if(blocked)throw Error('blocked')}},confirm:()=>true,alert(){},setTimeout(){}});
 for(const [,script]of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(script,context);
 return {run:s=>vm.runInContext(s,context),node};
}
test('invalid stored field types cannot crash writing tools',()=>{const b=boot('{"title":{},"experience":[],"skills":42,"accent":"red","template":"invalid"}');b.run('suggestSummary();makeCoverLetter()');assert.equal(b.run('data.accent'),'#145e69');assert.equal(b.run('data.template'),'modern')});
test('storage failures keep preview live and report unsaved state',()=>{const b=boot('{}',true);b.run('setField("name","Updated Name")');assert.match(b.node('paper').innerHTML,/Updated Name/);assert.match(b.node('save-status').textContent,/unavailable/)});
test('preview escapes markup from user data',()=>{const b=boot();b.run('setField("summary","<img src=x onerror=alert(1)>")');assert.match(b.node('paper').innerHTML,/&lt;img/);assert.doesNotMatch(b.node('paper').innerHTML,/<img/)});
test('reset clears generated private career content',()=>{const b=boot();b.run('suggestSummary();makeCoverLetter();resetData()');assert.equal(b.node('cover-output').value,'');assert.equal(b.node('writing-result').textContent,'');assert.equal(b.run('data.name'),'')});
test('restore validates types and permits selecting the same file again',async()=>{const b=boot();b.run('globalThis.input={files:[{size:20,text:async()=>JSON.stringify({name:"Restored",skills:7})}],value:"backup.json"}');await b.run('restoreJSON({target:input})');assert.equal(b.run('data.name'),'Restored');assert.equal(b.run('input.value'),'');assert.equal(typeof b.run('data.skills'),'string')});
test('keyword matching retains short technical skills and ignores punctuation',()=>{const b=boot();assert.equal(b.run('keywords("SQL, C++, .NET. R&D").join("|")'),'sql|c++|net')});
test('print hides tools and removes mobile preview clipping',()=>{assert.match(html,/@media print\{#career-tools\{display:none!important\}/);assert.match(html,/max-height:none!important;overflow:visible!important/)});
