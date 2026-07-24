// In-memory download progress, keyed by a client-generated jobId. Downloads
// buffer the whole yt-dlp/ffmpeg run server-side before any response bytes go
// out (see download.route.mjs), so the client has no other way to see what's
// happening in the meantime - a plain fetch() just hangs with zero bytes for
// however long that takes. This lets the frontend poll a cheap side-channel
// endpoint for the same job while the main request is still in flight.
const jobs = new Map();

export function startJob(jobId) {
  jobs.set(jobId, { phase: 'preparing', percent: null, speed: null, eta: null });
}

export function updateJob(jobId, patch) {
  const job = jobs.get(jobId);
  if (job) Object.assign(job, patch);
}

export function getJob(jobId) {
  return jobs.get(jobId) ?? null;
}

export function endJob(jobId) {
  jobs.delete(jobId);
}
