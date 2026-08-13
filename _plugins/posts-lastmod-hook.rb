#!/usr/bin/env ruby
#
# Check for changed posts

require 'open3'

module PostsLastmodHook
  module_function

  def apply(post)
    commit_num = git_output!('rev-list', '--count', 'HEAD', path: post.path)

    return unless commit_num.to_i > 1

    post.data['last_modified_at'] = git_output!(
      'log',
      '-1',
      '--pretty=%ad',
      '--date=iso',
      path: post.path
    ).strip
  end

  def git_output!(*arguments, path:)
    stdout, stderr, status = Open3.capture3('git', *arguments, '--', path)
    return stdout if status.success?

    message = "git #{arguments.first} failed for #{path.inspect} (exit #{status.exitstatus})"
    details = stderr.strip
    message = "#{message}: #{details}" unless details.empty?

    raise Jekyll::Errors::FatalException, message
  end
end

Jekyll::Hooks.register :posts, :post_init do |post|
  PostsLastmodHook.apply(post)
end
