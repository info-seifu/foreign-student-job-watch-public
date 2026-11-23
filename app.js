const 表示名 = {
  strong: '◎ 有力候補',
  possible: '○ 可能性あり',
  home_country_bachelor: '△ 母国大卒者向け',
  new: '新着',
  updated: '更新',
  reopened: '再掲載',
  unchanged: '変更なし',
  closed: '掲載終了'
};

let 全求人 = [];

const 要素 = id => document.getElementById(id);
const 無害化 = 値 => String(値 ?? '記載なし')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function 集計カード(求人) {
  const 掲載中 = 求人.filter(j => j.status === 'active');
  const 値 = [
    ['掲載中', 掲載中.length],
    ['大阪', 掲載中.filter(j => j.region_priority === 'osaka').length],
    ['新着・更新', 掲載中.filter(j => ['new','updated','reopened'].includes(j.change_type)).length],
    ['有力候補', 掲載中.filter(j => j.judgement === 'strong').length]
  ];
  要素('summary').innerHTML = 値.map(([名, 数]) => `<article class="card"><span>${名}</span><strong>${数}</strong></article>`).join('');
}

function 絞り込み() {
  const q = 要素('q').value.trim().toLowerCase();
  const region = 要素('region').value;
  const judgement = 要素('judgement').value;
  const employment = 要素('employment').value;
  const change = 要素('change').value;
  const activeOnly = 要素('activeOnly').checked;

  const 結果 = 全求人.filter(j => {
    const 検索文字列 = [j.company, j.title, j.location, j.description, j.japanese_requirement, j.education_requirement].join(' ').toLowerCase();
    return (!q || 検索文字列.includes(q))
      && (!region || j.region_priority === region)
      && (!judgement || j.judgement === judgement)
      && (!employment || j.employment_type === employment)
      && (!change || j.change_type === change)
      && (!activeOnly || j.status === 'active');
  }).sort((a,b) => {
    const 地域順 = {osaka:0, kansai:1, other:2};
    const 判定順 = {strong:0, possible:1, home_country_bachelor:2};
    return (地域順[a.region_priority] ?? 9) - (地域順[b.region_priority] ?? 9)
      || (判定順[a.judgement] ?? 9) - (判定順[b.judgement] ?? 9)
      || String(b.last_checked).localeCompare(String(a.last_checked));
  });

  要素('count').textContent = `${結果.length}件`;
  要素('empty').hidden = 結果.length !== 0;
  要素('jobs').innerHTML = 結果.map(j => `
    <tr>
      <td><span class="badge ${無害化(j.judgement)}">${無害化(表示名[j.judgement] || j.judgement)}</span></td>
      <td><strong>${無害化(j.company)}</strong><br><span>${無害化(j.title)}</span></td>
      <td>${無害化(j.location)}</td>
      <td>${無害化(j.employment_type)}</td>
      <td>${無害化(j.japanese_requirement)}</td>
      <td>${無害化(j.education_requirement)}</td>
      <td>${無害化(j.salary)}</td>
      <td>${無害化(表示名[j.change_type] || j.change_type)}</td>
      <td>${無害化(j.last_checked)}</td>
      <td><a href="${無害化(j.url)}" target="_blank" rel="noopener">開く</a></td>
    </tr>`).join('');
}

async function 起動() {
  try {
    const 応答 = await fetch('./data/jobs.json', {cache:'no-store'});
    if (!応答.ok) throw new Error(`HTTP ${応答.status}`);
    const データ = await 応答.json();
    全求人 = Array.isArray(データ.jobs) ? データ.jobs : [];
    要素('updated').textContent = `データ更新: ${データ.generated_at || '未登録'}`;
    集計カード(全求人);
    絞り込み();
  } catch (err) {
    要素('updated').textContent = `データを読み込めませんでした: ${err.message}`;
  }
}

['q','region','judgement','employment','change','activeOnly'].forEach(id => {
  要素(id).addEventListener(id === 'q' ? 'input' : 'change', 絞り込み);
});

起動();
