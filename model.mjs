// Reused from the existing dashboard's pure search model; no data or identity.
export const normalize=s=>String(s??'').normalize('NFKC').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200d\u064B-\u065F]/g,'').replace(/\s/g,'').toLowerCase();
