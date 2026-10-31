const headers = {"Content-Type":"application/json","Cache-Control":"no-store"};
exports.json = (statusCode, body) => ({statusCode,headers,body:JSON.stringify(body)});
exports.readBody = event => { try { return JSON.parse(event.body || "{}"); } catch { throw new Error("Format permintaan tidak valid."); } };
exports.askAI = async (messages, max_tokens=2500) => {
  const key=process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY belum diatur pada Netlify environment variables.");
  const model=process.env.OPENAI_MODEL || "gpt-4o-mini";
  const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({model,temperature:0.1,max_tokens,response_format:{type:"json_object"},messages})});
  const raw=await r.text();
  if(!r.ok) throw new Error(`Layanan AI menolak permintaan (${r.status}). ${raw.slice(0,350)}`);
  const data=JSON.parse(raw); const content=data.choices?.[0]?.message?.content;
  if(!content) throw new Error("AI tidak mengembalikan isi jawaban.");
  return JSON.parse(content);
};
