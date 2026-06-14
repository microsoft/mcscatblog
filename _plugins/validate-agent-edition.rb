#!/usr/bin/env ruby
#
# LOCAL CUSTOMIZATION (not part of the Chirpy theme).
# Fails the build if any published post is missing a valid `agent_edition`
# front-matter value. This keeps the Classic vs. Modern Copilot Studio agent
# distinction explicit on every post (it drives the edition pill rendered in
# _layouts/post.html). See README "Theme customizations".

ALLOWED_AGENT_EDITIONS = %w[classic modern both].freeze

Jekyll::Hooks.register :site, :post_read do |site|
  offenders = []

  site.posts.docs.each do |post|
    value = post.data['agent_edition']
    normalized = value.to_s.downcase.strip

    next if ALLOWED_AGENT_EDITIONS.include?(normalized)

    # Path relative to the site source, for a readable error message.
    rel_path = post.path.sub(/\A#{Regexp.escape(site.source)}\/?/, '')

    offenders << if value.nil? || normalized.empty?
                   "  - #{rel_path}: missing `agent_edition`"
                 else
                   "  - #{rel_path}: invalid `agent_edition: #{value}`"
                 end
  end

  next if offenders.empty?

  message = +"Build failed: every post must set `agent_edition` to one of " \
             "#{ALLOWED_AGENT_EDITIONS.join(' or ')}.\n"
  message << offenders.join("\n")
  message << "\n\nAdd `agent_edition: classic` (or `modern`) to the front matter " \
             "of each post listed above."

  raise message
end
