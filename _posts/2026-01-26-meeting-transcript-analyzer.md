---      
layout: post      
title: "VIDEO: Retrieve Meeting Transcripts in Copilot Studio & Block Focus Time"      
date: 2026-01-26 9:00:00 +0100      
categories: [copilot-studio, autonomous-agents, video]
tags: [microsoft-teams, outlook, meeting-transcripts, productivity, tutorial]
description: Watch an autonomous agent analyze your daily meeting transcripts and automatically block focus time for open action items.
author: giorgioughini
image:
  path: /assets/posts/meeting-transcript-analyzer/header.png
  alt: "Autonomous agent analyzing meeting transcripts visualization"
---

> **Heads up**: This is a **video-first** tutorial. The post provides the scenario context, but the real action is in the recording below.
{: .prompt-info }

We all face the same challenge: back-to-back meetings leave us with a pile of action items and no time to do them. By the time the day ends, we often forget half of what we promised to deliver.

This video demonstrates a powerful solution using an **autonomous agent in Copilot Studio**.

Instead of manually reviewing recordings or notes, I'll show you an agent designed to handle the post-meeting workload for you.

## The Scenario

In this video, we deploy an autonomous agent that runs automatically at the end of every working day. Its workflow is simple yet impactful:

1.  **Retrieves Transcripts**: The agent fetches all Microsoft Teams meeting transcripts for the specific day.
2.  **Analyzes Content**: It reviews each transcript to identify open points, action items, and clear takeaways.
3.  **Determines Effort**: Using its intelligence, the agent estimates the effort required to complete each task.
4.  **Takes Action**: If there are significant open points requiring deep work, the agent uses the **Outlook connector** to find available slots and block time in the user's calendar specifically for addressing those items.

Enjoy the video!

---

## Watch the demonstration

{% include embed/video.html
  src='https://github.com/GiorgioUghini/WebVideos/releases/download/video-2-1.0.0/Meeting.Transcript.Analyzer.mp4'
  poster='/assets/posts/meeting-transcript-analyzer/header-video.png'
  title='Video: Autonomous Agent for Meeting Analysis and Calendar Management'
  autoplay=false
  loop=false
  muted=false
%}

> Tip: Watch how the agent reasons over the transcript data to make scheduling decisions autonomously.
{: .prompt-tip }

---

## Why this matters

This example showcases the shift from simple chatbots to **autonomous agents** that can perform complex, multi-step workflows on your behalf. By integrating directly with Microsoft 365 data (Teams and Outlook), Copilot Studio enables you to build tools that not only answer questions but actively manage your workday.

If you enjoyed this practical look at autonomous agents, let me know directly or in the comments!