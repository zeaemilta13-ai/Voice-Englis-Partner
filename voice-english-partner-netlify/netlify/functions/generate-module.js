const { json, readBody, askAI } = require('./_ai');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*' } };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Gunakan metode POST.' });

  try {
    const body = readBody(event);
    const topic = String(body.topic || '').trim();
    const learningGoal = String(body.learningGoal || '').trim();
    const sourceText = String(body.sourceText || '').trim();
    const count = Number(body.count);

    if (!topic && !sourceText) return json(400, { error: 'Isi topik atau teks materi terlebih dahulu.' });
    if (!learningGoal) return json(400, { error: 'Tujuan Pembelajaran (TP) wajib diisi agar soal terarah.' });
    if (!Number.isInteger(count) || count < 2 || count > 10) return json(400, { error: 'Jumlah soal harus 2 sampai 10.' });
    if (sourceText.length > 18000) return json(413, { error: 'Teks materi terlalu panjang. Maksimum 18.000 karakter.' });

    const input = { topic, learningGoal, sourceText, requestedQuestionCount: count };
    const system = `You are an expert English-language teacher and assessment designer for Indonesian junior secondary school (SMP) learners. Your task is to create a tightly aligned Listening/Speaking assessment. Return ONLY one valid JSON object. Never return markdown, HTML, explanations, or code fences.`;
    const user = `DESIGN REQUIREMENTS — FOLLOW ALL OF THEM:

1. LEARNING OBJECTIVE FIRST. Read the learning objective carefully. Identify the exact observable learner performance, language function, text type, and content knowledge required. Every question MUST directly measure at least one part of that objective. Do not create questions merely because they are easy to ask about the passage.
2. TOPIC IS NOT THE OBJECTIVE. Use the topic only as context. The learning objective is the primary criterion for selecting question types and content.
3. SOURCE FIDELITY. If sourceText is provided, use ONLY information explicitly stated or reasonably inferable from that text. Do not invent names, events, facts, vocabulary targets, or answers. If a question cannot be answered from the source, do not include it.
4. IF SOURCE IS EMPTY. Write a short, level-appropriate English listening script that deliberately teaches/practises the specified learning objective, then write questions based on that script.
5. QUESTION QUALITY. Write natural, clear English questions appropriate for SMP. Questions must assess the objective, not ask about paragraph numbers, sentence numbers, trivial formatting, or generic opinions unrelated to the objective. Avoid duplicates and near-duplicates. Mix question forms only when they serve the objective.
6. ANSWERABILITY. Each question must have one clear expected answer supported by the script. For speaking-response objectives, provide a model answer that demonstrates the target language function; the question must still be anchored in the script/context.
7. EVIDENCE. For each question, provide 2–4 short exact phrases copied from the script that support the expected answer. Each phrase must occur in the script.
8. QUALITY CONTROL BEFORE OUTPUT. Internally check each question against the learning objective and script. Remove or rewrite any item that does not align. Make sure there are exactly ${count} questions. If the material does not support ${count} valid questions, improve/rewrite the script only when sourceText is empty. If sourceText was supplied and cannot support ${count} aligned questions, return JSON with an error property explaining this; do NOT invent questions.

OUTPUT JSON SHAPE:
{
  "title": "short module title",
  "script": "the exact supplied sourceText, or the newly written script if sourceText is empty",
  "alignmentSummary": "brief Indonesian explanation of how the set measures the learning objective",
  "questions": [
    {
      "q": "question in natural English",
      "predictedAns": "complete model answer in English",
      "evidenceKey": ["exact phrase from script", "another exact phrase from script"],
      "difficulty": "easy|medium|challenging",
      "skill": "the specific target skill",
      "rationale": "in Indonesian: which part of the learning objective this question measures and why"
    }
  ]
}

INPUT:
${JSON.stringify(input)}`;

    const out = await askAI([
      { role: 'system', content: system },
      { role: 'user', content: user }
    ], 6000);

    if (out.error) throw new Error(String(out.error));
    const script = sourceText || String(out.script || '').trim();
    if (!script) throw new Error('AI tidak menghasilkan teks materi.');
    if (!Array.isArray(out.questions) || out.questions.length !== count) {
      throw new Error(`AI menghasilkan ${out.questions?.length || 0} soal, sedangkan diminta ${count}. Hasil tidak disimpan.`);
    }

    const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const normalizedScript = normalize(script);
    const questions = out.questions.map((item, index) => {
      const q = String(item.q || '').trim();
      const predictedAns = String(item.predictedAns || '').trim();
      const evidenceKey = Array.isArray(item.evidenceKey) ? item.evidenceKey.map(x => String(x).trim()).filter(Boolean) : [];
      const rationale = String(item.rationale || '').trim();
      if (!q || !predictedAns || evidenceKey.length < 2 || evidenceKey.length > 4 || !rationale) {
        throw new Error(`Soal nomor ${index + 1} tidak memenuhi struktur wajib.`);
      }
      if (evidenceKey.some(phrase => !normalizedScript.includes(normalize(phrase)))) {
        throw new Error(`Bukti teks pada soal nomor ${index + 1} tidak ditemukan dalam materi. Hasil ditolak.`);
      }
      return {
        q,
        predictedAns,
        evidenceKey,
        difficulty: ['easy', 'medium', 'challenging'].includes(item.difficulty) ? item.difficulty : 'medium',
        skill: String(item.skill || 'listening comprehension'),
        rationale
      };
    });

    return json(200, {
      title: String(out.title || topic || 'English Practice'),
      script,
      alignmentSummary: String(out.alignmentSummary || ''),
      questions
    });
  } catch (error) {
    return json(502, { error: error.message || 'Generator AI gagal membuat soal.' });
  }
};
