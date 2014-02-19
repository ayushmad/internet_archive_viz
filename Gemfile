source 'https://rubygems.org'

gem 'rails', '3.2.13'

# Bundle edge Rails instead:
# gem 'rails', :git => 'git://github.com/rails/rails.git'

group :development, :test do
    gem 'sqlite3'
    gem 'jasmine'
    # As deployment will only take place in the development server
    gem 'capistrano'
    gem 'rspec-rails', '2.11.0'
end


group :test do
    gem 'capybara', '1.1.2'
end

# Gems used only for assets and not required
# in production environments by default.
group :assets do
  gem 'sass-rails',   '~> 3.2.3'
  gem 'coffee-rails', '~> 3.2.1'
  gem 'uglifier', '>= 1.0.3'
end

gem 'jquery-rails'

group :production do
  gem 'pg', '0.15.1'
  gem 'rails_12factor', '0.0.2'
end

