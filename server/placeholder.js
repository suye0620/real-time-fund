const fs = require('fs');
const path = require('path');

const PLACEHOLDER_MAP = {
  'https://runtime-replace.supabase.co': 'NEXT_PUBLIC_SUPABASE_URL',
  '__NEXT_PUBLIC_SUPABASE_ANON_KEY__': 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  '__NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY__': 'NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY',
  '__NEXT_PUBLIC_GA_ID__': 'NEXT_PUBLIC_GA_ID',
  '__NEXT_PUBLIC_GITHUB_LATEST_RELEASE_URL__': 'NEXT_PUBLIC_GITHUB_LATEST_RELEASE_URL',
  '__NEXT_PUBLIC_IS_GITHUB_LOGIN__': 'NEXT_PUBLIC_IS_GITHUB_LOGIN',
  '__NEXT_PUBLIC_API_BASE_URL__': 'NEXT_PUBLIC_API_BASE_URL',
};

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replacePlaceholders(staticDir) {
  if (!fs.existsSync(staticDir)) return;

  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(js|html)$/.test(entry.name)) files.push(full);
    }
  }
  walk(staticDir);

  for (const placeholder of Object.keys(PLACEHOLDER_MAP)) {
    const envName = PLACEHOLDER_MAP[placeholder];
    const value = process.env[envName] || '';
    if (!value) continue;
    const escaped = escapeRegExp(placeholder);
    const replacement = value.replace(/\\/g, '\\\\').replace(/&/g, '\\&');

    for (const file of files) {
      let content = fs.readFileSync(file, 'utf8');
      if (content.includes(placeholder)) {
        content = content.replace(new RegExp(escaped, 'g'), replacement);
        fs.writeFileSync(file, content);
      }
    }
  }
}

module.exports = { replacePlaceholders };
