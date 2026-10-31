const {json,readBody,askAI}=require('./_ai');
exports.handler=async event=>{
 if(event.httpMethod!=='POST') return json(405,{error:'Method tidak diizinkan.'});
 try{
  const b=readBody(event); const answer=String(b.answer||'').trim(); const question=String(b.question||'').trim(); const source=String(b.sourceText||'').trim();
  if(!answer||!question||!source) return json(400,{error:'Teks sumber, pertanyaan, dan jawaban wajib tersedia.'});
  if(answer.length>3000||source.length>18000) return json(413,{error:'Jawaban atau teks sumber terlalu panjang.'});
  const prompt=`Nilai jawaban lisan siswa untuk asesmen bahasa Inggris. Berikan skor 0-100 dengan rubrik: ketepatan isi/pemahaman 0-60, dukungan bukti teks 0-20, kelengkapan/relevansi respons 0-10, kejelasan komunikasi bahasa Inggris 0-10. Jangan memberi nilai karena jawaban panjang. Terima parafrasa, sinonim, dan tata bahasa sederhana yang masih dapat dipahami. Jangan menghukum aksen karena input hanya transkrip. Jika jawaban benar secara makna tetapi tidak mengutip kata persis, nilai tetap dapat tinggi. Evidence hanya dianggap ditemukan jika jawaban menyampaikan informasi yang benar-benar didukung passage. Jangan mengarang bukti. Return JSON: score, textEvidenceFound(boolean), rubric({comprehension, evidence, relevance, communication}), feedback (Bahasa Indonesia, spesifik), misconception (kesalahpahaman jika ada, selain itu string kosong), hint (petunjuk tanpa membocorkan jawaban). DATA: ${JSON.stringify({topic:b.topic||'',learningGoal:b.learningGoal||'',sourceText:source,question,expectedAnswer:b.expectedAnswer||'',evidence:b.evidence||[],studentAnswer:answer})}`;
  const result=await askAI([{role:'system',content:'You are a fair, evidence-grounded English speaking-response assessor. Score consistently and return JSON only.'},{role:'user',content:prompt}],1200);
  const score=Number(result.score); if(!Number.isFinite(score)||score<0||score>100) throw new Error('AI mengembalikan skor di luar rentang.');
  const rubric=result.rubric||{}; for(const k of ['comprehension','evidence','relevance','communication']) if(!Number.isFinite(Number(rubric[k]))) throw new Error('Rubrik penilaian tidak lengkap.');
  return json(200,{score:Math.round(score),textEvidenceFound:Boolean(result.textEvidenceFound),rubric,feedback:String(result.feedback||''),misconception:String(result.misconception||''),hint:String(result.hint||'')});
 }catch(e){return json(502,{error:e.message||'Penilaian AI gagal.'});}
};
