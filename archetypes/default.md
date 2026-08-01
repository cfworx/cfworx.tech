---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
date: {{ .Date }}
# One or two sentences, ~120-155 characters. Shows up in search results,
# link previews, and llms.txt. Write it for a human skimming a results page.
description: ""
draft: true
---

<!--
New note checklist:
  1. Write it so future-you can re-learn the topic from this page alone.
  2. Fill in `description` above (needed for SEO + previews).
  3. Preview locally:  hugo server -D
  4. Set `draft: false` (or delete the line), commit, push. Done.
-->
