const rssUrl = 'https://www.amazon.com/gp/rss/bestsellers';
async function getAmazonRSS() {
  const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
  const data = await response.json();
  displayDeals(data.items);
}

function displayDeals(items) {
  let output = '';
  items.forEach(item => {
    output += `
      <div class="deal-item">
        <h3>${item.title}</h3>
        <img src="${item.thumbnail}" alt="${item.title}">
        <p>${item.content}</p>
        <a href="${item.link}" target="_blank">Xem ngay trên Amazon</a>
      </div>
    `;
  });
  document.getElementById("deals-container").innerHTML = output;
}

getAmazonRSS();
