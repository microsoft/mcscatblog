---
name: mcscatblog-local-server
description: Start the local Jekyll dev server and open a post in the browser
---

# Local Dev Server

Start the Jekyll development server for the blog.

## Steps

1. Check if the server is already running at `http://127.0.0.1:4000/mcscatblog/`
2. If not running:
   - Check if dependencies are installed by running `bundle check`. If not, run `bundle install` first.
   - Run `./tools/run.sh` in the background
3. Wait for the server to be ready (poll until HTTP 200)
4. If an argument is provided (a post slug or filename), open that post's URL. Otherwise, open the homepage.

The server runs at `http://127.0.0.1:4000/mcscatblog/` with LiveReload enabled.

Posts are at `http://127.0.0.1:4000/mcscatblog/posts/<slug>/` where `<slug>` is the filename without the date prefix and `.md` extension.
