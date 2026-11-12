"use strict";
/* Quick schedule recognition adapted from Android's parseQuickSchedule,
   app/src/main/assets/nottas.html. Pure functions: no API or polling. */
(function(){
  function isoDate(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")}
  function addDays(date,n){const d=new Date(date.getFullYear(),date.getMonth(),date.getDate(),12);d.setDate(d.getDate()+n);return d}
  function clock(h,m=0,part=""){
    h=Number(h);m=Number(m);
    if(!Number.isInteger(h)||!Number.isInteger(m)||m<0||m>59)return "";
    const meridiem=part.toLowerCase().replace(/[\s.]/g,"");
    if(meridiem==="a"||meridiem==="p"||meridiem==="am"||meridiem==="pm"){
      if(h<1||h>12)return "";
      h=h%12+(meridiem.startsWith("p")?12:0);
    }else if(h<0||h>23)return "";
    return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0");
  }
  function norm(text){return String(text).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
  const weekdayNames=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  const monthNames=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  function dateWith(day,month,year){
    const d=new Date(year,month-1,day,12);
    return d.getDate()===day&&d.getMonth()===month-1&&d.getFullYear()===year?d:null;
  }
  function parse(text,reference=new Date()){
    const original=String(text||"");
    const now=new Date(reference.getFullYear(),reference.getMonth(),reference.getDate(),12);
    let remaining=original, date="",time="",dateToken="",timeToken="";
    function strip(match){remaining=(remaining.slice(0,match.index)+" "+remaining.slice(match.index+match[0].length)).replace(/\s{2,}/g," ").trim()}
    const patterns=[
      {regex:/(?:^|\s)(?:a\s+las?\s+)?(\d{1,4})([ap])(?=$|\s|[,;.!?])/i,
       read:m=>{const digits=m[1];return clock(digits.length<=2?digits:digits.slice(0,-2),digits.length<=2?0:digits.slice(-2),m[2])}},
      {regex:/(?:^|\s)(?:a\s+las?\s+)?(0?[1-9]|1[0-2])(?:[:.](\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?)(?=$|\s|[,;!?])/i,
       read:m=>clock(m[1],m[2]||0,m[3])},
      {regex:/(?:^|\s)(?:a\s+las?\s+)?([01]?\d|2[0-3])[:h]([0-5]\d)(?=$|\s|[,;.!?])/i,
       read:m=>clock(m[1],m[2])},
      {regex:/(?:^|\s)a\s+las?\s+([01]?\d|2[0-3])(?:\s+de\s+la\s+(mañana|tarde|noche))?(?=$|\s|[,;.!?])/i,
       read:m=>{let h=+m[1];const part=norm(m[2]||"");if(part==="manana"&&h===12)h=0;else if((part==="tarde"||part==="noche")&&h<12)h+=12;return clock(h)}},
      {regex:/(?:^|\s)(\d{1,2})\s+de\s+la\s+(mañana|tarde|noche)(?=$|\s|[,;.!?])/i,
       read:m=>{let h=+m[1];if(h<1||h>12)return "";const part=norm(m[2]);if(part==="manana"&&h===12)h=0;else if(part!=="manana"&&h<12)h+=12;return clock(h)}}
    ];
    for(const p of patterns){
      const m=remaining.match(p.regex);if(!m)continue;
      const parsed=p.read(m);if(!parsed)continue;
      time=parsed;timeToken=m[0].trim();strip(m);break;
    }
    let match=remaining.match(/(?:^|\s)(pasado\s+mañana|mañana|hoy)(?=$|\s|[,;.!?])/i);
    if(match){
      const word=norm(match[1]).replace(/\s+/g," ");
      date=isoDate(addDays(now,word==="hoy"?0:word==="manana"?1:2));
      dateToken=match[0].trim();strip(match);
    }
    if(!date){
      match=remaining.match(/(?:^|\s)(?:el\s+)?([0-3]?\d)[\/-]([01]?\d)(?:[\/-](\d{2,4}))?(?=$|\s|[,;.!?])/i);
      if(match){
        let year=match[3]?+match[3]:now.getFullYear();if(year<100)year+=2000;
        let value=dateWith(+match[1],+match[2],year);
        if(value&&!match[3]&&value<now)value=dateWith(+match[1],+match[2],year+1);
        if(value){date=isoDate(value);dateToken=match[0].trim();strip(match)}
      }
    }
    if(!date){
      match=remaining.match(/(?:^|\s)(?:el\s+)?([0-3]?\d)\s+(?:de\s+)?(ene(?:ro)?|feb(?:rero)?|mar(?:zo)?|abr(?:il)?|may(?:o)?|jun(?:io)?|jul(?:io)?|ago(?:sto)?|sep(?:tiembre)?|septiembre|setiembre|oct(?:ubre)?|nov(?:iembre)?|dic(?:iembre)?)(?=$|\s|[,;.!?])/i);
      if(match){
        const part=norm(match[2]);const idx=monthNames.findIndex(m=>norm(m).startsWith(part)||part.startsWith(norm(m).slice(0,3))||(part==="setiembre"&&m==="septiembre"));
        if(idx>=0){let value=dateWith(+match[1],idx+1,now.getFullYear());if(value&&value<now)value=dateWith(+match[1],idx+1,now.getFullYear()+1);
          if(value){date=isoDate(value);dateToken=match[0].trim();strip(match)}
        }
      }
    }
    if(!date){
      match=remaining.match(/(?:^|\s)(?:(?:el|pr[oó]ximo)\s+)?(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)(?=$|\s|[,;.!?])/i);
      if(match){
        const target=weekdayNames.findIndex(x=>norm(x)===norm(match[1]));
        if(target>=0){let days=(target-now.getDay()+7)%7;if(!days)days=7;date=isoDate(addDays(now,days));dateToken=match[0].trim();strip(match)}
      }
    }
    if(time&&!date)date=isoDate(now);
    let clean=remaining.replace(/^[,;:.\s]+|[,;:.\s]+$/g,"").trim();
    if(!clean)clean=original.trim();
    return {found:!!dateToken||!!timeToken,date,time,clean,hasDate:!!dateToken,hasTime:!!timeToken,dateToken,timeToken};
  }
  function displayDate(iso,now=new Date()){
    if(!iso)return "Sin fecha";
    const today=isoDate(now),tomorrow=isoDate(addDays(now,1));
    if(iso===today)return "Hoy";if(iso===tomorrow)return "Mañana";
    const [year,month,day]=iso.split("-").map(Number);
    return new Intl.DateTimeFormat("es",{day:"numeric",month:"short",year:year!==now.getFullYear()?"numeric":undefined}).format(new Date(year,month-1,day,12));
  }
  window.NottasSchedule=Object.freeze({parse,isoDate,addDays,displayDate});
})();