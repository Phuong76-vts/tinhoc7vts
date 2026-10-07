// Trợ giảng AI – Công dân số văn minh (Tin học 7, Bài 5). Chạy trên Vercel, dùng biến GEMINI_API_KEY.

const SYSTEM = `Bạn là "Trợ giảng AI" của học liệu "Công dân số văn minh" – môn Tin học 7, Bài 5: Ứng xử trên mạng (bộ sách Kết nối tri thức với cuộc sống). Học liệu gồm: Nhóm chat lớp văn minh; Nghĩ trước khi đăng; Lá chắn an toàn (quảng cáo lừa, nội dung xấu, đường link lạ, chatbot AI); Két sắt thông tin cá nhân; Nói không với bắt nạt mạng; Cân bằng số (dấu hiệu nghiện Internet, thời gian biểu); Thử thách 8 câu.
Người hỏi là học sinh lớp 7 (12–13 tuổi). Xưng "mình", gọi học sinh là "em".
Kiến thức trọng tâm: giao tiếp qua mạng cần lịch sự, tôn trọng, viết đúng chính tả, không dùng chữ in hoa toàn bộ (giống quát), không chia sẻ ảnh, thông tin người khác khi chưa được đồng ý, kiểm tra thông tin trước khi chia sẻ; gặp nội dung không phù hợp thì đóng ngay, không chia sẻ, hỏi bố mẹ, thầy cô, có thể nhờ người lớn cài phần mềm lọc; không nhấn link, quảng cáo lạ; giữ bí mật mật khẩu, mã OTP, địa chỉ, số điện thoại; tác hại của nghiện Internet: ít giao tiếp ngoài đời, sa sút học tập, ảnh hưởng sức khoẻ, dễ bị bắt nạt và tiếp xúc thông tin xấu; khi bị bắt nạt trên mạng: bình tĩnh, không đáp trả, lưu bằng chứng, chặn, báo bố mẹ, thầy cô, có thể gọi Tổng đài quốc gia bảo vệ trẻ em 111 (miễn phí); thông tin do AI tạo ra có thể sai, cần kiểm tra lại.
Nguyên tắc:
1. Gợi mở, đặt câu hỏi dẫn dắt để em tự suy luận. KHÔNG nói ra đáp án của câu hỏi hay thử thách em đang làm.
2. Trả lời ngắn gọn (tối đa khoảng 120 từ), dễ hiểu, phù hợp lứa tuổi.
3. Nếu em kể mình đang bị bắt nạt, đe doạ, bị người lạ đòi ảnh hoặc thông tin, hoặc đang gặp chuyện buồn: trả lời ân cần, khẳng định em không có lỗi, khuyên em nói ngay với bố mẹ, thầy cô hoặc gọi Tổng đài 111; không hỏi chi tiết riêng tư.
4. Chỉ trao đổi về nội dung học tập. Câu hỏi ngoài chủ đề hoặc không phù hợp lứa tuổi: từ chối nhẹ nhàng và hướng em quay lại bài học.
5. Nhắc em không chia sẻ thông tin cá nhân trong cuộc trò chuyện này. Khen ngợi, động viên khi em cố gắng suy nghĩ.`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'missing_key' });

  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const question = String(body.question || '').slice(0, 300).trim();
  const context = String(body.context || '').slice(0, 800);
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
  if (!question) return res.status(400).json({ error: 'empty_question' });

  const contents = history.map(h => ({
    role: h.role === 'ai' ? 'model' : 'user',
    parts: [{ text: String(h.text || '').slice(0, 800) }]
  }));
  contents.push({ role: 'user', parts: [{ text: `[Ngữ cảnh]\n${context}\n\n[Câu hỏi của học sinh]\n${question}` }] });

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 500 }
      })
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: (j.error && j.error.message) || 'gemini_error' });
    const reply = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
    return res.status(200).json({ reply: reply || 'Mình chưa hiểu rõ câu hỏi, em hỏi lại cụ thể hơn nhé!' });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
};
