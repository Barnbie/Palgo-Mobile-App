// PalGo tokens transcribed from the supplied mobile design boards.
export const colors = {
  canvas: '#EEF2FF', paper: '#FFFFFF', blue: '#2563EB', blueDark: '#1949C5',
  mint: '#10B981', mintSoft: '#DDF8F1', ink: '#202433', muted: '#70778D',
  line: '#D6DEF3', success: '#18B990', warning: '#F3BA39', danger: '#F15959',
  map: '#CDE9DF', sheet: '#F7F9FF',
  // Compatibility aliases while the existing screen state machine is refactored.
  pale: '#EEF2FF', white: '#FFFFFF', red: '#F15959', gold: '#F3BA39',
};

const palettes={
  light:{canvas:'#EEF2FF',paper:'#FFFFFF',ink:'#202433',muted:'#70778D',line:'#D6DEF3',mintSoft:'#DDF8F1',map:'#CDE9DF',sheet:'#F7F9FF'},
  dark:{canvas:'#111827',paper:'#1F2937',ink:'#F3F4F6',muted:'#AAB3C2',line:'#374151',mintSoft:'#173B35',map:'#172A2B',sheet:'#182232'},
};
let activePalette='light';

export function applyColorScheme(scheme,styles) {
  const nextName=scheme==='dark'?'dark':'light';
  if(nextName===activePalette)return;
  const previous=palettes[activePalette],next=palettes[nextName];
  const values={...previous,white:previous.paper,pale:previous.canvas};
  const newValues={...next,white:next.paper,pale:next.canvas};
  const replacements=new Map();
  for(const key of Object.keys(previous))replacements.set(previous[key],next[key]);
  replacements.set(previous.paper,next.paper);replacements.set(previous.canvas,next.canvas);
  const custom={
    '#EEF2FF':'canvas','#FFFFFF':'paper','#202433':'ink','#70778D':'muted','#D6DEF3':'line','#DDF8F1':'mintSoft','#F7F9FF':'sheet',
    '#DCEFE8':'map','#DDFBF1':'mintSoft','#E9FBF5':'mintSoft','#EEF1F8':'line','#E7EEFF':'sheet','#101522':'ink','#34415C':'muted','#35445D':'muted',
  };
  for(const [literal,key] of Object.entries(custom))replacements.set(literal,next[key]);
  Object.assign(colors,newValues);
  const remap=value=>{
    if(typeof value==='string')return replacements.get(value)||value;
    if(Array.isArray(value))return value.map(remap);
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,remap(item)]));
    return value;
  };
  if(styles)for(const name of Object.keys(styles))styles[name]=remap(styles[name]);
  activePalette=nextName;
}

export const type = { title: 23, section: 16, body: 13, caption: 11, button: 13 };
export const space = { xxs:4, xs:8, sm:12, md:16, lg:20, xl:28, xxl:36 };
export const radius = { input:10, card:14, button:11, sheet:22, pill:99 };
export const shadow = { shadowColor:'#8492B8', shadowOpacity:.08, shadowRadius:12, shadowOffset:{width:0,height:5}, elevation:2 };
