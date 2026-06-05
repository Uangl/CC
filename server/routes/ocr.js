const { Router } = require('express');
const { authRequired } = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const router = Router();
router.use(authRequired);

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({ dest: uploadDir, limits: { fileSize: 10 * 1024 * 1024 } });

let cachedToken = null;

async function getBaiduToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }
  const apiKey = process.env.BAIDU_OCR_API_KEY;
  const secretKey = process.env.BAIDU_OCR_SECRET_KEY;
  if (!apiKey || !secretKey) throw new Error('Baidu OCR not configured');

  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(secretKey)}`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error(`Baidu token error: ${res.status}`);
  const data = await res.json();
  if (!data.access_token) throw new Error('Baidu token missing');

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + ((data.expires_in || 2592000) - 3600) * 1000,
  };
  return cachedToken.token;
}

router.post('/recognize', upload.single('image'), async (req, res) => {
  let filePath = null;
  try {
    if (!req.file) return res.status(400).json({ error: '请上传图片' });
    filePath = req.file.path;

    const base64 = fs.readFileSync(filePath, { encoding: 'base64' });
    const token = await getBaiduToken();

    const ocrRes = await fetch(
      `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `image=${encodeURIComponent(base64)}`,
      }
    );
    if (!ocrRes.ok) throw new Error(`Baidu OCR: ${ocrRes.status}`);
    const data = await ocrRes.json();
    if (data.error_msg) throw new Error(data.error_msg);

    const lines = (data.words_result || []).map(w => w.words);
    res.json({ questionText: lines.join('\n'), confidence: lines.length > 0 ? 0.9 : 0 });
  } catch (e) {
    console.error('OCR error:', e.message);
    res.json({ questionText: '', confidence: 0, error: e.message });
  } finally {
    if (filePath) fs.unlink(filePath, () => {});
  }
});

module.exports = router;
