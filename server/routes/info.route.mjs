import { Router } from 'express';

import { HttpError } from '../middleware/errorHandler.mjs';
import { detectPlatform } from '../services/platform.service.mjs';
import { fetchVideoInfo } from '../services/ytdlp.service.mjs';

export const infoRouter = Router();

infoRouter.get('/info', async (req, res, next) => {
  try {
    const { url } = req.query;
    if (typeof url !== 'string' || url.trim() === '') {
      throw new HttpError(400, 'Der Query-Parameter "url" ist erforderlich.', 'MISSING_URL');
    }

    const platform = detectPlatform(url);
    const info = await fetchVideoInfo(url, platform);
    res.json(info);
  } catch (err) {
    next(err);
  }
});
