// Public metadata is independent of synthetic personal records; credentials never enter this module.
export function joinPublic(works,metadata){return works.map(w=>{const p=metadata.items?.[`${w.kind}:${w.tmdb}`];return {...w,public:p&&p.kind===w.kind&&p.year===w.year&&p.tmdb===w.tmdb?p:null};});}
export function validPosterUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.search&&!u.hash&&u.hostname==='image.tmdb.org'&&/^\/t\/p\/(w\d+|original)\/[\w.-]+\.(jpg|png|webp)$/.test(u.pathname)?u.href:null;}catch{return null;}}
export function publicPoster(w){const p=w.public?.posterPath;return p?validPosterUrl('https://image.tmdb.org/t/p/w342'+p):null;}
