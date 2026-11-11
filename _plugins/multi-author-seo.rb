# frozen_string_literal: true

require "jekyll-seo-tag"

module MultiAuthorSeo
  module PageDrop
    def seo_authors
      entries = page["authors"]
      return [] unless entries.is_a?(Array)

      authors_data = site.data["authors"]

      entries.filter_map do |entry|
        data = authors_data.is_a?(Hash) ? authors_data[entry] : nil
        name = data.is_a?(Hash) ? data["name"] : entry
        next if name.to_s.empty?

        author = {
          "@type" => "Person",
          "name" => name
        }
        author["url"] = data["url"] if data.is_a?(Hash) && data["url"]
        author
      end
    end
  end

  module JsonLdDrop
    def author
      authors = page_drop.seo_authors
      return super unless authors.length > 1

      authors
    end
  end
end

Jekyll::SeoTag::Drop.prepend(MultiAuthorSeo::PageDrop)
Jekyll::SeoTag::JSONLDDrop.prepend(MultiAuthorSeo::JsonLdDrop)
