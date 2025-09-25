# MCS CAT Blog

## What is the purpose of this blog?
The Microsoft Copilot Studio (MCS) Customer Advisory Team (CAT) Blog is intended to be a **technical** notebook for sharing quick, practical patterns and snippets that are useful in customer scenarios but don’t fit into formal documentation or guidance. 

More specifically, this blog is meant to be:
- **Fast** - A **public self-controlled** platform where contributors can post without waiting for approvals or adhering to external publishing cadences. 
- **Semi-formal** - A place for **semi-formal content** like technical samples, workarounds, and implementation notes—that are too specific or low-level for official guidance. 
- **Collaborative** - A **collaborative space** where anyone can contribute, with the idea that mature patterns might eventually flow into formal documentation or guidance. 
- **Connected** - A way to **amplify original content**, such as personal videos or LinkedIn posts, provided the contributor adds meaningful value and doesn’t simply echo existing material.

This blog should not be used to compensate for missing or inaccurate documentation. Contributors should avoid cannibalizing formal guidance by clearly distinguishing between temporary specific patterns and stable high-level recommendations.

## What to post?

- How to use a specific combination of features in a specific use case
- Commentary on specific business use cases or agent approaches
- Point-in-time workarounds until a feature is released
- Detailed steps or updates to documentation that help resolve issues

## What not to post?

- General feature usage guides
- High-level guidance that belongs in formal documentation
- Content that compensates for missing or inaccurate documentation (fix the docs instead)

## What are the guidelines for contributing to the blog?

The blog is hosted on GitHub Pages under the https://github.com/microsoft/mcscatblog/. It uses Jekyll for static site generation and Chirpy as the theme.

How to contribute:
1. Join the repo: Share your GitHub username with Adi to be added as a contributor.
2. Clone the repo and create a new branch.
3. Write your post in Markdown (.md) format under the _posts folder.
  - Follow naming conventions: include the date and post name.
  - Include metadata (front matter): title, date, categories, tags, author info.
  - You can embed images, videos, and other static files.
4. Test locally using: bundle exec jekyll serve --livereload --baseurl /mcscatblog.
5. Submit a pull request and notify Adi for merging.

## Authoring tips

- Use https://chirpy.cotes.page/posts/write-a-new-post/ for formatting and embedding media.
- You can link your author profile to social accounts like Twitter/X, LinkedIn.
- GitHub Copilot (especially with the Opus model) can assist with writing posts, but it may miss some conventions, so review the guide manually.

Learn about writing new posts in Chirpy: [Writing a New Post](https://chirpy.cotes.page/posts/write-a-new-post/)

## Chirpy Theme Info

[![Gem Version](https://img.shields.io/gem/v/jekyll-theme-chirpy)][gem]&nbsp;
[![GitHub license](https://img.shields.io/github/license/cotes2020/chirpy-starter.svg?color=blue)][mit]

When installing the [**Chirpy**][chirpy] theme through [RubyGems.org][gem], Jekyll can only read files in the folders
`_data`, `_layouts`, `_includes`, `_sass` and `assets`, as well as a small part of options of the `_config.yml` file
from the theme's gem. If you have ever installed this theme gem, you can use the command
`bundle info --path jekyll-theme-chirpy` to locate these files.

The Jekyll team claims that this is to leave the ball in the user’s court, but this also results in users not being
able to enjoy the out-of-the-box experience when using feature-rich themes.

To fully use all the features of **Chirpy**, you need to copy the other critical files from the theme's gem to your
Jekyll site. The following is a list of targets:

```shell
.
├── _config.yml
├── _plugins
├── _tabs
└── index.html
```

To save you time, and also in case you lose some files while copying, we extract those files/configurations of the
latest version of the **Chirpy** theme and the [CD][CD] workflow to here, so that you can start writing in minutes.

## Usage

Check out the [theme's docs](https://github.com/cotes2020/jekyll-theme-chirpy/wiki).

## Contributing

This repository is automatically updated with new releases from the theme repository. If you encounter any issues or want to contribute to its improvement, please visit the [theme repository][chirpy] to provide feedback.

## License

This work is published under [MIT][mit] License.

[gem]: https://rubygems.org/gems/jekyll-theme-chirpy
[chirpy]: https://github.com/cotes2020/jekyll-theme-chirpy/
[CD]: https://en.wikipedia.org/wiki/Continuous_deployment
[mit]: https://github.com/cotes2020/chirpy-starter/blob/master/LICENSE
