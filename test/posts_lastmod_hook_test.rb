# frozen_string_literal: true

require 'fileutils'
require 'jekyll'
require 'minitest/autorun'
require 'open3'
require 'tmpdir'

require_relative '../_plugins/posts-lastmod-hook'

class PostsLastmodHookTest < Minitest::Test
  Post = Struct.new(:path, :data)

  def test_metacharacters_are_literal_and_last_modified_requires_two_commits
    Dir.mktmpdir do |repository|
      Dir.chdir(repository) do
        initialize_repository

        post_path = '_posts/2026-01-01-$(touch shell-owned)"; touch quote-owned; #.md'
        FileUtils.mkdir_p('_posts')
        File.write(post_path, "first version\n")
        commit(post_path, 'Add post')

        post = Post.new(post_path, {})
        PostsLastmodHook.apply(post)

        refute post.data.key?('last_modified_at')
        refute File.exist?('shell-owned')
        refute File.exist?('quote-owned')

        File.write(post_path, "second version\n")
        commit(post_path, 'Update post')

        PostsLastmodHook.apply(post)

        assert_match(/\A\d{4}-\d{2}-\d{2}/, post.data.fetch('last_modified_at'))
        refute File.exist?('shell-owned')
        refute File.exist?('quote-owned')
      end
    end
  end

  def test_git_failure_stops_the_build_with_a_clear_error
    Dir.mktmpdir do |directory|
      Dir.chdir(directory) do
        error = assert_raises(Jekyll::Errors::FatalException) do
          PostsLastmodHook.apply(Post.new('_posts/2026-01-01-example.md', {}))
        end

        assert_includes error.message, 'git rev-list failed'
        assert_includes error.message, 'exit 128'
      end
    end
  end

  private

  def initialize_repository
    git!('init', '--quiet')
    git!('config', 'user.email', 'test@example.com')
    git!('config', 'user.name', 'Test Author')
  end

  def commit(path, message)
    git!('add', '--', path)
    git!('commit', '--quiet', '-m', message)
  end

  def git!(*arguments)
    _stdout, stderr, status = Open3.capture3('git', *arguments)
    return if status.success?

    raise "git #{arguments.first} failed: #{stderr}"
  end
end
