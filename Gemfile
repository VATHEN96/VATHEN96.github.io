source "https://rubygems.org"

# Dùng GitHub Pages để tự động cài plugin tương thích
gem "github-pages", group: :jekyll_plugins

# Khai báo các plugin cần dùng
group :jekyll_plugins do
  gem "jekyll-feed"
  gem "jekyll-sitemap"
end

# Các cấu hình cho Windows (nếu dùng Windows)
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end
