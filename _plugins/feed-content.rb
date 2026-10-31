# frozen_string_literal: true

require 'addressable/uri'
require 'nokogiri'

module FeedContent
  def feed_content(html, post_url)
    fragment = Nokogiri::HTML.fragment(html)
    has_scripts = fragment.css('script').any?
    fragment.css('script, style, link').remove

    fragment.css('iframe, object, embed, video, audio, canvas, form').each do |node|
      node.replace(feed_article_link(fragment, post_url))
    end
    fragment.add_child(feed_article_link(fragment, post_url)) if has_scripts

    fragment.css('*').each do |node|
      node.attribute_nodes.each do |attribute|
        node.remove_attribute(attribute.name) if attribute.name.start_with?('on') || attribute.name == 'srcdoc'
      end

      %w[href src poster].each do |attribute|
        next unless node[attribute]

        url = feed_absolute_url(node[attribute], post_url)
        scheme = Addressable::URI.parse(url).scheme
        allowed_schemes = attribute == 'href' ? %w[http https mailto tel] : %w[http https]
        if allowed_schemes.include?(scheme&.downcase)
          node[attribute] = url
        else
          node.remove_attribute(attribute)
        end
      end
    end

    fragment.to_html
  end

  private

  def feed_absolute_url(url, post_url)
    uri = Addressable::URI.parse(url)
    return url if uri.scheme

    baseurl = @context.registers[:site].config['baseurl'].to_s.sub(%r{/\z}, '')
    if url.start_with?('/') && !url.start_with?('//') &&
        !baseurl.empty? && url != baseurl && !url.start_with?("#{baseurl}/")
      url = "#{baseurl}#{url}"
    end

    Addressable::URI.join(post_url, url).to_s
  end

  def feed_article_link(fragment, post_url)
    paragraph = Nokogiri::XML::Node.new('p', fragment.document)
    link = Nokogiri::XML::Node.new('a', fragment.document)
    link['href'] = post_url
    link.content = 'View interactive content or media in the full article.'
    paragraph.add_child(link)
    paragraph
  end
end

Liquid::Template.register_filter(FeedContent)
