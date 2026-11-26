# Put Paño on your website

Paño is a red cartoon cat who walks onto your website and helps your visitors. He says hello, and when a visitor taps him he offers a short menu: *How do I book a class? Where are you? What do you make?* Pick one and he walks over to the right spot on the page, puts a ring around it and explains it, step by step.

- **You choose what he helps with:** three things visitors come to your site to do. Each one becomes a guided tour.
- **You choose his name, his colors and how he talks.** He only ever says what you've written for him. There is no AI chat, no account and no API key.
- **Extras:** he can let visitors change the background behind your page, and switch on a colorblind mode for the whole site.
- **Phones and computers:** he works at every screen size.

To see him, open the example site in [`example/`](example/) (online at `https://marquisphill.github.io/Pano/kit/example/`): a made-up pottery studio, with Paño (called Pip there) fully set up.

## What you need

- A website made of HTML pages that you can edit, on any host. GitHub Pages works well, and is free.
- An AI assistant that can read and edit your site's files, such as Claude Code.

Not yet supported: sites built as a JavaScript app (React, Next.js, Vue) and site builders that don't let you edit the HTML (such as Wix or Squarespace).

## How to set him up

Open your AI assistant in your site's folder or repository and paste this:

> Put Paño the cat on my website. Read kit/SETUP.md in github.com/marquisphill/Pano and follow it. If you can't open web pages, clone https://github.com/marquisphill/Pano and read it there.

It will ask you six questions:

1. What your site is, and who visits it.
2. The 3 things Paño should help visitors do.
3. His name and colors.
4. His tone, and the language he speaks.
5. Whether he should offer the background changer.
6. Anything he must never say.

Then it reads your site, shows you its plan for the 3 tours, adds him and checks that every tour works on a phone and a computer. It adds a small `pano/` folder to your site and four lines to each page. Paño's own code stays here and is loaded from `marquisphill.github.io`, so it is never copied into your site.

## Changing him later

Everything he says is in `pano/brain.json` in your site. Change a line, save, and he says the new one. [BRAIN.md](BRAIN.md) explains every part of the file. After a change, open your site, open the browser's console and type `Pano.check()`: it lists anything that is wrong. Or ask your AI assistant to make the change and check it.

## Removing him

Delete the `pano/` folder and the four Paño lines from each page.

## Privacy

Paño keeps a few small things in each visitor's own browser: whether he has said hello in this tab, and which background they chose. Nothing is sent anywhere, and he sets no cookies.
