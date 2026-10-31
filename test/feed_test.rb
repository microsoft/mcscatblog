# frozen_string_literal: true

require 'fileutils'
require 'jekyll'
require 'minitest/autorun'
require 'minitest/mock'
require 'nokogiri'
require 'tmpdir'

require_relative '../_plugins/feed-content'
require_relative '../_plugins/posts-lastmod-hook'

class FeedTest < Minitest::Test
  NAMESPACES = { 'atom' => 'http://www.w3.org/2005/Atom' }.freeze
  SITE_URL = 'https://example.com'
  BASEURL = '/mcscatblog'

  def setup
    @directory = Dir.mktmpdir
    FileUtils.mkdir_p(File.join(@directory, 'assets'))
    FileUtils.mkdir_p(File.join(@directory, '_posts'))
    FileUtils.cp(File.expand_path('../assets/feed.xml', __dir__), File.join(@directory, 'assets/feed.xml'))

    (1..6).each do |day|
      File.write(File.join(@directory, "_posts/2026-01-0#{day}-post-#{day}.md"), <<~POST)
        ---
        title: 'Post #{day} & <examples>'
        author: 'Writer & Reader'
        categories: ['tools & examples']
        #{day == 6 ? "description: 'Summary & <details>'\nlast_modified_at: 2026-02-01" : ''}
        ---
        ## First heading

        Opening paragraph with **formatting** and &amp; entities.

        [Root asset](/assets/example.zip)
        [Based asset](/mcscatblog/assets/example.zip)
        [Relative asset](example.zip)
        [Section](#ending)
        [External](https://elsewhere.example/path?a=1&b=2)
        [Email](mailto:reader@example.com)
        ![Root image](/assets/example.png)
        ![Based image](/mcscatblog/assets/example.png)
        ![CDN image](//cdn.example.com/image.png)

        ```python
        if first < second:
            print("A & B")

            print("still indented")
        ```

        ```html
        <script src="/assets/example.js"></script>
        ```

        <iframe src="/assets/widget.html"></iframe>
        <video controls src="/assets/movie.mp4"></video>
        <audio controls src="/assets/audio.mp3"></audio>
        <script>window.example = "should not appear";</script>
        <style>.example { display: none; }</style>
        <link rel="stylesheet" href="/assets/example.css">
        <p onclick="alert(1)">Readable text</p>
        <a href="javascript:alert(1)">Unsafe link</a>

        ## Ending

        Final paragraph of article #{day}.
      POST
    end
    File.write(File.join(@directory, '_posts/2026-01-07-unpublished.md'), <<~POST)
      ---
      title: Unpublished
      published: false
      ---
      Do not publish this draft.
    POST

    config = Jekyll.configuration(
      'source' => @directory,
      'destination' => File.join(@directory, '_site'),
      'theme' => 'jekyll-theme-chirpy',
      'url' => SITE_URL,
      'baseurl' => BASEURL,
      'title' => 'Feed & <examples>',
      'description' => 'Description & <details>',
      'social' => { 'name' => 'Team & Contributors' },
      'permalink' => '/posts/:title/',
      'quiet' => true
    )
    @site = Jekyll::Site.new(config)
    # Fixture posts have no Git history; exercise their explicit timestamps instead.
    PostsLastmodHook.stub(:apply, nil) { @site.process }
    @xml = Nokogiri::XML(File.read(File.join(@directory, '_site/feed.xml'))) { |options| options.strict }
    @entries = @xml.xpath('/atom:feed/atom:entry', NAMESPACES)
    @content = Nokogiri::HTML.fragment(@entries.first.at_xpath('atom:content', NAMESPACES).text)
  end

  def teardown
    FileUtils.remove_entry(@directory)
  end

  def test_preserves_feed_url_and_latest_five_published_entry_ids
    assert_equal "#{SITE_URL}#{BASEURL}/feed.xml",
                 @xml.at_xpath('/atom:feed/atom:link[@rel="self"]', NAMESPACES)['href']
    assert_equal [6, 5, 4, 3, 2].map { |day| "#{SITE_URL}#{BASEURL}/posts/post-#{day}/" },
                 @entries.map { |entry| entry.at_xpath('atom:id', NAMESPACES).text }
    assert_equal 1, @site.pages.count { |page| page.url == '/feed.xml' }
    refute_includes @xml.to_xml, 'Unpublished'
  end

  def test_embeds_full_html_in_every_entry_instead_of_external_content
    @entries.each_with_index do |entry, index|
      content = entry.at_xpath('atom:content', NAMESPACES)
      assert_equal 'html', content['type']
      assert_nil content['src']
      body = Nokogiri::HTML.fragment(content.text)
      assert_equal 'formatting', body.at_css('strong').text
      assert_includes body.text, "Final paragraph of article #{6 - index}."
      assert_includes body.text, 'Opening paragraph'
    end
  end

  def test_escapes_metadata_and_content_once
    assert_equal 'Feed & <examples>', @xml.at_xpath('/atom:feed/atom:title', NAMESPACES).text
    entry = @entries.first
    assert_equal 'Post 6 & <examples>', entry.at_xpath('atom:title', NAMESPACES).text
    assert_equal 'Writer & Reader', entry.at_xpath('atom:author/atom:name', NAMESPACES).text
    assert_equal 'tools & examples', entry.at_xpath('atom:category', NAMESPACES)['term']
    assert_equal 'Summary & <details>', entry.at_xpath('atom:summary', NAMESPACES).text
    assert_includes @content.text, 'formatting and & entities.'
    assert_equal '2026-02-01', entry.at_xpath('atom:updated', NAMESPACES).text[0, 10]
    assert_equal '2026-01-06', entry.at_xpath('atom:published', NAMESPACES).text[0, 10]
  end

  def test_preserves_code_characters_indentation_and_blank_lines
    assert_equal <<~CODE, @content.at_css('pre code').text
      if first < second:
          print("A & B")

          print("still indented")
    CODE
    assert_includes @content.css('pre code').map(&:text), "<script src=\"/assets/example.js\"></script>\n"
  end

  def test_falls_back_to_publication_time_and_a_short_summary
    entry = @entries[1]
    assert_equal entry.at_xpath('atom:published', NAMESPACES).text,
                 entry.at_xpath('atom:updated', NAMESPACES).text
    summary = entry.at_xpath('atom:summary', NAMESPACES).text
    assert_includes summary, 'Opening paragraph'
    assert_operator summary.length, :<=, 400
    refute_includes summary, '<p>'
  end

  def test_absolutizes_urls_without_duplicating_the_base_path
    links = @content.css('a').to_h { |link| [link.text, link['href']] }
    assert_equal "#{SITE_URL}#{BASEURL}/assets/example.zip", links['Root asset']
    assert_equal links['Root asset'], links['Based asset']
    assert_equal "#{SITE_URL}#{BASEURL}/posts/post-6/example.zip", links['Relative asset']
    assert_equal "#{SITE_URL}#{BASEURL}/posts/post-6/#ending", links['Section']
    assert_equal 'https://elsewhere.example/path?a=1&b=2', links['External']
    assert_equal 'mailto:reader@example.com', links['Email']
    assert_equal ["#{SITE_URL}#{BASEURL}/assets/example.png",
                  "#{SITE_URL}#{BASEURL}/assets/example.png",
                  'https://cdn.example.com/image.png'], @content.css('img').map { |image| image['src'] }
  end

  def test_removes_executable_content_and_links_to_web_only_experiences
    assert_empty @content.css('script, style, link, iframe, video, audio')
    assert_empty @content.css('[onclick]')
    assert_nil @content.at_xpath('.//a[text()="Unsafe link"]')['href']
    refute_includes @content.text, 'should not appear'
    fallbacks = @content.css('a').select { |link| link.text.include?('View interactive content') }
    assert_equal 4, fallbacks.length
    assert fallbacks.all? { |link| link['href'] == "#{SITE_URL}#{BASEURL}/posts/post-6/" }
  end

  def test_supports_a_site_without_a_base_path
    @site.config['baseurl'] = ''
    template = Liquid::Template.parse('{{ html | feed_content: post_url }}')
    output = template.render!(
      { 'html' => '<img src="/assets/example.png"><a href="../other/">Other</a>',
        'post_url' => "#{SITE_URL}/posts/post-6/" },
      registers: { site: @site }
    )
    body = Nokogiri::HTML.fragment(output)
    assert_equal "#{SITE_URL}/assets/example.png", body.at_css('img')['src']
    assert_equal "#{SITE_URL}/posts/other/", body.at_css('a')['href']
  end
end
