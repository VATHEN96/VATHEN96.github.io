const rssUrl = 'https://www.amazon.com/gp/rss/bestsellers';
const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

async function getAmazonDeals() {
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    let output = '';
    data.items.forEach(item => {
      output += `
        <div class="deal-item">
          <img src="${item.thumbnail}" alt="${item.title}">
          <h3>${item.title}</h3>
          <p>${item.content}</p>
          <a href="${item.link}" target="_blank">Xem ngay trên Amazon</a>
        </div>
      `;
    });
    document.getElementById("deals-container").innerHTML = output;
  } catch (error) {
    console.error('Error fetching Amazon Deals:', error);
  }
}

getAmazonDeals();
